from rest_framework import viewsets
from apps.accounts.permissions import ResourcePermission
from .models import AcademicYear, Term, ClassLevel, Section, Subject, Enrollment
from .serializers import (
    AcademicYearSerializer, TermSerializer, ClassLevelSerializer,
    SectionSerializer, SubjectSerializer, EnrollmentSerializer
)


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    resource_name = 'academics'
    permission_classes = [ResourcePermission]
    filterset_fields = ['is_active']
    search_fields = ['name']


class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all().select_related('academic_year')
    serializer_class = TermSerializer
    resource_name = 'academics'
    permission_classes = [ResourcePermission]
    filterset_fields = ['academic_year']
    search_fields = ['name']


class ClassLevelViewSet(viewsets.ModelViewSet):
    queryset = ClassLevel.objects.all().prefetch_related('sections')
    serializer_class = ClassLevelSerializer
    resource_name = 'academics'
    permission_classes = [ResourcePermission]
    search_fields = ['name']


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all().select_related('class_level')
    serializer_class = SectionSerializer
    resource_name = 'academics'
    permission_classes = [ResourcePermission]
    filterset_fields = ['class_level']
    search_fields = ['name']


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    resource_name = 'academics'
    permission_classes = [ResourcePermission]
    search_fields = ['name', 'code']


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().select_related('student', 'section__class_level', 'academic_year')
    serializer_class = EnrollmentSerializer
    resource_name = 'academics'
    permission_classes = [ResourcePermission]
    filterset_fields = ['section', 'academic_year', 'student']
    search_fields = ['student__first_name', 'student__last_name', 'section__name']
