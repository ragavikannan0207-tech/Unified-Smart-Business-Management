import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Truck,
  Sparkles,
  Receipt,
  Users,
  ChevronRight,
  Clock,
  Eye,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Sale } from '../types';

interface DashboardProps {
  onOpenReceipt: (sale: Sale) => void;
  onOpenAddProduct: () => void;
  onOpenCreatePO: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenReceipt,
  onOpenAddProduct,
  onOpenCreatePO,
}) => {
  const {
    sales,
    products,
    customers,
    lowStockProducts,
    totalInventoryValuation,
    todaySalesStats,
    setActivePage,
    formatCurrency,
    settings,
  } = useBusiness();

  // Chart time range toggle: 7 days vs 14 days
  const [chartDays, setChartDays] = useState<7 | 14>(7);
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; revenue: number; profit: number } | null>(null);

  // Compute 7 or 14 day performance
  const trendData = useMemo(() => {
    const data: { date: string; displayDate: string; revenue: number; cost: number; profit: number; orders: number }[] = [];
    const now = new Date();

    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const displayDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      const daySales = sales.filter((s) => s.paymentStatus !== 'refunded' && s.date.slice(0, 10) === dateStr);
      let dayRev = 0;
      let dayCost = 0;

      daySales.forEach((s) => {
        dayRev += s.grandTotal;
        s.items.forEach((item) => {
          dayCost += item.quantity * item.costPrice;
        });
      });

      data.push({
        date: dateStr,
        displayDate,
        revenue: dayRev,
        cost: dayCost,
        profit: dayRev - dayCost,
        orders: daySales.length,
      });
    }
    return data;
  }, [sales, chartDays]);

  const maxRevenue = useMemo(() => {
    const max = Math.max(...trendData.map((d) => d.revenue), 100);
    return Math.ceil(max * 1.15);
  }, [trendData]);

  // Top selling products calculated from real transactions
  const topProducts = useMemo(() => {
    const map = new Map<string, { product: (typeof products)[0] | undefined; qty: number; revenue: number }>();
    sales.forEach((s) => {
      if (s.paymentStatus === 'refunded') return;
      s.items.forEach((item) => {
        const existing = map.get(item.productId) || {
          product: products.find((p) => p.id === item.productId),
          qty: 0,
          revenue: 0,
        };
        existing.qty += item.quantity;
        existing.revenue += item.total;
        map.set(item.productId, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales, products]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const catMap = new Map<string, { count: number; totalStock: number; value: number }>();
    products.forEach((p) => {
      const cur = catMap.get(p.category) || { count: 0, totalStock: 0, value: 0 };
      cur.count += 1;
      cur.totalStock += p.currentStock;
      cur.value += p.currentStock * p.sellingPrice;
      catMap.set(p.category, cur);
    });
    return Array.from(catMap.entries()).map(([category, stats]) => ({
      category,
      ...stats,
    })).sort((a, b) => b.value - a.value);
  }, [products]);

  // 7-day total metrics
  const totalPeriodRevenue = trendData.reduce((acc, d) => acc + d.revenue, 0);
  const totalPeriodProfit = trendData.reduce((acc, d) => acc + d.profit, 0);
  const totalPeriodMargin = totalPeriodRevenue > 0 ? (totalPeriodProfit / totalPeriodRevenue) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Quick Launch & Welcome Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300 border border-teal-500/30">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              Store Active & Synchronized
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {settings.storeName} Overview
            </h2>
            <p className="text-sm text-slate-300">
              Integrated Point of Sale, live inventory stock depletion, wholesale purchasing and automated margin reporting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActivePage('pos')}
              className="flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 text-sm shadow-md transition transform active:scale-95"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Launch POS Terminal</span>
            </button>
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 text-sm border border-slate-700 transition"
            >
              <Plus className="h-4 w-4 text-teal-400" />
              <span>Add Product</span>
            </button>
            <button
              onClick={onOpenCreatePO}
              className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 text-sm border border-slate-700 transition"
            >
              <Truck className="h-4 w-4 text-emerald-400" />
              <span>Order Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Today's Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's Revenue
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(todaySalesStats.revenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="flex items-center font-semibold text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {todaySalesStats.orderCount} Orders
              </span>
              <span className="text-slate-400">• Today's Net: {formatCurrency(todaySalesStats.profit)}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: 7-Day Net Profit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {chartDays}-Day Gross Profit
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(totalPeriodProfit)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800">
                {totalPeriodMargin.toFixed(1)}% Margin
              </span>
              <span className="text-slate-400">on {formatCurrency(totalPeriodRevenue)} sales</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Inventory Valuation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Stock Valuation (Cost / Retail)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(totalInventoryValuation.costValue)}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Retail Value: <strong className="text-slate-800">{formatCurrency(totalInventoryValuation.retailValue)}</strong></span>
              <span>{totalInventoryValuation.totalUnits} items</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Low Stock Warnings */}
        <div className={`rounded-2xl border p-5 shadow-xs transition hover:shadow-md ${
          lowStockProducts.length > 0
            ? 'border-amber-200 bg-amber-50/50'
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Warnings
            </span>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              lowStockProducts.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                {lowStockProducts.length}
              </span>
              <span className="text-xs text-slate-500">SKUs below minimum alert</span>
            </div>
            <div className="mt-1">
              <button
                onClick={() => setActivePage('products')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
              >
                Inspect & Reorder Stock <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Revenue & Profit Trend Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Revenue & Profit Analysis
              </h3>
              <p className="text-xs text-slate-500">
                Daily transaction volume, revenue vs cost comparison
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs text-slate-600 mr-2">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Revenue
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Gross Profit
                </span>
              </div>
              <div className="flex rounded-xl border border-slate-200 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setChartDays(7)}
                  className={`rounded-lg px-2.5 py-1 ${
                    chartDays === 7 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setChartDays(14)}
                  className={`rounded-lg px-2.5 py-1 ${
                    chartDays === 14 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  14 Days
                </button>
              </div>
            </div>
          </div>

          {/* Interactive SVG Bar & Line Chart */}
          <div className="mt-6 relative">
            {hoveredPoint && (
              <div className="absolute top-2 right-4 z-20 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg text-xs">
                <div className="font-bold text-slate-800">{hoveredPoint.date}</div>
                <div className="text-teal-600 font-semibold">Revenue: {formatCurrency(hoveredPoint.revenue)}</div>
                <div className="text-emerald-600 font-semibold">Profit: {formatCurrency(hoveredPoint.profit)}</div>
              </div>
            )}

            <div className="h-64 w-full flex items-end gap-2 sm:gap-4 pt-6 pb-2">
              {trendData.map((d, index) => {
                const revHeightPercent = Math.max(6, Math.min(100, (d.revenue / maxRevenue) * 100));
                const profitHeightPercent = Math.max(3, Math.min(100, (d.profit / maxRevenue) * 100));

                return (
                  <div
                    key={index}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                    onMouseEnter={() => setHoveredPoint({ date: d.displayDate, revenue: d.revenue, profit: d.profit })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-sm">
                      {formatCurrency(d.revenue)}
                    </div>

                    {/* Bars side by side */}
                    <div className="w-full flex items-end justify-center gap-1 h-48">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeightPercent}%` }}
                        className="w-full max-w-[20px] rounded-t-md bg-teal-500 group-hover:bg-teal-600 transition-all duration-300"
                      />
                      {/* Profit Bar */}
                      <div
                        style={{ height: `${profitHeightPercent}%` }}
                        className="w-full max-w-[20px] rounded-t-md bg-emerald-400 group-hover:bg-emerald-500 transition-all duration-300"
                      />
                    </div>

                    {/* X-axis date label */}
                    <span className="mt-2 text-[10px] font-medium text-slate-500 truncate max-w-[42px] sm:max-w-none">
                      {d.displayDate.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Inventory Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Inventory by Category
            </h3>
            <p className="text-xs text-slate-500">
              Total stock retail valuation by grocery section
            </p>
          </div>

          <div className="mt-4 space-y-4 max-h-[290px] overflow-y-auto pr-1">
            {categoryStats.map((cat, idx) => {
              const percentage = totalInventoryValuation.retailValue > 0
                ? Math.round((cat.value / totalInventoryValuation.retailValue) * 100)
                : 0;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cat.count} products • {cat.totalStock} units</span>
                    <span>{percentage}% of inventory</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Low Stock Alert Actions & Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Top Selling Products
              </h3>
              <p className="text-xs text-slate-500">
                Highest turnover items across all completed sales
              </p>
            </div>
            <button
              onClick={() => setActivePage('reports')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Full Analytics →
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No sales recorded yet.</p>
            ) : (
              topProducts.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.product?.name || 'Item'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.qty} units sold • Stock left: <strong className="text-slate-700">{item.product?.currentStock ?? 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-teal-700">
                      {formatCurrency(item.revenue)}
                    </div>
                    <span className="text-[11px] text-slate-400">Total gross</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Quick Reorder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Action Center
              </h3>
              <p className="text-xs text-slate-500">
                Items near or below reorder threshold
              </p>
            </div>
            <button
              onClick={() => setActivePage('purchasing')}
              className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100"
            >
              Create Purchase Order
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-emerald-700">All inventory healthy!</p>
                <p className="text-xs text-slate-400">No products are currently under danger levels.</p>
              </div>
            ) : (
              lowStockProducts.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      Supplier: {p.supplierName || 'General Wholesale'} • Min alert: {p.minStockAlert}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                      {p.currentStock} {p.unit} left
                    </span>
                    <button
                      onClick={() => {
                        onOpenCreatePO();
                      }}
                      className="rounded-lg border border-teal-600 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recent Sales Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Latest counter checkouts, payment receipts and audit log
            </p>
          </div>
          <button
            onClick={() => setActivePage('sales')}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700"
          >
            View All Transactions →
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Sold</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 6).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {sale.customerName || 'Walk-in'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 capitalize">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-teal-700 text-sm">
                    {formatCurrency(sale.grandTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onOpenReceipt(sale)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition"
                      title="View & Print Receipt"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
