import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Award,
  CreditCard,
  Edit2,
  Trash2,
  X,
  ShoppingCart,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Customer } from '../types';

export const Customers: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setSelectedCustomerId,
    setActivePage,
    formatCurrency,
  } = useBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    outstandingCredit: 0,
    notes: '',
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      outstandingCredit: 0,
      notes: '',
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      outstandingCredit: c.outstandingCredit,
      notes: c.notes || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsAddEditOpen(false);
  };

  const handleSettleCredit = (c: Customer) => {
    const amountStr = prompt(
      `Receive store credit payment from ${c.name} (Current debt: ${formatCurrency(c.outstandingCredit)}):`,
      c.outstandingCredit.toString()
    );
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        updateCustomer(c.id, {
          outstandingCredit: Math.max(0, c.outstandingCredit - amount),
        });
      }
    }
  };

  const handleStartSaleForCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setActivePage('pos');
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalOutstandingCredit = customers.reduce((acc, c) => acc + c.outstandingCredit, 0);
  const totalLoyaltyPoints = customers.reduce((acc, c) => acc + c.loyaltyPoints, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Registered Accounts</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{customers.length} Customers</div>
          <span className="text-[11px] text-slate-400">Including counter regular shoppers</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Store Credit Receivables</span>
          <div className="mt-1 text-2xl font-bold text-amber-700">{formatCurrency(totalOutstandingCredit)}</div>
          <span className="text-[11px] text-slate-400">Total customer balance owed to store</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-500">Loyalty Rewards</span>
            <div className="mt-1 text-2xl font-bold text-teal-700">{totalLoyaltyPoints} Pts</div>
            <span className="text-[11px] text-slate-400">Active loyalty points in pool</span>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name, phone or email..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Loyalty Points</th>
                <th className="py-3 px-4">Outstanding Credit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      {c.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {c.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-[11px] text-slate-400">{c.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 truncate max-w-[180px]">{c.address || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(c.totalPurchases)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        <Award className="h-3 w-3 text-emerald-600" />
                        {c.loyaltyPoints} pts
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={c.outstandingCredit > 0 ? 'text-amber-700' : 'text-slate-400'}>
                        {formatCurrency(c.outstandingCredit)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartSaleForCustomer(c)}
                          className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-600 hover:text-white transition"
                          title="Start POS Sale for this customer"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>Sell</span>
                        </button>
                        {c.outstandingCredit > 0 && (
                          <button
                            onClick={() => handleSettleCredit(c)}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                            title="Collect Credit Settlement"
                          >
                            Collect Debt
                          </button>
                        )}
                        {c.id !== 'cust-1' && (
                          <>
                            <button
                              onClick={() => openEditModal(c)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete customer ${c.name}?`)) {
                                  deleteCustomer(c.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsAddEditOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Emily Watson"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@example.com"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Delivery / Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, Apartment or Neighborhood"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Outstanding Store Credit Balance</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.outstandingCredit}
                  onChange={(e) => setFormData({ ...formData, outstandingCredit: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-800 focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Notes / Preferences</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Preferences, family details, delivery times..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-teal-700 transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
