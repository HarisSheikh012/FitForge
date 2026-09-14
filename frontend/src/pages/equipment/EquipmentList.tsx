import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { PageHeader } from '../../components/shared/PageHeader';
import { DataTable } from '../../components/shared/DataTable';
import { Wrench, Plus, Check, Settings } from 'lucide-react';

export const EquipmentList: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [activeEquipId, setActiveEquipId] = useState('');

  // Add Equipment Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Maintenance Form states
  const [maintType, setMaintType] = useState('ROUTINE');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintDate, setMaintDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const response = await api.get('/equipment');
      return response.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await api.post('/equipment', { name, category, brand, quantity: parseInt(quantity, 10) });
    },
    onSuccess: () => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setName('');
      setCategory('');
      setBrand('');
      setQuantity('1');
      alert('Equipment added successfully!');
    },
  });

  const maintMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/equipment/${activeEquipId}/maintenance`, {
        type: maintType,
        description: maintDesc,
        cost: maintCost,
        serviceDate: maintDate,
      });
    },
    onSuccess: () => {
      setShowMaintModal(false);
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setMaintDesc('');
      setMaintCost('');
      setMaintDate('');
      alert('Maintenance logged successfully!');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return;
    addMutation.mutate();
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintDate || !maintDesc) return;
    maintMutation.mutate();
  };

  const columns = [
    {
      header: 'Name',
      accessor: (row: any) => <span className="font-semibold text-slate-800 dark:text-zinc-200">{row.name}</span>,
    },
    {
      header: 'Category',
      accessor: 'category',
    },
    {
      header: 'Brand',
      accessor: (row: any) => row.brand ?? '-',
    },
    {
      header: 'Qty',
      accessor: 'quantity',
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            row.status === 'OPERATIONAL'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: (row: any) => (
        <button
          onClick={() => {
            setActiveEquipId(row.id);
            setShowMaintModal(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all text-slate-600 dark:text-zinc-300"
        >
          <Settings size={12} />
          Log Maintenance
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Equipment Inventory"
        subtitle="Manage cardio, strength machineries inventory, and service records"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
          >
            <Plus size={16} />
            Add Equipment
          </button>
        }
      />

      <DataTable columns={columns} data={data?.data ?? []} loading={isLoading} />

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Add Gym Equipment</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipment Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Treadmill Pro v4"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Cardio / Strength"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Life Fitness"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  {addMutation.isPending ? 'Saving...' : 'Save Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 max-w-md w-full rounded-2xl p-6 shadow-premium space-y-5">
            <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">Log Maintenance Record</h3>

            <form onSubmit={handleMaintSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maintenance Type</label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                >
                  <option value="ROUTINE">Routine Inspection</option>
                  <option value="REPAIR">Emergency Repair</option>
                  <option value="CLEANING">Standard Deep Clean</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  placeholder="Describe parts replaced or actions taken..."
                  rows={3}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Date</label>
                <input
                  type="date"
                  value={maintDate}
                  onChange={(e) => setMaintDate(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost (PKR)</label>
                <input
                  type="number"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 border border-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={maintMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  {maintMutation.isPending ? 'Logging...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EquipmentList;
