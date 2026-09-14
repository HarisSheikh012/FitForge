import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';

export const StaffList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['staff', search, page],
    queryFn: async () => {
      const response = await api.get('/staff', {
        params: { search, page, limit: 10 },
      });
      return response.data;
    },
  });

  const columns = [
    {
      header: 'Employee ID',
      accessor: 'employeeId',
    },
    {
      header: 'Staff Name',
      accessor: (row: any) => (
        <span className="font-semibold text-slate-800 dark:text-zinc-200">
          {row.user.firstName} {row.user.lastName}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
    },
    {
      header: 'Position',
      accessor: 'position',
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            row.isActive
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Staff Management" subtitle="Manage front desk staff, custom permissions, and settings" />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        onSearch={setSearch}
        searchPlaceholder="Search staff member name..."
        meta={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
};
export default StaffList;
