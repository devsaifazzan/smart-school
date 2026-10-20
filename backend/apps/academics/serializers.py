from rest_framework import serializers
from .models import AcademicYear, Term, ClassLevel, Section, Subject, Enrollment


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active']


class TermSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Term
        fields = ['id', 'academic_year', 'academic_year_name', 'name', 'start_date', 'end_date']


class SectionSerializer(serializers.ModelSerializer):
    class_level_name = serializers.CharField(source='class_level.name', read_only=True)
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ['id', 'class_level', 'class_level_name', 'name', 'capacity', 'enrolled_count']

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()


class ClassLevelSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = ClassLevel
        fields = ['id', 'name', 'sections']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    class_level_name = serializers.CharField(source='section.class_level.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'section', 'section_name',
            'class_level_name', 'academic_year', 'academic_year_name'
        ]
