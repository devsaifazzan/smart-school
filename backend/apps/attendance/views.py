from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from apps.accounts.permissions import ResourcePermission, user_has_resource_permission
from .models import Attendance
from .serializers import AttendanceSerializer, BulkAttendanceCreateSerializer
from apps.timetable.models import Timetable
from apps.profiles.models import StudentProfile


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    resource_name = 'attendance'
    permission_classes = [ResourcePermission]
    filterset_fields = ['student', 'timetable', 'date', 'status']
    search_fields = ['student__first_name', 'student__last_name', 'remarks']

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.all().select_related('student', 'timetable__subject', 'timetable__section')
        if user.is_superuser or user_has_resource_permission(user, 'attendance', 'read'):
            return qs
        if user.role and user.role.name == 'teacher' and hasattr(user, 'teacher_profile'):
            return qs.filter(timetable__teacher=user.teacher_profile)
        if user.role and user.role.name == 'student' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        if user.role and user.role.name == 'parent' and hasattr(user, 'parent_profile'):
            children_ids = user.parent_profile.child_links.values_list('student_id', flat=True)
            return qs.filter(student_id__in=children_ids)
        return qs

    @action(detail=False, methods=['post'], url_path='bulk-mark')
    def bulk_mark(self, request):
        serializer = BulkAttendanceCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        timetable_id = serializer.validated_data['timetable_id']
        date = serializer.validated_data['date']
        entries = serializer.validated_data['entries']

        try:
            timetable = Timetable.objects.get(pk=timetable_id)
        except Timetable.DoesNotExist:
            return Response({'detail': 'Timetable entry not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Validate permission if user is teacher
        user = request.user
        if not user.is_superuser and user.role and user.role.name == 'teacher':
            if not hasattr(user, 'teacher_profile') or timetable.teacher != user.teacher_profile:
                return Response({'detail': 'You can only record attendance for your own classes.'}, status=status.HTTP_403_FORBIDDEN)

        saved_records = []
        for entry in entries:
            student_id = entry['student_id']
            status_val = entry['status']
            remarks_val = entry.get('remarks', '')

            record, _ = Attendance.objects.update_or_create(
                student_id=student_id,
                timetable=timetable,
                date=date,
                defaults={
                    'status': status_val,
                    'remarks': remarks_val,
                }
            )
            saved_records.append(record)

        return Response({
            'message': f'Successfully updated attendance for {len(saved_records)} students.',
            'count': len(saved_records)
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        qs = self.get_queryset()
        total = qs.count()
        if total == 0:
            return Response({
                'total': 0,
                'present': 0,
                'absent': 0,
                'late': 0,
                'excused': 0,
                'attendance_rate': 0.0
            })

        counts = qs.aggregate(
            present=Count('id', filter=Q(status='Present')),
            absent=Count('id', filter=Q(status='Absent')),
            late=Count('id', filter=Q(status='Late')),
            excused=Count('id', filter=Q(status='Excused')),
        )
        present = counts['present'] or 0
        absent = counts['absent'] or 0
        late = counts['late'] or 0
        excused = counts['excused'] or 0

        rate = round((present / total) * 100.0, 1) if total > 0 else 0.0

        return Response({
            'total': total,
            'present': present,
            'absent': absent,
            'late': late,
            'excused': excused,
            'attendance_rate': rate
        })
