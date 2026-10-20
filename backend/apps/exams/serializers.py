from rest_framework import serializers
from .models import ExamType, Mark


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = ['id', 'name', 'weight_percentage']


class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    exam_type_name = serializers.CharField(source='exam_type.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Mark
        fields = [
            'id', 'student', 'student_name', 'subject', 'subject_name', 'subject_code',
            'exam_type', 'exam_type_name', 'term', 'term_name', 'score', 'max_score', 'percentage'
        ]

    def validate(self, attrs):
        score = attrs.get('score', getattr(self.instance, 'score', None))
        max_score = attrs.get('max_score', getattr(self.instance, 'max_score', None))

        if score is not None and score < 0:
            raise serializers.ValidationError({'score': 'Score cannot be negative.'})
        if max_score is not None and max_score <= 0:
            raise serializers.ValidationError({'max_score': 'Maximum score must be positive.'})
        if score is not None and max_score is not None and score > max_score:
            raise serializers.ValidationError({'score': f'Score ({score}) cannot exceed maximum score ({max_score}).'})

        return attrs
