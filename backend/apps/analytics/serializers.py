from rest_framework import serializers
from .models import AIStudentNote


class AIStudentNoteSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_section = serializers.SerializerMethodField()

    class Meta:
        model = AIStudentNote
        fields = [
            'id', 'student', 'student_name', 'student_section', 'generated_at',
            'note_content', 'insights_json', 'requires_intervention'
        ]

    def get_student_section(self, obj):
        active = obj.student.enrollments.filter(academic_year__is_active=True).first()
        return active.section.name if active else 'N/A'
