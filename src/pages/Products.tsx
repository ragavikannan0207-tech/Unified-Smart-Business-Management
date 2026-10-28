import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Download,
  Barcode,
  CheckCircle2,
  X,
  TrendingUp,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Product } from '../types';
import { PRODUCT_CATEGORIES } from '../data/mockData';

interface ProductsProps {
  onOpenCreatePO?: () => void;
}

export const Products: React.FC<ProductsProps> = ({ onOpenCreatePO }) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    suppliers,
    formatCurrency,
    totalInventoryValuation,
    lowStockProducts,
  } = useBusiness();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStockCount, setNewStockCount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Physical inventory audit count');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Grains & Staples',
    unit: 'pcs',
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    supplierId: '',
    taxRate: 5,
    image: '📦',
    description: '',
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: 'Grains & Staples',
      unit: 'pcs',
      costPrice: 85.0,
      sellingPrice: 110.0,
      currentStock: 20,
      minStockAlert: 8,
      supplierId: suppliers[0]?.id || '',
      taxRate: 5,
      image: '📦',
      description: '',
    });
    setIsAddEditOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      supplierId: p.supplierId || '',
      taxRate: p.taxRate,
      image: p.image || '📦',
      description: p.description || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const supplier = suppliers.find((s) => s.id === formData.supplierId);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        supplierName: supplier?.name,
      });
    } else {
      addProduct({
        ...formData,
        supplierName: supplier?.name,
      });
    }

    setIsAddEditOpen(false);
  };

  const openStockAdjustModal = (p: Product) => {
    setAdjustingProduct(p);
    setNewStockCount(p.currentStock);
    setAdjustmentReason('Physical stock audit count');
    setIsAdjustStockOpen(true);
  };

  const handleSaveStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    adjustStock(adjustingProduct.id, Number(newStockCount), adjustmentReason);
    setIsAdjustStockOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      deleteProduct(id);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Product Name', 'SKU', 'Barcode', 'Category', 'Unit', 'Cost Price (INR)', 'Selling Price (INR)', 'Stock Level', 'Min Stock Alert', 'Supplier'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode,
      p.category,
      p.unit,
      p.costPrice.toFixed(2),
      p.sellingPrice.toFixed(2),
      p.currentStock,
      p.minStockAlert,
      `"${(p.supplierName || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
    } else if (stockFilter === 'out') {
      matchesStock = p.currentStock <= 0;
    }

    return matchesCat && matchesSearch && matchesStock;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Valuation & Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-500">Total Products</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{products.length} Items</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalInventoryValuation.totalUnits} Units in stock</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-500">Inventory Cost Value</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totalInventoryValuation.costValue)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Asset value based on wholesale purchase cost</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase text-slate-500">Inventory Retail Value</div>
          <div className="mt-1 text-2xl font-bold text-teal-700">{formatCurrency(totalInventoryValuation.retailValue)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Expected gross profit: {formatCurrency(totalInventoryValuation.retailValue - totalInventoryValuation.costValue)}
          </div>
        </div>

        <div className={`rounded-2xl border p-4 shadow-xs ${lowStockProducts.length > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
          <div className="text-xs font-semibold uppercase text-slate-500">Low Stock Warnings</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{lowStockProducts.length} Items</div>
          <div className="text-[11px] text-amber-800/80 mt-0.5">Require replenishment</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Controls Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU or barcode..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                title="Export Inventory as CSV"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={openAddModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {PRODUCT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stock Level Filter */}
            <div className="flex rounded-xl border border-slate-300 bg-white p-0.5 text-xs">
              <button
                onClick={() => setStockFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-medium ${
                  stockFilter === 'all' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                All Stock
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`rounded-lg px-2.5 py-1 font-medium ${
                  stockFilter === 'low' ? 'bg-amber-500 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                Low ({lowStockProducts.length})
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`rounded-lg px-2.5 py-1 font-medium ${
                  stockFilter === 'out' ? 'bg-red-600 text-white font-semibold' : 'text-slate-600'
                }`}
              >
                Out of Stock
              </button>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Gross Margin</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
                  const marginPercent = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) : '0';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0">{p.image || '📦'}</span>
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            {p.description && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                {p.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>

                      {/* SKU / Barcode */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-slate-800 font-semibold">{p.sku}</div>
                        <div className="text-slate-400">{p.barcode}</div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {formatCurrency(p.costPrice)}
                      </td>

                      {/* Selling */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4">
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {marginPercent}%
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4 font-bold">
                        <span className="text-slate-900 text-sm">{p.currentStock}</span>{' '}
                        <span className="text-slate-400 font-normal text-xs">{p.unit}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            Low Stock (≤{p.minStockAlert})
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openStockAdjustModal(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition"
                            title="Adjust Stock Count"
                          >
                            <SlidersHorizontal className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add / Edit Product */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Grocery Product' : 'Add New Grocery Product'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              {/* Product Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Royal Basmati Rice (5kg)"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SKU, Barcode, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. RICE-BAS-005"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 890103001001"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sales Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="bag">Bag</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="bottle">Bottle</option>
                    <option value="can">Can</option>
                    <option value="loaf">Loaf</option>
                    <option value="carton">Carton</option>
                    <option value="pack">Pack</option>
                    <option value="bunch">Bunch</option>
                  </select>
                </div>
              </div>

              {/* Cost Price, Selling Price & Profit Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Cost Price (Wholesale) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.costPrice || ''}
                      onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Selling Price (Retail) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.sellingPrice || ''}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-teal-800 font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>

                {/* Profit Margin Preview Bar */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 text-slate-600 font-semibold">
                  <span>Gross Profit per Unit: {formatCurrency(Math.max(0, formData.sellingPrice - formData.costPrice))}</span>
                  <span className="text-emerald-700 font-bold">
                    Margin: {formData.sellingPrice > 0 ? (((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Stock Levels & Reorder Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Current Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Low Stock Alert *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Supplier Selector */}
              <div>
                <label className="font-semibold text-slate-700">Primary Supplier</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                >
                  <option value="">None / Direct Sourcing</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
                  ))}
                </select>
              </div>

              {/* Icon Emoji & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="font-semibold text-slate-700">Display Emoji</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="font-semibold text-slate-700">Short Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Organic, 100% natural, imported..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjust Stock Count */}
      {isAdjustStockOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="text-base font-bold text-slate-900">
                Stock Adjustment
              </h3>
              <button
                onClick={() => setIsAdjustStockOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjust} className="p-5 space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{adjustingProduct.name}</div>
                <div className="text-slate-500 mt-0.5">SKU: {adjustingProduct.sku}</div>
                <div className="mt-2 flex justify-between font-semibold">
                  <span>Current Recorded Stock:</span>
                  <span className="font-bold text-slate-900">{adjustingProduct.currentStock} {adjustingProduct.unit}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">New Physical Count *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStockCount}
                  onChange={(e) => setNewStockCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base font-bold text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Difference badge */}
              <div className="flex justify-between items-center text-xs font-semibold px-1">
                <span>Adjustment Difference:</span>
                <span className={newStockCount >= adjustingProduct.currentStock ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                  {newStockCount - adjustingProduct.currentStock >= 0 ? `+${newStockCount - adjustingProduct.currentStock}` : newStockCount - adjustingProduct.currentStock} {adjustingProduct.unit}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason for Adjustment *</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                >
                  <option value="Physical inventory audit count">Physical inventory audit count</option>
                  <option value="Damaged / Broken in store">Damaged / Broken in store</option>
                  <option value="Expired date removal">Expired date removal</option>
                  <option value="Returned by customer in good shape">Returned by customer</option>
                  <option value="Theft or shrinkage write-off">Theft or shrinkage write-off</option>
                  <option value="Correction of previous entry error">Correction of entry error</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-teal-700 transition"
                >
                  Update Stock Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
