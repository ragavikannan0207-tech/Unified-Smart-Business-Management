import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  IndianRupee,
  CreditCard,
  QrCode,
  Users,
  CheckCircle2,
  Percent,
  X,
  Sparkles,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBusiness } from '../context/BusinessContext';
import { Product, PaymentMethod, Sale } from '../types';
import { PRODUCT_CATEGORIES } from '../data/mockData';

interface POSProps {
  onSaleComplete: (sale: Sale) => void;
  onOpenAddProduct: () => void;
}

export const POS: React.FC<POSProps> = ({ onSaleComplete, onOpenAddProduct }) => {
  const {
    products,
    customers,
    cart,
    addToCart,
    updateCartQty,
    setCartItemQuantity,
    removeFromCart,
    clearCart,
    cartTotals,
    cartDiscount,
    setCartDiscount,
    cartDiscountType,
    setCartDiscountType,
    selectedCustomerId,
    setSelectedCustomerId,
    completeSale,
    formatCurrency,
    playBeep,
    settings,
  } = useBusiness();

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Payment Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [splitAmounts, setSplitAmounts] = useState<{ cash: number; card: number }>({ cash: 0, card: 0 });

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Handle barcode scanner submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Look for matching barcode or exact SKU
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === code.toLowerCase() ||
        p.sku.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      if (found.currentStock <= 0) {
        setScanMessage(`"${found.name}" is OUT OF STOCK!`);
        playBeep('alert');
      } else {
        const added = addToCart(found, 1);
        if (added) {
          setScanMessage(`Added: ${found.name}`);
        } else {
          setScanMessage(`Cannot add more "${found.name}" (Max stock: ${found.currentStock})`);
        }
      }
    } else {
      setScanMessage(`Barcode "${code}" not found.`);
      playBeep('alert');
    }

    setBarcodeInput('');
    setTimeout(() => setScanMessage(null), 3000);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashTendered(Math.ceil(cartTotals.grandTotal));
    setSplitAmounts({
      cash: Math.round(cartTotals.grandTotal / 2),
      card: Math.round(cartTotals.grandTotal / 2),
    });
    setIsCheckoutOpen(true);
  };

  // Submit checkout
  const handleFinalizePayment = () => {
    let paymentDetails: Sale['paymentDetails'] = {};

    if (paymentMethod === 'cash') {
      const change = Math.max(0, cashTendered - cartTotals.grandTotal);
      paymentDetails = {
        cashReceived: cashTendered,
        changeGiven: change,
      };
    } else if (paymentMethod === 'card') {
      paymentDetails = {
        transactionRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      };
    } else if (paymentMethod === 'upi') {
      paymentDetails = {
        transactionRef: `UPI-${Math.floor(100000000 + Math.random() * 900000000)}`,
      };
    } else if (paymentMethod === 'split') {
      paymentDetails = {
        splitDetails: [
          { method: 'cash', amount: splitAmounts.cash },
          { method: 'card', amount: splitAmounts.card },
        ],
      };
    }

    const completed = completeSale({
      paymentMethod,
      paymentDetails,
      notes: paymentNotes,
    });

    if (completed) {
      setIsCheckoutOpen(false);
      setPaymentNotes('');

      // Celebration effect
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#10b981', '#06b6d4', '#f59e0b'],
        });
      } catch {
        // Safe confetti fallback
      }

      onSaleComplete(completed);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Quick cash bill recommendations based on grand total in INR
  const total = cartTotals.grandTotal;
  const standardNotes = [100, 200, 500, 1000, 2000];
  const roundedUp50 = Math.ceil(total / 50) * 50;
  const roundedUp100 = Math.ceil(total / 100) * 100;
  const roundedUp500 = Math.ceil(total / 500) * 500;
  const quickBills = [
    Math.ceil(total),
    roundedUp50,
    roundedUp100,
    roundedUp500,
    ...standardNotes,
  ]
    .filter((v, idx, arr) => v >= total && arr.indexOf(v) === idx)
    .sort((a, b) => a - b)
    .slice(0, 5);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)]">
      {/* LEFT SECTION: Catalog, Categories & Barcode Search */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Barcode & Search Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Quick Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <div className="relative">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or enter barcode / SKU + press Enter..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-20 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 font-mono transition"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
                >
                  Scan
                </button>
              </div>
            </form>

            {/* Keyword Search */}
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item name..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Barcode feedback banner */}
          {scanMessage && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-800 flex items-center justify-between animate-fadeIn">
              <span>{scanMessage}</span>
              <button onClick={() => setScanMessage(null)} className="text-teal-600 hover:text-teal-900">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3 py-1.5 font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <ShoppingBag className="h-12 w-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Try searching with a different term, select "All" categories, or add a new grocery item.
              </p>
              <button
                onClick={onOpenAddProduct}
                className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
              >
                + Add New Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockAlert;
                const inCart = cart.find((item) => item.product.id === product.id);

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product, 1)}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                      isOutOfStock
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : inCart
                        ? 'border-teal-500 bg-teal-50/20 ring-1 ring-teal-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-teal-400 hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Icon & Stock Pill */}
                    <div className="flex items-start justify-between w-full">
                      <span className="text-2xl">{product.image || '📦'}</span>
                      <div>
                        {isOutOfStock ? (
                          <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            {product.currentStock} left
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {product.currentStock} {product.unit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Name & SKU */}
                    <div className="mt-2.5">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                        {product.sku}
                      </p>
                    </div>

                    {/* Bottom: Price & Add Button */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 w-full">
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 group-hover:bg-teal-600 group-hover:text-white text-teal-700 transition">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {/* Quantity in Cart Indicator */}
                    {inCart && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm">
                        {inCart.quantity}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart Drawer / Billing Terminal */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Customer Header */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-teal-600" /> Customer Account
            </span>
            {selectedCustomer && selectedCustomer.id !== 'cust-1' && (
              <span className="text-[11px] text-teal-700 font-semibold">
                Pts: {selectedCustomer.loyaltyPoints} | Credit: {formatCurrency(selectedCustomer.outstandingCredit)}
              </span>
            )}
          </div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone && c.phone !== 'N/A' ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">Shopping Cart is Empty</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[180px]">
                Click items on the left or scan a barcode to begin checkout.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h5 className="text-xs font-bold text-slate-900 truncate">
                    {item.product.name}
                  </h5>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span>{formatCurrency(item.unitPrice)}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs">
                    <button
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-l-lg transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-r-lg transition"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Checkout Footer */}
        <div className="border-t border-slate-200 p-3.5 bg-slate-50/70 space-y-3">
          {/* Discount Field */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="number"
                min="0"
                value={cartDiscount || ''}
                onChange={(e) => setCartDiscount(parseFloat(e.target.value) || 0)}
                placeholder="Discount"
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-2 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <div className="flex rounded-xl border border-slate-300 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCartDiscountType('percentage')}
                className={`rounded-lg px-2 py-1 font-semibold ${
                  cartDiscountType === 'percentage' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setCartDiscountType('flat')}
                className={`rounded-lg px-2 py-1 font-semibold ${
                  cartDiscountType === 'flat' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                {settings.currencySymbol}
              </button>
            </div>
          </div>

          {/* Breakdown numbers */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({cartTotals.itemCount} items)</span>
              <span>{formatCurrency(cartTotals.subtotal)}</span>
            </div>
            {cartTotals.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span>-{formatCurrency(cartTotals.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax (GST/VAT)</span>
              <span>+{formatCurrency(cartTotals.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-teal-700 font-black">
                {formatCurrency(cartTotals.grandTotal)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              disabled={cart.length === 0}
              onClick={clearCart}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
              title="Clear Cart"
            >
              Clear
            </button>
            <button
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 transition active:scale-98"
            >
              <span>Pay & Complete</span>
              <span>•</span>
              <span>{formatCurrency(cartTotals.grandTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Checkout & Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select Payment Method
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: <strong>{selectedCustomer?.name || 'Walk-in'}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total Display Banner */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-600 p-5 text-white text-center">
              <span className="text-xs font-medium text-teal-100 uppercase tracking-wider">
                Total Payable Amount
              </span>
              <div className="text-3xl font-black mt-0.5">
                {formatCurrency(cartTotals.grandTotal)}
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition ${
                    paymentMethod === 'cash'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <IndianRupee className="h-5 w-5" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition ${
                    paymentMethod === 'card'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Card / POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition ${
                    paymentMethod === 'upi'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="h-5 w-5" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('store_credit')}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition ${
                    paymentMethod === 'store_credit'
                      ? 'border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>Credit</span>
                </button>
              </div>

              {/* CASH TENDER DETAILS */}
              {paymentMethod === 'cash' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Cash Received:</label>
                    <span className="text-xs text-slate-400">Enter exact tender</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg font-bold font-mono text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                  {/* Quick Bill buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickBills.map((bill) => (
                      <button
                        key={bill}
                        type="button"
                        onClick={() => setCashTendered(bill)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {formatCurrency(bill)}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-bold">
                    <span className="text-slate-700">Change to return:</span>
                    <span className={`text-base font-black ${
                      cashTendered >= cartTotals.grandTotal ? 'text-emerald-700' : 'text-amber-600'
                    }`}>
                      {formatCurrency(Math.max(0, cashTendered - cartTotals.grandTotal))}
                    </span>
                  </div>
                </div>
              )}

              {/* CARD TENDER DETAILS */}
              {paymentMethod === 'card' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center space-y-2">
                  <CreditCard className="h-8 w-8 text-teal-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-800">Card Payment Processing</p>
                  <p className="text-[11px] text-slate-500">
                    Swipe or tap customer card on the physical card reader.
                  </p>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reader Connected & Ready
                  </div>
                </div>
              )}

              {/* UPI QR CODE DETAILS */}
              {paymentMethod === 'upi' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center space-y-2">
                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-xl bg-white border border-slate-200 p-2 shadow-xs">
                    {/* Simulated Clean SVG QR Code */}
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      <rect width="100" height="100" fill="#ffffff" />
                      <path
                        d="M10 10h28v28h-28z M16 16h16v16h-16z M62 10h28v28h-28z M68 16h16v16h-16z M10 62h28v28h-28z M16 68h16v16h-16z M46 12h8v8h-8z M46 28h8v12h-8z M46 50h8v8h-8z M46 72h8v18h-8z M62 62h12v12h-12z M80 62h10v10h-10z M62 80h10v10h-10z M78 78h12v12h-12z"
                        fill="#0f172a"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-800">Scan to Pay with UPI</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    greenleafmart@upi • Amount: {formatCurrency(cartTotals.grandTotal)}
                  </p>
                </div>
              )}

              {/* STORE CREDIT */}
              {paymentMethod === 'store_credit' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Customer Account Ledger</div>
                  <p className="text-slate-500">
                    This amount will be added to <strong>{selectedCustomer?.name}</strong>'s outstanding store balance.
                  </p>
                  <div className="flex justify-between font-semibold pt-1 border-t border-slate-200">
                    <span>Current Credit Balance:</span>
                    <span>{formatCurrency(selectedCustomer?.outstandingCredit || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-teal-700">
                    <span>New Balance After Sale:</span>
                    <span>{formatCurrency((selectedCustomer?.outstandingCredit || 0) + cartTotals.grandTotal)}</span>
                  </div>
                </div>
              )}

              {/* Optional Transaction Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Transaction Notes (Optional):</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Home delivery requested, coupon verified..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Submit Checkout Button */}
              <button
                type="button"
                onClick={handleFinalizePayment}
                className="w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:from-teal-700 hover:to-emerald-700 transition active:scale-98"
              >
                Confirm Payment & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
