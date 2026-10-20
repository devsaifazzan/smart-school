from django.db import models
from apps.profiles.models import StudentProfile
from apps.academics.models import Subject, Term


class ExamType(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    weight_percentage = models.FloatField(default=100.0)

    class Meta:
        db_table = 'exam_types'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.weight_percentage}%)"


class Mark(models.Model):
    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, db_column='student_id', related_name='marks'
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, db_column='subject_id', related_name='marks'
    )
    exam_type = models.ForeignKey(
        ExamType, on_delete=models.CASCADE, db_column='exam_type_id', related_name='marks'
    )
    term = models.ForeignKey(
        Term, on_delete=models.CASCADE, db_column='term_id', related_name='marks'
    )
    score = models.FloatField()
    max_score = models.FloatField(default=100.0)

    class Meta:
        db_table = 'marks'
        unique_together = (('student', 'subject', 'exam_type', 'term'),)
        ordering = ['student', 'term', 'subject']

    @property
    def percentage(self):
        if self.max_score and self.max_score > 0:
            return round((self.score / self.max_score) * 100.0, 2)
        return 0.0

    def __str__(self):
        return f"{self.student.full_name} - {self.subject.name} - {self.exam_type.name}: {self.score}/{self.max_score}"
