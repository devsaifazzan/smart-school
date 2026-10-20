from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from collections import defaultdict
from apps.accounts.permissions import ResourcePermission, user_has_resource_permission
from .models import ExamType, Mark
from .serializers import ExamTypeSerializer, MarkSerializer
from apps.profiles.models import StudentProfile


class ExamTypeViewSet(viewsets.ModelViewSet):
    queryset = ExamType.objects.all()
    serializer_class = ExamTypeSerializer
    resource_name = 'exams'
    permission_classes = [ResourcePermission]
    search_fields = ['name']


class MarkViewSet(viewsets.ModelViewSet):
    serializer_class = MarkSerializer
    resource_name = 'exams'
    permission_classes = [ResourcePermission]
    filterset_fields = ['student', 'subject', 'exam_type', 'term']
    search_fields = ['student__first_name', 'student__last_name', 'subject__name']

    def get_queryset(self):
        user = self.request.user
        qs = Mark.objects.all().select_related('student', 'subject', 'exam_type', 'term')
        if user.is_superuser or user_has_resource_permission(user, 'exams', 'read'):
            return qs
        if user.role and user.role.name == 'student' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        if user.role and user.role.name == 'parent' and hasattr(user, 'parent_profile'):
            children_ids = user.parent_profile.child_links.values_list('student_id', flat=True)
            return qs.filter(student_id__in=children_ids)
        return qs.none()

    @action(detail=False, methods=['get'], url_path='report-card')
    def report_card(self, request):
        student_id = request.query_params.get('student_id')
        term_id = request.query_params.get('term_id')

        if not student_id:
            return Response({'detail': 'student_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Scoping check
        user = request.user
        if not user.is_superuser and user.role and user.role.name == 'student':
            if not hasattr(user, 'student_profile') or str(user.student_profile.id) != str(student_id):
                return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
        elif not user.is_superuser and user.role and user.role.name == 'parent':
            child_ids = [str(x) for x in user.parent_profile.child_links.values_list('student_id', flat=True)]
            if str(student_id) not in child_ids:
                return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            student = StudentProfile.objects.get(pk=student_id)
        except StudentProfile.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        marks_qs = Mark.objects.filter(student=student).select_related('subject', 'exam_type', 'term')
        if term_id:
            marks_qs = marks_qs.filter(term_id=term_id)

        # Group by subject
        subjects_data = defaultdict(lambda: {'assessments': [], 'total_earned': 0.0, 'total_max': 0.0})
        for m in marks_qs:
            subjects_data[m.subject.name]['code'] = m.subject.code
            subjects_data[m.subject.name]['assessments'].append({
                'exam_type': m.exam_type.name,
                'weight': m.exam_type.weight_percentage,
                'score': m.score,
                'max_score': m.max_score,
                'percentage': m.percentage
            })
            subjects_data[m.subject.name]['total_earned'] += m.score
            subjects_data[m.subject.name]['total_max'] += m.max_score

        formatted_subjects = []
        overall_score = 0.0
        overall_max = 0.0

        for subject_name, data in subjects_data.items():
            tot_earned = data['total_earned']
            tot_max = data['total_max']
            subj_pct = round((tot_earned / tot_max * 100.0), 2) if tot_max > 0 else 0.0

            # Grade letter determination
            if subj_pct >= 90:
                grade_letter = 'A'
            elif subj_pct >= 80:
                grade_letter = 'B'
            elif subj_pct >= 70:
                grade_letter = 'C'
            elif subj_pct >= 60:
                grade_letter = 'D'
            else:
                grade_letter = 'F'

            formatted_subjects.append({
                'subject': subject_name,
                'code': data.get('code', ''),
                'assessments': data['assessments'],
                'subject_score': tot_earned,
                'subject_max': tot_max,
                'percentage': subj_pct,
                'grade': grade_letter
            })
            overall_score += tot_earned
            overall_max += tot_max

        overall_percentage = round((overall_score / overall_max * 100.0), 2) if overall_max > 0 else 0.0

        return Response({
            'student_id': student.id,
            'student_name': student.full_name,
            'subjects': formatted_subjects,
            'overall_score': overall_score,
            'overall_max': overall_max,
            'overall_percentage': overall_percentage,
            'total_subjects': len(formatted_subjects)
        })
