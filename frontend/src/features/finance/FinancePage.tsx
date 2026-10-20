import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [transactionId, setTransactionId] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // 1. Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: async () => (await apiClient.get('/invoices/')).data?.results || [],
  });

  // 2. Fetch finance summary
  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => (await apiClient.get('/invoices/summary/')).data,
  });

  // 3. Record Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInvoice) return;
      return await apiClient.post('/payments/', {
        invoice: selectedInvoice.id,
        amount_paid: Number(amountPaid),
        payment_method: paymentMethod,
        transaction_id: transactionId || `TXN-${Date.now()}`,
      });
    },
    onSuccess: () => {
      setPaymentModalOpen(false);
      setSelectedInvoice(null);
      setAmountPaid('');
      setTransactionId('');
      setPaymentError(null);
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      setPaymentError(err?.response?.data?.amount_paid || 'Payment processing failed.');
    },
  });

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setAmountPaid(invoice.balance_remaining);
    setPaymentError(null);
    setPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('finance.title')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('finance.subtitle')}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('dashboard.totalInvoiced')}</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${(summary?.total_invoiced || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('dashboard.totalCollected')}</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ${(summary?.total_collected || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('dashboard.outstandingBalance')}</span>
          <p className="text-2xl font-black text-amber-600 mt-1">
            ${(summary?.outstanding_balance || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
            Student Billing Ledger
          </h3>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">{t('common.loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">{t('finance.invoiceNumber')}</th>
                  <th className="px-6 py-3.5">{t('students.fullName')}</th>
                  <th className="px-6 py-3.5">Fee Category</th>
                  <th className="px-6 py-3.5">{t('finance.amountDue')}</th>
                  <th className="px-6 py-3.5">{t('finance.paid')}</th>
                  <th className="px-6 py-3.5">{t('finance.balance')}</th>
                  <th className="px-6 py-3.5">{t('students.status')}</th>
                  <th className="px-6 py-3.5 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                      INV-{inv.id.toString().padStart(5, '0')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                      {inv.student_name}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {inv.fee_type_name}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      ${inv.amount_due?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-emerald-600">
                      ${inv.total_paid?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-xs text-slate-800 dark:text-slate-200">
                      ${inv.balance_remaining?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {inv.balance_remaining > 0 ? (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                        >
                          {t('finance.recordPayment')}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Collection Modal */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              {t('finance.recordPayment')}
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
              <p><strong className="text-slate-400">Student:</strong> {selectedInvoice.student_name}</p>
              <p><strong className="text-slate-400">Total Due:</strong> ${selectedInvoice.amount_due}</p>
              <p><strong className="text-slate-400">Balance Remaining:</strong> <span className="font-bold text-emerald-600">${selectedInvoice.balance_remaining}</span></p>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Payment Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                max={selectedInvoice.balance_remaining}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t('finance.paymentMethod')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Credit Card">{t('finance.card')}</option>
                <option value="Bank Transfer">{t('finance.bankTransfer')}</option>
                <option value="Cash">{t('finance.cash')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t('finance.txnId')}
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-123456"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => paymentMutation.mutate()}
                disabled={paymentMutation.isPending || !amountPaid || amountPaid <= 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {paymentMutation.isPending ? t('common.loading') : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
