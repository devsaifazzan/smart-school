from rest_framework import serializers
from .models import FeeType, FeeStructure, StudentInvoice, Payment


class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = ['id', 'name', 'description']


class FeeStructureSerializer(serializers.ModelSerializer):
    fee_type_name = serializers.CharField(source='fee_type.name', read_only=True)
    class_level_name = serializers.CharField(source='class_level.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            'id', 'fee_type', 'fee_type_name', 'class_level', 'class_level_name',
            'academic_year', 'academic_year_name', 'amount'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.IntegerField(source='invoice.id', read_only=True)
    student_name = serializers.CharField(source='invoice.student.full_name', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'invoice', 'invoice_number', 'student_name', 'amount_paid', 'payment_date', 'payment_method', 'transaction_id']
        read_only_fields = ['id', 'payment_date']

    def validate_amount_paid(self, value):
        if value <= 0:
            raise serializers.ValidationError('Payment amount must be greater than zero.')
        return value


class StudentInvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    fee_type_name = serializers.CharField(source='fee_structure.fee_type.name', read_only=True)
    class_level_name = serializers.CharField(source='fee_structure.class_level.name', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    total_paid = serializers.FloatField(read_only=True)
    balance_remaining = serializers.FloatField(read_only=True)

    class Meta:
        model = StudentInvoice
        fields = [
            'id', 'student', 'student_name', 'fee_structure', 'fee_type_name',
            'class_level_name', 'issue_date', 'due_date', 'amount_due', 'status',
            'payments', 'total_paid', 'balance_remaining'
        ]
