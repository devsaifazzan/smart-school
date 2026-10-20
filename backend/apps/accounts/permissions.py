from rest_framework import permissions
from .models import RolePermission

STANDARD_RESOURCES = [
    'students',
    'academics',
    'timetable',
    'attendance',
    'exams',
    'finance',
    'analytics',
    'users',
    'roles',
]


def user_has_resource_permission(user, resource_name, action='read'):
    """
    Check if a user has permission for a specific resource and action.
    action: 'read' | 'create' | 'update' | 'delete'
    """
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if not user.role:
        return False

    role_name = user.role.name.lower()
    if role_name in ('admin', 'super_admin'):
        return True

    # Check database RolePermission
    field_name = f'can_{action}'
    perm = RolePermission.objects.filter(role=user.role, resource_name=resource_name).first()
    if perm:
        return bool(getattr(perm, field_name, False))

    # Built-in fallback heuristics for default roles if not explicitly customized
    if role_name == 'teacher':
        if resource_name in ('exams', 'attendance', 'timetable'):
            return action in ('read', 'create', 'update')
        if resource_name in ('students', 'academics'):
            return action == 'read'
    elif role_name == 'student':
        if resource_name in ('exams', 'attendance', 'timetable', 'academics', 'finance'):
            return action == 'read'

    return False


def get_user_permissions(user):
    """
    Return dictionary mapping resource_name -> {can_read, can_create, can_update, can_delete}
    along with a list of accessible modules.
    """
    if not user or not user.is_authenticated:
        return {'matrix': {}, 'accessible_modules': []}

    is_full_admin = user.is_superuser or (user.role and user.role.name.lower() in ('admin', 'super_admin'))
    if is_full_admin:
        matrix = {
            res: {'can_read': True, 'can_create': True, 'can_update': True, 'can_delete': True}
            for res in STANDARD_RESOURCES
        }
        return {'matrix': matrix, 'accessible_modules': STANDARD_RESOURCES}

    if not user.role:
        return {'matrix': {}, 'accessible_modules': []}

    perms_qs = RolePermission.objects.filter(role=user.role)
    perm_map = {p.resource_name: p for p in perms_qs}

    matrix = {}
    accessible_modules = []

    for res in STANDARD_RESOURCES:
        p = perm_map.get(res)
        if p:
            can_read = bool(p.can_read)
            can_create = bool(p.can_create)
            can_update = bool(p.can_update)
            can_delete = bool(p.can_delete)
        else:
            # Check default heuristic
            can_read = user_has_resource_permission(user, res, 'read')
            can_create = user_has_resource_permission(user, res, 'create')
            can_update = user_has_resource_permission(user, res, 'update')
            can_delete = user_has_resource_permission(user, res, 'delete')

        matrix[res] = {
            'can_read': can_read,
            'can_create': can_create,
            'can_update': can_update,
            'can_delete': can_delete,
        }
        if can_read:
            accessible_modules.append(res)

    return {'matrix': matrix, 'accessible_modules': accessible_modules}


class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return bool(request.user.role and request.user.role.name.lower() in ('admin', 'super_admin', 'school_admin'))


class IsTeacherRole(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return bool(request.user.role and request.user.role.name.lower() in ('admin', 'super_admin', 'school_admin', 'teacher'))


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user.is_superuser or
            (request.user.role and request.user.role.name.lower() in ('admin', 'super_admin', 'school_admin'))
        )


class ResourcePermission(permissions.BasePermission):
    """
    Enforces dynamic CRUD permissions based on view.resource_name and the user's role permissions.
    """
    resource_name = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        res = getattr(view, 'resource_name', self.resource_name)
        if not res:
            return True

        if request.method in permissions.SAFE_METHODS:
            return user_has_resource_permission(request.user, res, 'read')
        elif request.method == 'POST':
            return user_has_resource_permission(request.user, res, 'create')
        elif request.method in ('PUT', 'PATCH'):
            return user_has_resource_permission(request.user, res, 'update')
        elif request.method == 'DELETE':
            return user_has_resource_permission(request.user, res, 'delete')
        return False
