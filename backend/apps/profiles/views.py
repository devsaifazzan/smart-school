from rest_framework import viewsets, permissions
from apps.accounts.permissions import IsStaffOrReadOnly, ResourcePermission, user_has_resource_permission
from .models import StudentProfile, TeacherProfile, ParentProfile, StudentParent
from .serializers import (
    StudentProfileSerializer, StudentCreateSerializer, TeacherProfileSerializer,
    ParentProfileSerializer, StudentParentSerializer
)


class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    resource_name = 'students'
    permission_classes = [ResourcePermission]
    search_fields = ['first_name', 'last_name', 'national_id', 'phone_number']

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        return StudentProfileSerializer

    def get_queryset(self):
        user = self.request.user
        qs = StudentProfile.objects.all().select_related('user').prefetch_related(
            'enrollments__section__class_level', 'enrollments__academic_year', 'guardian_links__parent'
        )
        if user.is_superuser or user_has_resource_permission(user, 'students', 'read'):
            return qs
        if user.role and user.role.name.lower() == 'parent' and hasattr(user, 'parent_profile'):
            return qs.filter(guardian_links__parent=user.parent_profile)
        if user.role and user.role.name.lower() == 'student' and hasattr(user, 'student_profile'):
            return qs.filter(id=user.student_profile.id)
        return qs.none()


class TeacherProfileViewSet(viewsets.ModelViewSet):
    queryset = TeacherProfile.objects.all().select_related('user')
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsStaffOrReadOnly]
    search_fields = ['first_name', 'last_name', 'user__email']


class ParentProfileViewSet(viewsets.ModelViewSet):
    queryset = ParentProfile.objects.all().select_related('user').prefetch_related('child_links__student')
    serializer_class = ParentProfileSerializer
    permission_classes = [IsStaffOrReadOnly]
    search_fields = ['first_name', 'last_name', 'phone_number']


class StudentParentViewSet(viewsets.ModelViewSet):
    queryset = StudentParent.objects.all().select_related('student', 'parent')
    serializer_class = StudentParentSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ['student', 'parent']
