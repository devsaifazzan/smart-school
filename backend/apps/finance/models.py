from django.db import models
from django.utils import timezone
from apps.academics.models import ClassLevel, AcademicYear
from apps.profiles.models import StudentProfile


class FeeType(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'fee_types'
        ordering = ['name']

    def __str__(self):
        return self.name


class FeeStructure(models.Model):
    id = models.AutoField(primary_key=True)
    fee_type = models.ForeignKey(
        FeeType, on_delete=models.CASCADE, db_column='fee_type_id', related_name='fee_structures'
    )
    class_level = models.ForeignKey(
        ClassLevel, on_delete=models.CASCADE, db_column='class_level_id', related_name='fee_structures'
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, db_column='academic_year_id', related_name='fee_structures'
    )
    amount = models.FloatField()

    class Meta:
        db_table = 'fee_structures'
        unique_together = (('fee_type', 'class_level', 'academic_year'),)
        ordering = ['class_level', 'fee_type']

    def __str__(self):
        return f"{self.fee_type.name} - {self.class_level.name} ({self.academic_year.name}): ${self.amount:,.2f}"


class StudentInvoice(models.Model):
    STATUS_CHOICES = (
        ('UNPAID', 'Unpaid'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    )

    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, db_column='student_id', related_name='invoices'
    )
    fee_structure = models.ForeignKey(
        FeeStructure, on_delete=models.CASCADE, db_column='fee_structure_id', related_name='invoices'
    )
    issue_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    amount_due = models.FloatField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='UNPAID')

    class Meta:
        db_table = 'student_invoices'
        ordering = ['-due_date']

    @property
    def total_paid(self):
        return sum(p.amount_paid for p in self.payments.all())

    @property
    def balance_remaining(self):
        return max(0.0, round(self.amount_due - self.total_paid, 2))

    def update_status(self):
        paid = self.total_paid
        if paid >= self.amount_due:
            self.status = 'PAID'
        elif paid > 0:
            self.status = 'PARTIAL'
        else:
            today = timezone.now().date()
            if self.due_date and self.due_date < today:
                self.status = 'OVERDUE'
            else:
                self.status = 'UNPAID'
        self.save(update_fields=['status'])

    def __str__(self):
        return f"Invoice #{self.id} - {self.student.full_name}: ${self.amount_due:,.2f} ({self.status})"


class Payment(models.Model):
    id = models.AutoField(primary_key=True)
    invoice = models.ForeignKey(
        StudentInvoice, on_delete=models.CASCADE, db_column='invoice_id', related_name='payments'
    )
    amount_paid = models.FloatField()
    payment_date = models.DateTimeField(default=timezone.now)
    payment_method = models.CharField(max_length=50, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-payment_date']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.invoice.update_status()

    def __str__(self):
        return f"Payment #{self.id} for Invoice #{self.invoice_id}: ${self.amount_paid:,.2f} on {self.payment_date.strftime('%Y-%m-%d')}"
