from django.db import models
from django.utils import timezone
from apps.accounts.models import User


class StudentProfile(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, db_column='user_id', related_name='student_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    enrollment_date = models.DateField(default=timezone.now)
    gender = models.CharField(max_length=20, null=True, blank=True)
    blood_type = models.CharField(max_length=10, null=True, blank=True)
    national_id = models.CharField(max_length=50, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=30, null=True, blank=True)
    medical_conditions = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'student_profiles'
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"


class TeacherProfile(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, db_column='user_id', related_name='teacher_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    hire_date = models.DateField(default=timezone.localdate)
    gender = models.CharField(max_length=20, null=True, blank=True)
    national_id = models.CharField(max_length=50, null=True, blank=True)
    phone_number = models.CharField(max_length=30, null=True, blank=True)
    specialization = models.CharField(max_length=150, null=True, blank=True)
    employment_status = models.CharField(max_length=50, default='active', blank=True)
    qualification = models.CharField(max_length=150, null=True, blank=True)
    years_of_experience = models.IntegerField(default=0, null=True, blank=True)

    class Meta:
        db_table = 'teacher_profiles'
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"


class ParentProfile(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, db_column='user_id', related_name='parent_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=30, null=True, blank=True)

    class Meta:
        db_table = 'parent_profiles'
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.full_name} ({self.user.username})"


class StudentParent(models.Model):
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, db_column='student_id', related_name='guardian_links', primary_key=True
    )
    parent = models.ForeignKey(
        ParentProfile, on_delete=models.CASCADE, db_column='parent_id', related_name='child_links'
    )

    class Meta:
        db_table = 'student_parent'
        unique_together = (('student', 'parent'),)

    def __str__(self):
        return f"{self.parent.full_name} -> {self.student.full_name}"
