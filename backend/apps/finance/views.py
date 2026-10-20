from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum
from apps.accounts.permissions import ResourcePermission, user_has_resource_permission
from .models import FeeType, FeeStructure, StudentInvoice, Payment
from .serializers import (
    FeeTypeSerializer, FeeStructureSerializer,
    StudentInvoiceSerializer, PaymentSerializer
)


class FeeTypeViewSet(viewsets.ModelViewSet):
    queryset = FeeType.objects.all()
    serializer_class = FeeTypeSerializer
    resource_name = 'finance'
    permission_classes = [ResourcePermission]
    search_fields = ['name']


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all().select_related('fee_type', 'class_level', 'academic_year')
    serializer_class = FeeStructureSerializer
    resource_name = 'finance'
    permission_classes = [ResourcePermission]
    filterset_fields = ['fee_type', 'class_level', 'academic_year']


class StudentInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = StudentInvoiceSerializer
    resource_name = 'finance'
    permission_classes = [ResourcePermission]
    filterset_fields = ['student', 'status']
    search_fields = ['student__first_name', 'student__last_name']

    def get_queryset(self):
        user = self.request.user
        qs = StudentInvoice.objects.all().select_related(
            'student', 'fee_structure__fee_type', 'fee_structure__class_level'
        ).prefetch_related('payments')
        if user.is_superuser or user_has_resource_permission(user, 'finance', 'read'):
            return qs
        if user.role and user.role.name == 'student' and hasattr(user, 'student_profile'):
            return qs.filter(student=user.student_profile)
        if user.role and user.role.name == 'parent' and hasattr(user, 'parent_profile'):
            children_ids = user.parent_profile.child_links.values_list('student_id', flat=True)
            return qs.filter(student_id__in=children_ids)
        return qs.none()

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        qs = self.get_queryset()
        total_invoiced = qs.aggregate(sum=Sum('amount_due'))['sum'] or 0.0

        invoice_ids = qs.values_list('id', flat=True)
        total_collected = Payment.objects.filter(invoice_id__in=invoice_ids).aggregate(sum=Sum('amount_paid'))['sum'] or 0.0

        outstanding = max(0.0, total_invoiced - total_collected)
        paid_count = qs.filter(status='PAID').count()
        partial_count = qs.filter(status='PARTIAL').count()
        unpaid_count = qs.filter(status='UNPAID').count()
        overdue_count = qs.filter(status='OVERDUE').count()

        return Response({
            'total_invoiced': round(total_invoiced, 2),
            'total_collected': round(total_collected, 2),
            'outstanding_balance': round(outstanding, 2),
            'counts': {
                'paid': paid_count,
                'partial': partial_count,
                'unpaid': unpaid_count,
                'overdue': overdue_count,
            }
        })


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    resource_name = 'finance'
    permission_classes = [ResourcePermission]
    filterset_fields = ['invoice', 'payment_method']
    search_fields = ['transaction_id', 'invoice__student__first_name', 'invoice__student__last_name']

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.all().select_related('invoice__student')
        if user.is_superuser or user_has_resource_permission(user, 'finance', 'read'):
            return qs
        if user.role and user.role.name == 'student' and hasattr(user, 'student_profile'):
            return qs.filter(invoice__student=user.student_profile)
        if user.role and user.role.name == 'parent' and hasattr(user, 'parent_profile'):
            children_ids = user.parent_profile.child_links.values_list('student_id', flat=True)
            return qs.filter(invoice__student_id__in=children_ids)
        return qs.none()

    def create(self, request, *args, **kwargs):
        # Atomic lock to prevent duplicate payments / overpayments
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            invoice_id = serializer.validated_data['invoice'].id
            amount_to_pay = serializer.validated_data['amount_paid']

            invoice = StudentInvoice.objects.select_for_update().get(pk=invoice_id)
            remaining = invoice.balance_remaining

            if amount_to_pay > remaining:
                return Response(
                    {'amount_paid': f'Payment amount (${amount_to_pay:,.2f}) cannot exceed the balance remaining (${remaining:,.2f}).'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            payment = serializer.save()
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
