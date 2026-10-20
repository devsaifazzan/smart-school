import datetime
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import Role, User
from apps.academics.models import AcademicYear, ClassLevel
from apps.profiles.models import StudentProfile
from apps.finance.models import FeeType, FeeStructure, StudentInvoice, Payment


class FinanceAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_role = Role.objects.create(name='accountant')
        self.user = User.objects.create_user(username='acc1', email='acc@test.com', password='pass', role=self.admin_role)
        self.client.force_authenticate(user=self.user)

        self.ay = AcademicYear.objects.create(
            name='2024-2025', start_date=datetime.date(2024, 9, 1), end_date=datetime.date(2025, 6, 30), is_active=True
        )
        self.cl = ClassLevel.objects.create(name='Grade 1')
        self.ft = FeeType.objects.create(name='Tuition')
        self.fs = FeeStructure.objects.create(fee_type=self.ft, class_level=self.cl, academic_year=self.ay, amount=1000.0)

        s_user = User.objects.create_user(username='stu1', email='stu1@test.com', password='pass')
        self.student = StudentProfile.objects.create(user=s_user, first_name='Ali', last_name='Zaid')

        self.invoice = StudentInvoice.objects.create(
            student=self.student,
            fee_structure=self.fs,
            issue_date=datetime.date(2024, 9, 1),
            due_date=datetime.date(2024, 10, 1),
            amount_due=1000.0,
            status='UNPAID'
        )

    def test_payment_updates_invoice_status(self):
        response = self.client.post('/api/v1/payments/', {
            'invoice': self.invoice.id,
            'amount_paid': 400.0,
            'payment_method': 'Cash'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'PARTIAL')
        self.assertEqual(self.invoice.balance_remaining, 600.0)

        # Pay remainder
        response2 = self.client.post('/api/v1/payments/', {
            'invoice': self.invoice.id,
            'amount_paid': 600.0,
            'payment_method': 'Bank Transfer'
        })
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, 'PAID')
        self.assertEqual(self.invoice.balance_remaining, 0.0)

    def test_overpayment_rejected(self):
        response = self.client.post('/api/v1/payments/', {
            'invoice': self.invoice.id,
            'amount_paid': 1500.0,
            'payment_method': 'Cash'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('amount_paid', response.data)
