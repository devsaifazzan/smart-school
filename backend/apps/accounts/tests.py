from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Role, User


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_role = Role.objects.create(name='super_admin', description='Admin')
        self.teacher_role = Role.objects.create(name='teacher', description='Teacher')

        self.admin = User.objects.create_user(
            username='test_admin',
            email='admin@test.com',
            password='Password123!',
            role=self.admin_role
        )
        self.teacher = User.objects.create_user(
            username='test_teacher',
            email='teacher@test.com',
            password='Password123!',
            role=self.teacher_role
        )

    def test_login_success(self):
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'test_admin',
            'password': 'Password123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'test_admin')

    def test_login_invalid_password(self):
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'test_admin',
            'password': 'WrongPassword!'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_authenticated(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'test_admin')
        self.assertEqual(response.data['role'], 'super_admin')
