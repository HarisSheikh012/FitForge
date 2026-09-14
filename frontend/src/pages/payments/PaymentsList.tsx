import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { CreditCard, DollarSign, RotateCcw } from 'lucide-react';

export const PaymentsList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', status, page],
    queryFn: async () => {
      const response = await api.get('/payments', {
        params: { status, page, limit: 10 },
      });
      return response.data;
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await api.post(`/payments/${paymentId}/refund`, { reason: 'Customer requested refund' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      alert('Payment refunded successfully!');
    },
  });

  const handleRefund = (id: string) => {
    if (window.confirm('Are you sure you want to refund this transaction?')) {
      refundMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: 'Transaction ID',
      accessor: (row: any) => <span className="font-bold text-slate-800 dark:text-zinc-200">{row.id.substring(0, 8)}...</span>,
    },
    {
      header: 'Member',
      accessor: (row: any) =>
        row.member ? (
          <span className="font-semibold text-slate-700 dark:text-zinc-300">
            {row.member.user.firstName} {row.member.user.lastName}
          </span>
        ) : (
          '-'
        ),
    },
    {
      header: 'Amount',
      accessor: (row: any) => `Rs. ${row.amount.toLocaleString()}`,
    },
    {
      header: 'Method',
      accessor: 'method',
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            row.status === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : row.status === 'REFUNDED'
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Paid Date',
      accessor: (row: any) => (row.paidAt ? new Date(row.paidAt).toLocaleDateString() : '-'),
    },
    {
      header: 'Action',
      accessor: (row: any) =>
        row.status === 'COMPLETED' ? (
          <button
            onClick={() => handleRefund(row.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
          >
            <RotateCcw size={12} />
            Refund
          </button>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Payments" subtitle="Review incoming member dues, historical cash records, and refunds" />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
};
export default PaymentsList;
