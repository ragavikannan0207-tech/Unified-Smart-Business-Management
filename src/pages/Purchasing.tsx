import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  PackageCheck,
  Building2,
  Calendar,
  X,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { PurchaseOrder, POItem } from '../types';

interface PurchasingProps {
  isOpenCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

export const Purchasing: React.FC<PurchasingProps> = ({
  isOpenCreateModal: externalIsOpen,
  onCloseCreateModal: externalOnClose,
}) => {
  const {
    purchaseOrders,
    createPurchaseOrder,
    receivePurchaseOrder,
    suppliers,
    products,
    formatCurrency,
    lowStockProducts,
  } = useBusiness();

  const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'received' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Internal create PO modal state
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const isCreateOpen = externalIsOpen !== undefined ? externalIsOpen : internalCreateOpen;
  const closeCreateModal = externalOnClose || (() => setInternalCreateOpen(false));

  // PO Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    { productId: string; quantity: number; costPrice: number }[]
  >([]);

  // Open modal with initial items (can prefill low stock items!)
  const handleOpenCreatePO = (prefillLowStock = false) => {
    if (prefillLowStock && lowStockProducts.length > 0) {
      const items = lowStockProducts.slice(0, 5).map((p) => ({
        productId: p.id,
        quantity: Math.max(10, p.minStockAlert * 2 - p.currentStock),
        costPrice: p.costPrice,
      }));
      setPoItems(items);
      if (lowStockProducts[0].supplierId) {
        setSelectedSupplierId(lowStockProducts[0].supplierId);
      }
    } else {
      setPoItems([
        {
          productId: products[0]?.id || '',
          quantity: 20,
          costPrice: products[0]?.costPrice || 100,
        },
      ]);
    }
    setInternalCreateOpen(true);
  };

  const handleAddItemRow = () => {
    const nextProd = products.find((p) => !poItems.some((item) => item.productId === p.id)) || products[0];
    if (nextProd) {
      setPoItems((prev) => [
        ...prev,
        { productId: nextProd.id, quantity: 15, costPrice: nextProd.costPrice },
      ]);
    }
  };

  const handleUpdateItemRow = (index: number, field: 'productId' | 'quantity' | 'costPrice', value: any) => {
    setPoItems((prev) => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find((p) => p.id === value);
        updated[index] = {
          ...updated[index],
          productId: value,
          costPrice: prod?.costPrice || updated[index].costPrice,
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const handleRemoveItemRow = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit PO
  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) return;

    const supplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

    const formattedItems: POItem[] = poItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const total = item.quantity * item.costPrice;
      return {
        productId: item.productId,
        productName: prod?.name || 'Item',
        sku: prod?.sku || 'SKU-000',
        unit: prod?.unit || 'pcs',
        quantityOrdered: item.quantity,
        quantityReceived: 0,
        costPrice: item.costPrice,
        total,
      };
    });

    const totalAmount = formattedItems.reduce((acc, i) => acc + i.total, 0);

    createPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDate,
      status: 'ordered',
      items: formattedItems,
      totalAmount,
      notes: poNotes,
    });

    closeCreateModal();
    setPoItems([]);
    setPoNotes('');
  };

  // Filtered list
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Restock Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Wholesale Purchasing & Stock Replenishment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue purchase orders to suppliers and automatically intake stock into your live store inventory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lowStockProducts.length > 0 && (
            <button
              onClick={() => handleOpenCreatePO(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
            >
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Auto-Fill PO for {lowStockProducts.length} Low Stock Items</span>
            </button>
          )}

          <button
            onClick={() => handleOpenCreatePO(false)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* PO List Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Controls Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PO #, supplier or item..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
            />
          </div>

          <div className="flex rounded-xl border border-slate-300 bg-white p-0.5 text-xs">
            {(['all', 'ordered', 'received', 'draft'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1 font-medium capitalize transition ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* PO Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected / Received</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {po.poNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{po.supplierName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {po.orderDate}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {po.status === 'received' ? (
                        <span className="text-emerald-700 font-medium">Received {po.receivedDate}</span>
                      ) : (
                        <span>Expected by {po.expectedDate || 'ASAP'}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="max-w-[200px] truncate" title={po.items.map((i) => `${i.productName} (${i.quantityOrdered} ${i.unit})`).join(', ')}>
                        {po.items.length} items ({po.items.reduce((acc, i) => acc + i.quantityOrdered, 0)} units)
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {po.status === 'received' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Received
                        </span>
                      ) : po.status === 'ordered' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                          <Clock className="h-3 w-3" /> In Transit
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 capitalize">
                          {po.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {po.status !== 'received' ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`Receive items for ${po.poNumber}? This will automatically add ${po.items.reduce((acc, i) => acc + i.quantityOrdered, 0)} units to your live store stock.`)) {
                              receivePurchaseOrder(po.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-600 hover:text-white transition"
                        >
                          <PackageCheck className="h-3.5 w-3.5" />
                          <span>Receive Stock</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Stock Added</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Purchase Order */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-teal-600" /> Create Wholesale Purchase Order
              </h3>
              <button onClick={closeCreateModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="p-5 space-y-4 text-xs">
              {/* Supplier & Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Select Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Expected Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Items Table Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">Order Line Items:</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1 text-teal-600 font-bold hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {poItems.map((item, idx) => {
                    const lineTotal = item.quantity * item.costPrice;
                    return (
                      <div key={idx} className="p-3 bg-white flex flex-col sm:flex-row items-center gap-2">
                        {/* Product selection */}
                        <div className="flex-1 w-full sm:w-auto">
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateItemRow(idx, 'productId', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock} {p.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemRow(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            placeholder="Qty"
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-center font-bold"
                          />
                        </div>

                        {/* Cost Price */}
                        <div className="w-28">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.costPrice}
                            onChange={(e) => handleUpdateItemRow(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                            placeholder="Cost"
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-right font-mono"
                          />
                        </div>

                        {/* Line Total */}
                        <div className="w-24 text-right font-bold text-slate-900">
                          {formatCurrency(lineTotal)}
                        </div>

                        {/* Delete Row */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          disabled={poItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-between items-center rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="font-semibold text-slate-700">Estimated Total Order Cost:</span>
                <span className="text-base font-extrabold text-teal-800">
                  {formatCurrency(poItems.reduce((acc, i) => acc + i.quantity * i.costPrice, 0))}
                </span>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Order Notes / Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Deliver before 10 AM, include invoice copy..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-teal-700 transition"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
