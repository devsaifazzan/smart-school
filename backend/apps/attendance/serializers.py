from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    subject_name = serializers.CharField(source='timetable.subject.name', read_only=True)
    section_name = serializers.CharField(source='timetable.section.name', read_only=True)
    day_of_week = serializers.CharField(source='timetable.day_of_week', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'timetable', 'subject_name',
            'section_name', 'day_of_week', 'date', 'status', 'remarks'
        ]


class SingleStudentAttendanceEntrySerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['Present', 'Absent', 'Late', 'Excused'])
    remarks = serializers.CharField(required=False, allow_blank=True, default='')


class BulkAttendanceCreateSerializer(serializers.Serializer):
    timetable_id = serializers.IntegerField()
    date = serializers.DateField()
    entries = SingleStudentAttendanceEntrySerializer(many=True)
