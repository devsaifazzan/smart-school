from django.db import models


class AcademicYear(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'academic_years'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} {'(Active)' if self.is_active else ''}"


class Term(models.Model):
    id = models.AutoField(primary_key=True)
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, db_column='academic_year_id', related_name='terms'
    )
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()

    class Meta:
        db_table = 'terms'
        ordering = ['start_date']

    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"


class ClassLevel(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)

    class Meta:
        db_table = 'class_levels'
        ordering = ['id']

    def __str__(self):
        return self.name


class Section(models.Model):
    id = models.AutoField(primary_key=True)
    class_level = models.ForeignKey(
        ClassLevel, on_delete=models.CASCADE, db_column='class_level_id', related_name='sections'
    )
    name = models.CharField(max_length=50)
    capacity = models.IntegerField(default=30)

    class Meta:
        db_table = 'sections'
        ordering = ['class_level', 'name']

    def __str__(self):
        return f"{self.class_level.name} - {self.name}"


class Subject(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)

    class Meta:
        db_table = 'subjects'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Enrollment(models.Model):
    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        'profiles.StudentProfile', on_delete=models.CASCADE, db_column='student_id', related_name='enrollments'
    )
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, db_column='section_id', related_name='enrollments'
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, db_column='academic_year_id', related_name='enrollments'
    )

    class Meta:
        db_table = 'enrollments'
        unique_together = (('student', 'academic_year'),)

    def __str__(self):
        return f"{self.student} enrolled in {self.section} ({self.academic_year.name})"
