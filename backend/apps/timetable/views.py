from rest_framework import viewsets, permissions
from apps.accounts.permissions import ResourcePermission, user_has_resource_permission
from .models import Timetable
from .serializers import TimetableSerializer


class TimetableViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableSerializer
    resource_name = 'timetable'
    permission_classes = [ResourcePermission]
    filterset_fields = ['section', 'subject', 'teacher', 'day_of_week']
    search_fields = ['section__name', 'subject__name', 'teacher__first_name', 'teacher__last_name', 'classroom']

    def get_queryset(self):
        user = self.request.user
        qs = Timetable.objects.all().select_related('section__class_level', 'subject', 'teacher')
        if user.is_superuser or user_has_resource_permission(user, 'timetable', 'read'):
            return qs
        if user.role and user.role.name == 'teacher' and hasattr(user, 'teacher_profile'):
            return qs.filter(teacher=user.teacher_profile)
        if user.role and user.role.name == 'student' and hasattr(user, 'student_profile'):
            active_section_ids = user.student_profile.enrollments.values_list('section_id', flat=True)
            return qs.filter(section_id__in=active_section_ids)
        if user.role and user.role.name == 'parent' and hasattr(user, 'parent_profile'):
            children_section_ids = [
                s.id for link in user.parent_profile.child_links.all()
                for s in link.student.enrollments.values_list('section_id', flat=True)
            ]
            return qs.filter(section_id__in=children_section_ids)
        return qs
