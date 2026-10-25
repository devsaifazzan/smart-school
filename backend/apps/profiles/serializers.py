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


class StudentCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    section_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    academic_year_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'username', 'password', 'email', 'first_name', 'last_name',
            'date_of_birth', 'enrollment_date', 'gender', 'blood_type',
            'national_id', 'address', 'phone_number', 'medical_conditions',
            'section_id', 'academic_year_id'
        ]
        read_only_fields = ['id', 'user']

    def create(self, validated_data):
        from apps.accounts.models import Role, User
        from apps.academics.models import Enrollment, Section, AcademicYear
        from django.db import transaction

        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        email = validated_data.pop('email', '')
        section_id = validated_data.pop('section_id', None)
        academic_year_id = validated_data.pop('academic_year_id', None)

        with transaction.atomic():
            if not username:
                base_username = f"{validated_data.get('first_name', 'student')}.{validated_data.get('last_name', 'new')}".lower().replace(' ', '')
                candidate = base_username
                count = 1
                while User.objects.filter(username=candidate).exists():
                    candidate = f"{base_username}{count}"
                    count += 1
                username = candidate

            if not password:
                password = 'student123'

            student_role = Role.objects.filter(name__iexact='student').first()
            user = User(
                username=username,
                email=email or f"{username}@school.edu",
                role=student_role,
                is_active=True
            )
            user.set_password(password)
            user.save()

            student = StudentProfile.objects.create(user=user, **validated_data)

            if section_id:
                ay = None
                if academic_year_id:
                    ay = AcademicYear.objects.filter(pk=academic_year_id).first()
                if not ay:
                    ay = AcademicYear.objects.filter(is_active=True).first() or AcademicYear.objects.first()

                sec = Section.objects.filter(pk=section_id).first()
                if sec and ay:
                    Enrollment.objects.get_or_create(student=student, section=sec, academic_year=ay)

            return student

    def to_representation(self, instance):
        return StudentProfileSerializer(instance, context=self.context).data


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


class TeacherCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user', 'username', 'password', 'email',
            'first_name', 'last_name', 'hire_date',
            'gender', 'national_id', 'phone_number',
            'specialization', 'employment_status',
            'qualification', 'years_of_experience'
        ]
        read_only_fields = ['id', 'user']

    def validate_email(self, value):
        from apps.accounts.models import User
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def create(self, validated_data):
        from apps.accounts.models import Role, User
        from django.db import transaction

        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        email = validated_data.pop('email', '')

        with transaction.atomic():
            if not username:
                base_username = f"teacher.{validated_data.get('first_name', 'staff')}.{validated_data.get('last_name', 'new')}".lower().replace(' ', '')
                candidate = base_username
                count = 1
                while User.objects.filter(username=candidate).exists():
                    candidate = f"{base_username}{count}"
                    count += 1
                username = candidate

            if not password:
                password = 'teacher123'

            teacher_role = Role.objects.filter(name__iexact='teacher').first()
            if not teacher_role:
                teacher_role, _ = Role.objects.get_or_create(
                    name='Teacher',
                    defaults={'description': 'Teacher / Academic Staff'}
                )

            if not email:
                candidate_email = f"{username}@school.edu"
                c = 1
                while User.objects.filter(email=candidate_email).exists():
                    candidate_email = f"{username}{c}@school.edu"
                    c += 1
                email = candidate_email

            user = User(
                username=username,
                email=email,
                role=teacher_role,
                is_active=True
            )
            user.set_password(password)
            user.save()

            teacher = TeacherProfile.objects.create(user=user, **validated_data)
            teacher._generated_username = username
            teacher._generated_password = password
            return teacher

    def to_representation(self, instance):
        data = TeacherProfileSerializer(instance, context=self.context).data
        if hasattr(instance, '_generated_username'):
            data['credentials'] = {
                'username': instance._generated_username,
                'password': instance._generated_password,
            }
        return data


class TeacherProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    hire_date = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = [
            'id', 'user', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'hire_date', 'gender', 'national_id', 'phone_number',
            'specialization', 'employment_status', 'qualification', 'years_of_experience',
            'is_active'
        ]

    def get_hire_date(self, obj):
        if not obj.hire_date:
            return None
        if hasattr(obj.hire_date, 'strftime'):
            return obj.hire_date.strftime('%Y-%m-%d')
        return str(obj.hire_date)


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
