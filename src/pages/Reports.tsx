import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  PieChart,
  Download,
  Calendar,
  ArrowUpRight,
  Package,
  CreditCard,
  Percent,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export const Reports: React.FC = () => {
  const { sales, products, formatCurrency } = useBusiness();

  // Date Filter
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  // Filtered sales based on date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.paymentStatus === 'refunded') return false; // Ignore refunds in profit calculations
      const saleDate = new Date(s.date);
      if (dateRange === 'today') {
        return saleDate.toDateString() === now.toDateString();
      } else if (dateRange === '7days') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return saleDate >= d;
      } else if (dateRange === '30days') {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return saleDate >= d;
      }
      return true;
    });
  }, [sales, dateRange]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let grossSales = 0;
    let discounts = 0;
    let taxes = 0;
    let cogs = 0; // Cost of goods sold
    let totalItems = 0;

    filteredSales.forEach((sale) => {
      grossSales += sale.subtotal;
      discounts += sale.discountTotal;
      taxes += sale.taxTotal;
      sale.items.forEach((item) => {
        cogs += item.quantity * item.costPrice;
        totalItems += item.quantity;
      });
    });

    const netSales = grossSales - discounts;
    const grossProfit = netSales - cogs;
    const profitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const aov = filteredSales.length > 0 ? (grossSales - discounts + taxes) / filteredSales.length : 0;

    return {
      grossSales,
      discounts,
      taxes,
      cogs,
      netSales,
      grossProfit,
      profitMargin,
      orderCount: filteredSales.length,
      totalItems,
      aov,
    };
  }, [filteredSales]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    filteredSales.forEach((s) => {
      const cur = map.get(s.paymentMethod) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += s.grandTotal;
      map.set(s.paymentMethod, cur);
    });

    const grandTotal = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);

    return Array.from(map.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : '0',
    }));
  }, [filteredSales]);

  // Category breakdown from sales
  const categorySales = useMemo(() => {
    const map = new Map<string, { revenue: number; units: number }>();
    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'General';
        const cur = map.get(cat) || { revenue: 0, units: 0 };
        cur.revenue += item.total;
        cur.units += item.quantity;
        map.set(cat, cur);
      });
    });

    return Array.from(map.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, products]);

  // Export Financial CSV
  const handleExportCSV = () => {
    const reportData = [
      ['Metric', 'Value'],
      ['Date Range Filter', dateRange],
      ['Total Completed Orders', metrics.orderCount],
      ['Total Items Sold', metrics.totalItems],
      ['Gross Merchandise Value (GMV in INR)', metrics.grossSales.toFixed(2)],
      ['Discounts Given (INR)', metrics.discounts.toFixed(2)],
      ['Net Revenue (INR)', metrics.netSales.toFixed(2)],
      ['Cost of Goods Sold (COGS in INR)', metrics.cogs.toFixed(2)],
      ['Gross Operating Profit (INR)', metrics.grossProfit.toFixed(2)],
      ['Gross Profit Margin %', `${metrics.profitMargin.toFixed(1)}%`],
      ['Taxes Collected (INR)', metrics.taxes.toFixed(2)],
      ['Average Order Value (AOV in INR)', metrics.aov.toFixed(2)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + reportData.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-report-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Range Selector & Export Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Store Performance & Financial Statements
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculated in real-time from all confirmed counter sales, invoices and inventory costs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range tabs */}
          <div className="flex rounded-xl border border-slate-300 bg-white p-0.5 text-xs">
            {(['today', '7days', '30days', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  dateRange === r ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7days' ? 'Last 7 Days' : r === '30days' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Sales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Net Sales Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.netSales)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Gross: {formatCurrency(metrics.grossSales)} (Discounts: -{formatCurrency(metrics.discounts)})
          </div>
        </div>

        {/* Cost of Goods Sold */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Cost of Goods (COGS)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.cogs)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Wholesale inventory replenishment cost
          </div>
        </div>

        {/* Gross Profit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Gross Operating Profit</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(metrics.grossProfit)}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs">
            <span className="rounded bg-emerald-100 px-1.5 py-0.2 font-bold text-emerald-800">
              {metrics.profitMargin.toFixed(1)}% Gross Margin
            </span>
          </div>
        </div>

        {/* Basket Size & AOV */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">Average Order (AOV)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.aov)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {metrics.orderCount} total orders • {metrics.totalItems} items sold
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: Payment Distribution & Category Revenue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Channels Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Payment Methods Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Share of store revenue collected by cash, card, UPI and credit
            </p>
          </div>

          <div className="mt-4 space-y-4">
            {paymentBreakdown.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No transactions recorded in this period.</p>
            ) : (
              paymentBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 capitalize flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-teal-600" />
                      {item.method} ({item.count} orders)
                    </span>
                    <span className="font-bold text-slate-900">{formatCurrency(item.total)} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-600"
                      style={{ width: `${Math.max(5, parseFloat(item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Sales Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Sales by Grocery Category
            </h3>
            <p className="text-xs text-slate-500">
              Turnover contribution across different product categories
            </p>
          </div>

          <div className="mt-4 space-y-3.5 max-h-72 overflow-y-auto pr-1">
            {categorySales.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No category sales in this period.</p>
            ) : (
              categorySales.map((cat, idx) => {
                const totalCatRev = categorySales.reduce((acc, c) => acc + c.revenue, 0);
                const percent = totalCatRev > 0 ? Math.round((cat.revenue / totalCatRev) * 100) : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.category}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(cat.revenue)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{cat.units} units sold</span>
                      <span>{percent}% of period sales</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
