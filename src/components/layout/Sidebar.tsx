import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Truck,
  Building2,
  Users,
  BarChart3,
  Sparkles,
  Settings,
  RotateCcw,
  Store,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { PageId } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activePage, setActivePage, lowStockProducts, cart, settings, resetDemoData } = useBusiness();

  const navItems: { id: PageId; label: string; icon: React.FC<{ className?: string }>; badge?: string | number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'pos',
      label: 'Point of Sale (POS)',
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.length}` : undefined,
      badgeColor: 'bg-teal-500 text-white',
    },
    { id: 'sales', label: 'Sales History', icon: Receipt },
    {
      id: 'products',
      label: 'Products & Inventory',
      icon: Package,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length}` : undefined,
      badgeColor: 'bg-amber-500 text-white animate-pulse',
    },
    { id: 'purchasing', label: 'Purchasing (PO)', icon: Truck },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    {
      id: 'ai-assistant',
      label: 'AI Business Advisor',
      icon: Sparkles,
      badge: 'Smart',
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold',
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (pageId: PageId) => {
    setActivePage(pageId);
    setMobileOpen(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo data back to default grocery store sample?')) {
      resetDemoData();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-100 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white shadow-md shadow-teal-500/20">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Unified Smart
                <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[145px]" title={settings.storeName}>
                {settings.storeName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Operations & Management
          </div>

          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/40 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Low Stock banner shortcut */}
        {lowStockProducts.length > 0 && (
          <div className="mx-3.5 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>{lowStockProducts.length} Items Need Reorder</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-200/80">
              Low inventory detected below safety threshold.
            </p>
            <button
              onClick={() => handleNavClick('products')}
              className="mt-2 w-full rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs py-1 font-medium transition"
            >
              Review Low Stock →
            </button>
          </div>
        )}

        {/* Bottom bar & Demo reset */}
        <div className="border-t border-slate-800 p-3.5 space-y-2">
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-teal-400" />
            <span>Reset Demo Store Data</span>
          </button>
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
            <span>Terminal: #POS-01</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
