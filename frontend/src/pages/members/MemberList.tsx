import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { Plus, Eye, Edit, Trash2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MemberList: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['members', search, page],
    queryFn: async () => {
      const response = await api.get('/members', {
        params: { search, page, limit: 10 },
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this member? This will delete their user credentials as well.')) {
      deleteMutation.mutate(id);
    }
  };

  const columns = [
    {
      header: 'Member ID',
      accessor: (row: any) => <span className="font-bold text-slate-800 dark:text-zinc-200">{row.memberId}</span>,
    },
    {
      header: 'Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-2.5">
          <img
            src={row.user.avatar ?? `https://api.dicebear.com/7.x/adventurer/svg?seed=${row.user.firstName}`}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            {row.user.firstName} {row.user.lastName}
          </span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: (row: any) => row.user.email,
    },
    {
      header: 'Phone',
      accessor: (row: any) => row.user.phone ?? '-',
    },
    {
      header: 'Membership',
      accessor: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            row.membershipStatus === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : row.membershipStatus === 'FROZEN'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.membershipStatus}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/members/${row.id}`}
            className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <Eye size={14} />
          </Link>
          <Link
            to={`/members/edit/${row.id}`}
            className="p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <Edit size={14} />
          </Link>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg border border-slate-100 text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        subtitle="Manage member profiles, billing, and registrations"
        action={
          <Link
            to="/members/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <Plus size={16} />
            Add Member
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        onSearch={setSearch}
        searchPlaceholder="Search member name, ID, email..."
        meta={data?.meta}
        onPageChange={setPage}
      />
    </div>
  );
};
export default MemberList;
