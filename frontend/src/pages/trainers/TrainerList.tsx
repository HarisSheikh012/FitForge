import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { ShieldAlert } from 'lucide-react';

export const TrainerList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['trainers', search, page],
    queryFn: async () => {
      const response = await api.get('/trainers', {
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
      header: 'Trainer Name',
      accessor: (row: any) => (
        <span className="font-semibold text-slate-800 dark:text-zinc-200">
          {row.user.firstName} {row.user.lastName}
        </span>
      ),
    },
    {
      header: 'Specializations',
      accessor: (row: any) => row.specializations?.join(', ') ?? '-',
    },
    {
      header: 'Experience',
      accessor: (row: any) => `${row.experience} years`,
    },
    {
      header: 'Assigned Trainees',
      accessor: (row: any) => row._count?.members ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainers"
        subtitle="Manage fitness coaches, trainer salaries, and assignments"
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        onSearch={setSearch}
        searchPlaceholder="Search trainers..."
        meta={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
};
export default TrainerList;
