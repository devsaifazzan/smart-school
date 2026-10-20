from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.db import transaction

from .models import Role, RolePermission, User
from .serializers import RoleSerializer, RolePermissionSerializer, UserSerializer, LoginSerializer
from .permissions import IsAdminUserRole, ResourcePermission, get_user_permissions, STANDARD_RESOURCES


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = None
        try:
            candidate = User.objects.get(username=username)
            if candidate.check_password(password):
                user = candidate
        except User.DoesNotExist:
            try:
                candidate = User.objects.get(email=username)
                if candidate.check_password(password):
                    user = candidate
            except User.DoesNotExist:
                user = None

        if not user:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'This account is deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)

        # Profile context
        profile_data = None
        if hasattr(user, 'student_profile'):
            profile_data = {'type': 'student', 'id': user.student_profile.id, 'name': user.student_profile.full_name}
        elif hasattr(user, 'teacher_profile'):
            profile_data = {'type': 'teacher', 'id': user.teacher_profile.id, 'name': user.teacher_profile.full_name}
        elif hasattr(user, 'parent_profile'):
            profile_data = {'type': 'parent', 'id': user.parent_profile.id, 'name': user.parent_profile.full_name}

        perms_info = get_user_permissions(user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role.name if user.role else 'user',
                'profile': profile_data,
                'permissions': perms_info['matrix'],
                'accessible_modules': perms_info['accessible_modules'],
            }
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile_data = None
        if hasattr(user, 'student_profile'):
            profile_data = {'type': 'student', 'id': user.student_profile.id, 'name': user.student_profile.full_name}
        elif hasattr(user, 'teacher_profile'):
            profile_data = {'type': 'teacher', 'id': user.teacher_profile.id, 'name': user.teacher_profile.full_name}
        elif hasattr(user, 'parent_profile'):
            profile_data = {'type': 'parent', 'id': user.parent_profile.id, 'name': user.parent_profile.full_name}

        perms_info = get_user_permissions(user)

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.name if user.role else 'user',
            'profile': profile_data,
            'permissions': perms_info['matrix'],
            'accessible_modules': perms_info['accessible_modules'],
        })


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().prefetch_related('permissions', 'users')
    serializer_class = RoleSerializer
    resource_name = 'roles'
    permission_classes = [ResourcePermission]

    @action(detail=True, methods=['get', 'post'], url_path='permissions')
    def manage_permissions(self, request, pk=None):
        role = self.get_object()

        if request.method == 'GET':
            # Ensure standard resources exist for this role
            for res_name in STANDARD_RESOURCES:
                is_admin_role = role.name.lower() in ('admin', 'super_admin')
                RolePermission.objects.get_or_create(
                    role=role,
                    resource_name=res_name,
                    defaults={
                        'can_create': is_admin_role,
                        'can_read': True,
                        'can_update': is_admin_role,
                        'can_delete': is_admin_role,
                    }
                )
            perms = RolePermission.objects.filter(role=role).order_by('resource_name')
            return Response(RolePermissionSerializer(perms, many=True).data)

        elif request.method == 'POST':
            # Save batch of permissions
            permissions_list = request.data
            if not isinstance(permissions_list, list):
                return Response({'detail': 'Expected a list of permission objects.'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                saved = []
                for p_data in permissions_list:
                    res_name = p_data.get('resource_name')
                    if not res_name:
                        continue
                    perm_obj, _ = RolePermission.objects.update_or_create(
                        role=role,
                        resource_name=res_name,
                        defaults={
                            'can_create': bool(p_data.get('can_create', False)),
                            'can_read': bool(p_data.get('can_read', False)),
                            'can_update': bool(p_data.get('can_update', False)),
                            'can_delete': bool(p_data.get('can_delete', False)),
                        }
                    )
                    saved.append(perm_obj)

            return Response(RolePermissionSerializer(saved, many=True).data, status=status.HTTP_200_OK)


class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all().select_related('role')
    serializer_class = RolePermissionSerializer
    resource_name = 'roles'
    permission_classes = [ResourcePermission]
    filterset_fields = ['role', 'resource_name']


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('role').order_by('id')
    serializer_class = UserSerializer
    resource_name = 'users'
    permission_classes = [ResourcePermission]
    filterset_fields = ['role__name', 'is_active']
    search_fields = ['username', 'email']

    @action(detail=True, methods=['post'], url_path='set-password')
    def set_user_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('password')
        if not new_password or len(new_password) < 4:
            return Response({'password': 'Password must be at least 4 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': f'Password updated successfully for {user.username}.'})

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'id': user.id,
            'username': user.username,
            'is_active': user.is_active,
            'message': f"Account {'activated' if user.is_active else 'deactivated'}."
        })
