import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Sale, PaymentMethod } from '../types';

interface SalesHistoryProps {
  onOpenReceipt: (sale: Sale) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ onOpenReceipt }) => {
  const { sales, refundSale, formatCurrency } = useBusiness();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');

  // Filter logic
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || s.paymentMethod === methodFilter;
    const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const saleDate = new Date(s.date);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        matchesDate = saleDate >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        matchesDate = saleDate >= thirtyDaysAgo;
      }
    }

    return matchesSearch && matchesMethod && matchesStatus && matchesDate;
  });

  // Calculate summaries for filtered records
  const totalRevenue = filteredSales
    .filter((s) => s.paymentStatus !== 'refunded')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const activeOrdersCount = filteredSales.filter((s) => s.paymentStatus !== 'refunded').length;
  const avgOrderValue = activeOrdersCount > 0 ? totalRevenue / activeOrdersCount : 0;

  // Handle Refund
  const handleRefund = (sale: Sale) => {
    if (sale.paymentStatus === 'refunded') return;
    if (
      window.confirm(
        `Refund invoice ${sale.invoiceNumber} for ${formatCurrency(sale.grandTotal)}? This will automatically restore all ${sale.items.length} items back to inventory stock.`
      )
    ) {
      refundSale(sale.id);
    }
  };

  // Export Sales to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Customer', 'Items Count', 'Subtotal (INR)', 'Tax (INR)', 'Discount (INR)', 'Grand Total (INR)', 'Payment Method', 'Status'];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      new Date(s.date).toLocaleString(),
      `"${(s.customerName || 'Walk-in').replace(/"/g, '""')}"`,
      s.items.length,
      s.subtotal.toFixed(2),
      s.taxTotal.toFixed(2),
      s.discountTotal.toFixed(2),
      s.grandTotal.toFixed(2),
      s.paymentMethod,
      s.paymentStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Net Sales (Filtered)
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalRevenue)}
          </div>
          <span className="text-[11px] text-slate-400">Excludes refunded transactions</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Orders Completed
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {activeOrdersCount}
          </div>
          <span className="text-[11px] text-slate-400">Total processed receipts</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Average Basket Size
          </span>
          <div className="mt-2 text-2xl font-bold text-teal-700">
            {formatCurrency(avgOrderValue)}
          </div>
          <span className="text-[11px] text-slate-400">Revenue per transaction</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Filter Controls Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice #, customer or product..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
              />
            </div>

            {/* Export */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Date filter */}
            <div className="flex rounded-xl border border-slate-300 bg-white p-0.5">
              {(['all', 'today', '7days', '30days'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`rounded-lg px-2.5 py-1 font-medium capitalize transition ${
                    dateFilter === d ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d === 'all' ? 'All Dates' : d === 'today' ? 'Today' : d === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>

            {/* Payment Method filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 focus:border-teal-600"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="store_credit">Store Credit</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 focus:border-teal-600"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded / Returned</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Purchased</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {sale.customerName || 'Walk-in'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="max-w-[220px] truncate" title={sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}>
                        {sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-700 text-sm">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4">
                      {sale.paymentStatus === 'refunded' ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                          Refunded
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(sale)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition"
                          title="View Receipt"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>Receipt</span>
                        </button>
                        {sale.paymentStatus !== 'refunded' && (
                          <button
                            onClick={() => handleRefund(sale)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                            title="Refund & Restore Stock"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Refund</span>
                          </button>
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
    </div>
  );
};
