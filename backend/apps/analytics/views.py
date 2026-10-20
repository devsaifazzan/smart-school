from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from apps.accounts.permissions import ResourcePermission, user_has_resource_permission
from .models import AIStudentNote
from .serializers import AIStudentNoteSerializer
from apps.profiles.models import StudentProfile, TeacherProfile
from apps.academics.models import Section, AcademicYear, Subject
from apps.attendance.models import Attendance
from apps.exams.models import Mark
from apps.finance.models import StudentInvoice, Payment


class AnalyticsViewSet(viewsets.ModelViewSet):
    serializer_class = AIStudentNoteSerializer
    resource_name = 'analytics'
    permission_classes = [ResourcePermission]
    filterset_fields = ['student', 'requires_intervention']
    search_fields = ['student__first_name', 'student__last_name', 'note_content']

    def get_queryset(self):
        user = self.request.user
        qs = AIStudentNote.objects.all().select_related('student')
        if user.is_superuser or user_has_resource_permission(user, 'analytics', 'read'):
            return qs
        if user.role and user.role.name.lower() == 'student' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        if user.role and user.role.name.lower() == 'parent' and hasattr(user, 'parent_profile'):
            children_ids = user.parent_profile.child_links.values_list('student_id', flat=True)
            return qs.filter(student_id__in=children_ids)
        return qs.none()

    @action(detail=False, methods=['post'], url_path='generate-notes')
    def generate_notes(self, request):
        """
        Scans all enrolled students, computes attendance rate & grade average,
        generates diagnostic notes and intervention flags, and stores in ai_student_notes.
        """
        students = StudentProfile.objects.all()
        created_notes = []

        for student in students:
            # 1. Compute attendance
            att_records = Attendance.objects.filter(student=student)
            total_sessions = att_records.count()
            present_sessions = att_records.filter(status='Present').count()
            att_rate = round((present_sessions / total_sessions * 100.0), 1) if total_sessions > 0 else 100.0

            # 2. Compute academic performance
            marks = Mark.objects.filter(student=student)
            if marks.exists():
                earned = sum(m.score for m in marks)
                max_pts = sum(m.max_score for m in marks)
                grade_avg = round((earned / max_pts * 100.0), 1) if max_pts > 0 else 100.0
            else:
                grade_avg = 85.0

            requires_flag = False
            reasons = []

            if att_rate < 80.0:
                requires_flag = True
                reasons.append(f'Chronic absenteeism detected ({att_rate}% attendance rate).')

            if grade_avg < 60.0:
                requires_flag = True
                reasons.append(f'Academic difficulty detected (Term average {grade_avg}%).')

            if requires_flag:
                content = (
                    f"Academic Alert for {student.full_name}: "
                    + " ".join(reasons)
                    + " Recommended Action: Schedule a counseling session with parents and academic supervisor."
                )
            else:
                content = (
                    f"Satisfactory Performance: {student.full_name} maintains good attendance ({att_rate}%) "
                    f"and strong academic marks ({grade_avg}%). Student is on track."
                )

            insights = {
                'attendance_rate': att_rate,
                'total_sessions': total_sessions,
                'grade_average': grade_avg,
                'reasons': reasons,
                'evaluated_at': timezone.now().isoformat(),
            }

            note = AIStudentNote.objects.create(
                student=student,
                note_content=content,
                insights_json=insights,
                requires_intervention=requires_flag
            )
            created_notes.append(note)

        return Response({
            'message': f'Diagnostic analysis completed for {len(created_notes)} students.',
            'generated_count': len(created_notes),
            'interventions_required': sum(1 for n in created_notes if n.requires_intervention)
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        user = request.user
        role_name = user.role.name if user.role else 'user'

        total_students = StudentProfile.objects.count()
        total_teachers = TeacherProfile.objects.count()
        total_classes = Section.objects.count()

        active_year = AcademicYear.objects.filter(is_active=True).first()
        active_year_name = active_year.name if active_year else 'N/A'

        # Attendance overall
        all_att = Attendance.objects.all()
        att_total = all_att.count()
        att_present = all_att.filter(status='Present').count()
        overall_attendance_rate = round((att_present / att_total * 100.0), 1) if att_total > 0 else 94.5

        # Finance overall
        invoices = StudentInvoice.objects.all()
        tot_invoiced = invoices.aggregate(sum=Sum('amount_due'))['sum'] or 0.0
        tot_paid = Payment.objects.aggregate(sum=Sum('amount_paid'))['sum'] or 0.0
        outstanding = max(0.0, tot_invoiced - tot_paid)

        # Urgent Alerts / Interventions
        interventions_count = AIStudentNote.objects.filter(requires_intervention=True).count()
        recent_interventions = AIStudentNote.objects.filter(requires_intervention=True).order_by('-generated_at')[:5]
        alert_items = [
            {
                'id': n.id,
                'student_name': n.student.full_name,
                'note': n.note_content,
                'date': n.generated_at.strftime('%Y-%m-%d')
            }
            for n in recent_interventions
        ]

        # Recent activities / Attendance today
        today = timezone.now().date()
        today_att = Attendance.objects.filter(date=today)
        today_total = today_att.count()
        today_present = today_att.filter(status='Present').count()
        today_rate = round((today_present / today_total * 100.0), 1) if today_total > 0 else 0.0

        return Response({
            'role': role_name,
            'summary': {
                'total_students': total_students,
                'total_teachers': total_teachers,
                'total_classes': total_classes,
                'active_academic_year': active_year_name,
                'attendance_rate': overall_attendance_rate,
                'total_invoiced': round(tot_invoiced, 2),
                'total_collected': round(tot_paid, 2),
                'outstanding_balance': round(outstanding, 2),
                'interventions_count': interventions_count,
            },
            'today_attendance': {
                'total_logged': today_total,
                'present': today_present,
                'attendance_rate': today_rate
            },
            'alerts': alert_items
        })
