from django.db import models
from apps.profiles.models import StudentProfile
from apps.timetable.models import Timetable


class Attendance(models.Model):
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
        ('Excused', 'Excused'),
    )

    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, db_column='student_id', related_name='attendance_records'
    )
    timetable = models.ForeignKey(
        Timetable, on_delete=models.CASCADE, db_column='timetable_id', related_name='attendance_records'
    )
    date = models.DateField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Present')
    remarks = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'attendance'
        unique_together = (('student', 'timetable', 'date'),)
        ordering = ['-date', 'timetable__start_time']

    def __str__(self):
        return f"{self.date} - {self.student.full_name}: {self.status} ({self.timetable.subject.name})"
