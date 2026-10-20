from django.db import models
from django.utils import timezone
from apps.profiles.models import StudentProfile


class SafeJSONField(models.JSONField):
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        if isinstance(value, (dict, list)):
            return value
        return super().from_db_value(value, expression, connection)


class AIStudentNote(models.Model):
    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, db_column='student_id', related_name='ai_notes'
    )
    generated_at = models.DateTimeField(default=timezone.now)
    note_content = models.TextField()
    insights_json = SafeJSONField(null=True, blank=True)
    requires_intervention = models.BooleanField(default=False)

    class Meta:
        db_table = 'ai_student_notes'
        ordering = ['-generated_at']

    def __str__(self):
        flag = " [INTERVENTION REQUIRED]" if self.requires_intervention else ""
        return f"AI Note for {self.student.full_name} ({self.generated_at.strftime('%Y-%m-%d')}){flag}"
