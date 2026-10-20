from django.db import models
from apps.academics.models import Section, Subject
from apps.profiles.models import TeacherProfile


class Timetable(models.Model):
    id = models.AutoField(primary_key=True)
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, db_column='section_id', related_name='timetables'
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, db_column='subject_id', related_name='timetables'
    )
    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.CASCADE, db_column='teacher_id', related_name='timetables'
    )
    day_of_week = models.CharField(max_length=20)  # e.g., 'Monday', 'Tuesday', 'Sunday'
    start_time = models.TimeField()
    end_time = models.TimeField()
    classroom = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'timetables'
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.day_of_week} {self.start_time}-{self.end_time}: {self.section.name} - {self.subject.name} ({self.teacher.full_name})"
