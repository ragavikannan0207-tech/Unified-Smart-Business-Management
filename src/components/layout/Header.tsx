import React, { useState } from 'react';
import {
  Menu,
  ShoppingCart,
  AlertTriangle,
  Plus,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { PageId } from '../../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAddProduct?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenAddProduct }) => {
  const { activePage, setActivePage, lowStockProducts, todaySalesStats, formatCurrency, cart } = useBusiness();
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const pageHeadings: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Business Dashboard',
      subtitle: 'Real-time overview of sales, inventory turnover, stock valuation and profit.',
    },
    pos: {
      title: 'Point of Sale (POS)',
      subtitle: 'High-speed checkout with instant barcode lookup, cart totals, and digital receipts.',
    },
    sales: {
      title: 'Sales History & Invoices',
      subtitle: 'Audit transactions, print past receipts, filter by payment method and handle returns.',
    },
    products: {
      title: 'Products & Inventory',
      subtitle: 'Manage catalog, update stock counts, view cost margins and set low-stock triggers.',
    },
    purchasing: {
      title: 'Purchasing & Stock Inward',
      subtitle: 'Generate supplier purchase orders and receive goods to auto-increase inventory.',
    },
    suppliers: {
      title: 'Suppliers & Vendors',
      subtitle: 'Track wholesale vendors, phone contacts, outstanding payables and purchase orders.',
    },
    customers: {
      title: 'Customers & Credit Ledger',
      subtitle: 'Customer directory, contact numbers, store credit tracking and loyalty rewards.',
    },
    reports: {
      title: 'Business Reports & Analytics',
      subtitle: 'Financial statements, gross margins, payment distribution and inventory valuation.',
    },
    'ai-assistant': {
      title: 'AI Smart Business Advisor',
      subtitle: 'Intelligent inventory insights, reorder forecasting, slow-moving stock identification.',
    },
    settings: {
      title: 'System & Store Settings',
      subtitle: 'Configure store address, tax rules, currency symbols, receipts and data backup.',
    },
  };

  const currentHeading = pageHeadings[activePage] || {
    title: 'Unified Smart Business System',
    subtitle: 'Integrated Store Management',
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {currentHeading.title}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            {currentHeading.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick actions & Live badges */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Today's Sales Snapshot chip */}
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
          <span className="text-slate-400 font-medium">Today's Sales:</span>
          <span className="font-bold text-teal-700">{formatCurrency(todaySalesStats.revenue)}</span>
          <span className="text-[10px] text-slate-400">({todaySalesStats.orderCount} orders)</span>
        </div>

        {/* Low Stock Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className={`relative rounded-xl border p-2 transition ${
              lowStockProducts.length > 0
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Stock alerts"
          >
            <AlertTriangle className="h-5 w-5" />
            {lowStockProducts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white shadow">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {/* Alert Popover */}
          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Low Stock Warnings ({lowStockProducts.length})
                </span>
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    setActivePage('products');
                  }}
                  className="text-[11px] font-semibold text-teal-600 hover:underline flex items-center gap-0.5"
                >
                  View All <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                {lowStockProducts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-500">
                    All inventory levels are optimal! 🎉
                  </p>
                ) : (
                  lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-amber-50/60 p-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">
                          SKU: {p.sku} • Alert below {p.minStockAlert}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-xs font-bold text-amber-900">
                          {p.currentStock} {p.unit}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {lowStockProducts.length > 0 && (
                <button
                  onClick={() => {
                    setShowAlertMenu(false);
                    setActivePage('purchasing');
                  }}
                  className="mt-2 w-full rounded-xl bg-teal-600 py-2 text-center text-xs font-semibold text-white hover:bg-teal-700 transition"
                >
                  Generate Restock Purchase Order
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI Advisor Shortcut */}
        <button
          onClick={() => setActivePage('ai-assistant')}
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
        >
          <Sparkles className="h-4 w-4 text-emerald-600" />
          <span>AI Insights</span>
        </button>

        {/* Quick Launch POS Button */}
        {activePage !== 'pos' ? (
          <button
            onClick={() => setActivePage('pos')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 transition active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Open POS</span>
            {cart.length > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] text-white">
                {cart.length}
              </span>
            )}
          </button>
        ) : (
          onOpenAddProduct && (
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
            >
              <Plus className="h-4 w-4 text-teal-600" />
              <span>New Product</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
