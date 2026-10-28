import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  X,
  CreditCard,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Supplier } from '../types';

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, formatCurrency, setActivePage } = useBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstOrTaxId: '',
    balancePayable: 0,
    notes: '',
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gstOrTaxId: '',
      balancePayable: 0,
      notes: '',
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email || '',
      address: sup.address || '',
      gstOrTaxId: sup.gstOrTaxId || '',
      balancePayable: sup.balancePayable,
      notes: sup.notes || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
    } else {
      addSupplier(formData);
    }
    setIsAddEditOpen(false);
  };

  const handleDelete = (sup: Supplier) => {
    if (window.confirm(`Delete supplier "${sup.name}"?`)) {
      deleteSupplier(sup.id);
    }
  };

  const handleSettlePayable = (sup: Supplier) => {
    const amountStr = prompt(`Enter amount paid to settle balance for ${sup.name}:`, sup.balancePayable.toString());
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        updateSupplier(sup.id, {
          balancePayable: Math.max(0, sup.balancePayable - amount),
        });
      }
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  const totalPayableAll = suppliers.reduce((acc, s) => acc + s.balancePayable, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Active Suppliers</span>
          <div className="mt-1 text-2xl font-bold text-slate-900">{suppliers.length} Vendors</div>
          <span className="text-[11px] text-slate-400">Wholesale partners</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Accounts Payable</span>
          <div className="mt-1 text-2xl font-bold text-amber-700">{formatCurrency(totalPayableAll)}</div>
          <span className="text-[11px] text-slate-400">Pending supplier remittances</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-500">Supplier Orders</span>
            <div className="mt-1 text-2xl font-bold text-teal-700">
              {suppliers.reduce((acc, s) => acc + s.totalOrders, 0)} Placed
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplier name, contact or phone..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Tax / GST ID</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Balance Payable</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sup.name}</div>
                      {sup.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          {sup.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{sup.contactPerson}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{sup.phone}</div>
                      {sup.email && <div className="text-[11px] text-slate-400">{sup.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 truncate max-w-[180px]">{sup.address || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{sup.gstOrTaxId || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{sup.totalOrders}</td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={sup.balancePayable > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        {formatCurrency(sup.balancePayable)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sup.balancePayable > 0 && (
                          <button
                            onClick={() => handleSettlePayable(sup)}
                            className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
                            title="Record Payment Made"
                          >
                            Pay Balance
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(sup)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sup)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Register New Wholesale Supplier'}
              </h3>
              <button onClick={() => setIsAddEditOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Supplier / Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Wholesale Staples Corp"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. David Miller"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="orders@supplier.com"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tax / GST Number</label>
                  <input
                    type="text"
                    value={formData.gstOrTaxId}
                    onChange={(e) => setFormData({ ...formData, gstOrTaxId: e.target.value })}
                    placeholder="e.g. SUP-9812-74"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Warehouse / Office Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, city"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Current Outstanding Balance Payable</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.balancePayable}
                  onChange={(e) => setFormData({ ...formData, balancePayable: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-800 focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Supplier Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Terms, delivery days, payment conditions..."
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
