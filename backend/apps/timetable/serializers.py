from rest_framework import serializers
from .models import Timetable


class TimetableSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source='section.name', read_only=True)
    class_level_name = serializers.CharField(source='section.class_level.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = Timetable
        fields = [
            'id', 'section', 'section_name', 'class_level_name',
            'subject', 'subject_name', 'teacher', 'teacher_name',
            'day_of_week', 'start_time', 'end_time', 'classroom'
        ]

    def validate(self, attrs):
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))
        day_of_week = attrs.get('day_of_week', getattr(self.instance, 'day_of_week', None))
        teacher = attrs.get('teacher', getattr(self.instance, 'teacher', None))
        section = attrs.get('section', getattr(self.instance, 'section', None))
        classroom = attrs.get('classroom', getattr(self.instance, 'classroom', None))

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({'end_time': 'End time must be after start time.'})

        # Query overlapping entries for the same day
        overlapping_qs = Timetable.objects.filter(
            day_of_week=day_of_week,
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if self.instance:
            overlapping_qs = overlapping_qs.exclude(pk=self.instance.pk)

        # 1. Teacher conflict check
        if teacher and overlapping_qs.filter(teacher=teacher).exists():
            conflict = overlapping_qs.filter(teacher=teacher).first()
            raise serializers.ValidationError({
                'teacher': f'Teacher {teacher.full_name} is already scheduled in {conflict.section.name} ({conflict.start_time}-{conflict.end_time}).'
            })

        # 2. Section conflict check
        if section and overlapping_qs.filter(section=section).exists():
            conflict = overlapping_qs.filter(section=section).first()
            raise serializers.ValidationError({
                'section': f'Section {section.name} already has {conflict.subject.name} at this time ({conflict.start_time}-{conflict.end_time}).'
            })

        # 3. Classroom collision check
        if classroom and overlapping_qs.filter(classroom__iexact=classroom).exists():
            conflict = overlapping_qs.filter(classroom__iexact=classroom).first()
            raise serializers.ValidationError({
                'classroom': f'Classroom {classroom} is occupied by {conflict.section.name} ({conflict.start_time}-{conflict.end_time}).'
            })

        return attrs
