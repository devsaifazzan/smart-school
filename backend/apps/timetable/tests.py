import datetime
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Role, User
from apps.academics.models import ClassLevel, Section, Subject
from apps.profiles.models import TeacherProfile
from apps.timetable.models import Timetable


class TimetableConflictTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_role = Role.objects.create(name='super_admin')
        self.admin = User.objects.create_user(
            username='admin_tt', email='admin_tt@test.com', password='pass', role=self.admin_role
        )
        self.client.force_authenticate(user=self.admin)

        self.cl = ClassLevel.objects.create(name='Grade 1')
        self.sec1 = Section.objects.create(class_level=self.cl, name='1A')
        self.sec2 = Section.objects.create(class_level=self.cl, name='1B')

        self.sub1 = Subject.objects.create(name='Math', code='M1')
        self.sub2 = Subject.objects.create(name='English', code='E1')

        t_user = User.objects.create_user(username='t1', email='t1@test.com', password='pass')
        self.teacher = TeacherProfile.objects.create(user=t_user, first_name='John', last_name='Doe')

        # Existing slot: Sunday 08:00 - 09:00 with teacher in 1A
        Timetable.objects.create(
            section=self.sec1,
            subject=self.sub1,
            teacher=self.teacher,
            day_of_week='Sunday',
            start_time=datetime.time(8, 0),
            end_time=datetime.time(9, 0),
            classroom='Room 101'
        )

    def test_teacher_double_booking_rejected(self):
        # Attempt to schedule same teacher on Sunday 08:30 - 09:30 in 1B
        response = self.client.post('/api/v1/timetables/', {
            'section': self.sec2.id,
            'subject': self.sub2.id,
            'teacher': self.teacher.id,
            'day_of_week': 'Sunday',
            'start_time': '08:30:00',
            'end_time': '09:30:00',
            'classroom': 'Room 102'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('teacher', response.data)

    def test_classroom_collision_rejected(self):
        # Different teacher, but same room Room 101 at overlapping time
        other_user = User.objects.create_user(username='t2', email='t2@test.com', password='pass')
        other_teacher = TeacherProfile.objects.create(user=other_user, first_name='Jane', last_name='Smith')

        response = self.client.post('/api/v1/timetables/', {
            'section': self.sec2.id,
            'subject': self.sub2.id,
            'teacher': other_teacher.id,
            'day_of_week': 'Sunday',
            'start_time': '08:15:00',
            'end_time': '08:45:00',
            'classroom': 'Room 101'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('classroom', response.data)
