import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  IndianRupee,
  Receipt,
  RotateCcw,
  Save,
  Download,
  Upload,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetDemoData, playBeep } = useBusiness();

  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    playBeep('success');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all store data? This will clear all transactions and restore the default grocery demo dataset.'
      )
    ) {
      resetDemoData();
      setFormData({ ...settings });
    }
  };

  // Export full JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      settings: localStorage.getItem('sbms_settings_v1'),
      products: localStorage.getItem('sbms_products_v1'),
      customers: localStorage.getItem('sbms_customers_v1'),
      suppliers: localStorage.getItem('sbms_suppliers_v1'),
      sales: localStorage.getItem('sbms_sales_v1'),
      purchaseOrders: localStorage.getItem('sbms_po_v1'),
      movements: localStorage.getItem('sbms_movements_v1'),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `greenleaf-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            System & Store Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business identity, tax rates, currency symbol, thermal receipt footer and data backups.
          </p>
        </div>
        {saveSuccess && (
          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Store Business Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="h-4 w-4 text-teal-600" />
            Store Information & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Business / Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tagline / Slogan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Customer Helpline Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Store Support Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="font-semibold text-slate-700">Physical Store Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">GST / VAT / Sales Tax Number</label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Currency & Tax Configuration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            Currency & Tax Rates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Currency Symbol</label>
              <select
                value={formData.currencySymbol}
                onChange={(e) => {
                  const symbol = e.target.value;
                  let code = 'INR';
                  if (symbol === '$') code = 'USD';
                  else if (symbol === '€') code = 'EUR';
                  else if (symbol === '£') code = 'GBP';
                  else if (symbol === '¥') code = 'JPY';
                  else if (symbol === '₨') code = 'PKR';
                  else if (symbol.includes('AED')) code = 'AED';
                  else if (symbol.includes('RM')) code = 'MYR';
                  setFormData({ ...formData, currencySymbol: symbol, currencyCode: code });
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 font-bold focus:border-teal-600"
              >
                <option value="₹">₹ (INR - Indian Rupee - Default)</option>
                <option value="$">$ (USD / AUD / CAD)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="¥">¥ (JPY / CNY)</option>
                <option value="₨">₨ (PKR / LKR / NPR)</option>
                <option value="AED ">AED (United Arab Emirates)</option>
                <option value="RM ">RM (Malaysian Ringgit)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Default Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.taxRateDefault}
                onChange={(e) => setFormData({ ...formData, taxRateDefault: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 font-bold focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Default Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.lowStockThresholdDefault}
                onChange={(e) => setFormData({ ...formData, lowStockThresholdDefault: parseInt(e.target.value, 10) || 5 })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 font-bold focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Receipt & Sound Customization */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Receipt className="h-4 w-4 text-indigo-600" />
            Receipt Layout & Checkout Feedback
          </h3>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Receipt Header Slogan</label>
              <input
                type="text"
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Receipt Footer / Return Policy</label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-600"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.enableSoundEffects}
                  onChange={(e) => setFormData({ ...formData, enableSoundEffects: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-600 h-4 w-4"
                />
                <span>Enable tactile audio feedback on barcode scans & checkout completions</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* SECTION 4: Data Management & Backup */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <RotateCcw className="h-4 w-4 text-slate-700" />
          Data Backup & Demo Management
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-semibold text-slate-800">Export Complete Database Backup</div>
            <p className="text-slate-500">
              Download your catalog, customers, suppliers and transaction history as a JSON file.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Backup (JSON)</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs pt-3 border-t border-slate-100">
          <div>
            <div className="font-semibold text-amber-800">Reset Demo Data</div>
            <p className="text-slate-500">
              Restore default sample grocery inventory, suppliers, customers and test sales.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-semibold text-red-700 hover:bg-red-100 transition"
          >
            Reset to Sample Grocery Data
          </button>
        </div>
      </div>
    </div>
  );
};
