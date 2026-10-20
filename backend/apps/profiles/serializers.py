from rest_framework import serializers
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from .models import StudentProfile, TeacherProfile, ParentProfile, StudentParent


class StudentParentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    parent_name = serializers.CharField(source='parent.full_name', read_only=True)
    parent_phone = serializers.CharField(source='parent.phone_number', read_only=True)

    class Meta:
        model = StudentParent
        fields = ['student', 'student_name', 'parent', 'parent_name', 'parent_phone']


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.CharField(read_only=True)
    current_section = serializers.SerializerMethodField()
    guardians = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'enrollment_date', 'gender', 'blood_type',
            'national_id', 'address', 'phone_number', 'medical_conditions',
            'current_section', 'guardians'
        ]

    def get_current_section(self, obj):
        active_enrollment = obj.enrollments.filter(academic_year__is_active=True).first()
        if not active_enrollment:
            active_enrollment = obj.enrollments.order_by('-academic_year__start_date').first()
        if active_enrollment:
            return {
                'id': active_enrollment.section.id,
                'name': active_enrollment.section.name,
                'class_level': active_enrollment.section.class_level.name,
                'academic_year': active_enrollment.academic_year.name,
            }
        return None

    def get_guardians(self, obj):
        return [
            {
                'id': link.parent.id,
                'name': link.parent.full_name,
                'phone': link.parent.phone_number,
            }
            for link in obj.guardian_links.select_related('parent').all()
        ]


class TeacherProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = TeacherProfile
        fields = ['id', 'user', 'username', 'email', 'first_name', 'last_name', 'full_name', 'hire_date']


class ParentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.CharField(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = ParentProfile
        fields = ['id', 'user', 'username', 'email', 'first_name', 'last_name', 'full_name', 'phone_number', 'children']

    def get_children(self, obj):
        return [
            {
                'id': link.student.id,
                'name': link.student.full_name,
                'phone': link.student.phone_number,
            }
            for link in obj.child_links.select_related('student').all()
        ]
