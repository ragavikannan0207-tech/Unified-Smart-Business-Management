import React from 'react';
import { X, Printer, Download, CheckCircle2, Share2 } from 'lucide-react';
import { Sale } from '../../types';
import { useBusiness } from '../../context/BusinessContext';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { settings, formatCurrency } = useBusiness();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const receiptText = `
========================================
${settings.storeName.toUpperCase()}
${settings.tagline}
Phone: ${settings.phone}
Address: ${settings.address}
GSTIN: ${settings.taxNumber}
========================================
Invoice #: ${sale.invoiceNumber}
Date: ${new Date(sale.date).toLocaleString()}
Cashier: ${sale.cashierName}
Customer: ${sale.customerName || 'Walk-in Customer'}
----------------------------------------
ITEMS:
${sale.items
  .map(
    (i) =>
      `${i.productName.padEnd(24).slice(0, 24)} x${i.quantity}  ${formatCurrency(i.total)}`
  )
  .join('\n')}
----------------------------------------
Subtotal:        ${formatCurrency(sale.subtotal)}
Discount:       -${formatCurrency(sale.discountTotal)}
Tax:            +${formatCurrency(sale.taxTotal)}
----------------------------------------
GRAND TOTAL:     ${formatCurrency(sale.grandTotal)}
Payment Method:  ${sale.paymentMethod.toUpperCase()}
${sale.paymentDetails?.cashReceived ? `Cash Received:   ${formatCurrency(sale.paymentDetails.cashReceived)}\nChange Returned: ${formatCurrency(sale.paymentDetails.changeGiven || 0)}` : ''}
========================================
${settings.receiptFooter}
========================================
    `;

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${sale.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4" />
            <span>Transaction Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Print Receipt"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Download Text File"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Thermal Printable Receipt Content */}
        <div id="printable-receipt" className="p-6 font-mono text-xs text-slate-800 bg-white">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-base font-extrabold tracking-tight font-sans text-slate-900 uppercase">
              {settings.storeName}
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">{settings.tagline}</p>
            <p className="text-[11px] text-slate-500 mt-1">Phone: {settings.phone}</p>
            <p className="text-[11px] text-slate-500">{settings.address}</p>
            {settings.taxNumber && (
              <p className="text-[10px] text-slate-400 mt-0.5">GSTIN: {settings.taxNumber}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="py-3 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span>{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-medium">{sale.customerName || 'Walk-in'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{sale.cashierName}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-slate-500 text-[10px] uppercase pb-1.5 border-b border-slate-100">
              <span>Item</span>
              <span>Qty x Rate</span>
              <span>Total</span>
            </div>
            <div className="divide-y divide-slate-100 pt-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="py-1.5 flex justify-between items-center text-[11px]">
                  <div className="max-w-[140px] truncate">
                    <div className="font-semibold text-slate-900 truncate">{item.productName}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{item.sku}</div>
                  </div>
                  <div className="text-slate-500 text-right">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                  <div className="font-bold text-slate-900 text-right">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span>-{formatCurrency(sale.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax (GST/VAT)</span>
              <span>+{formatCurrency(sale.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>GRAND TOTAL</span>
              <span className="text-teal-700">{formatCurrency(sale.grandTotal)}</span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="py-3 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Tender:</span>
              <span className="font-bold uppercase text-slate-800">{sale.paymentMethod}</span>
            </div>
            {sale.paymentDetails?.cashReceived !== undefined && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Cash Tendered:</span>
                  <span>{formatCurrency(sale.paymentDetails.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Change Due:</span>
                  <span>{formatCurrency(sale.paymentDetails.changeGiven || 0)}</span>
                </div>
              </>
            )}
            {sale.paymentDetails?.transactionRef && (
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Ref No:</span>
                <span>{sale.paymentDetails.transactionRef}</span>
              </div>
            )}
          </div>

          {/* Footer Barcode & Message */}
          <div className="pt-4 text-center">
            {/* Simulated barcode */}
            <div className="mx-auto flex h-10 w-48 items-center justify-center bg-slate-900 text-white font-mono tracking-widest text-xs rounded select-none">
              ||| | |||| | ||| || |||
            </div>
            <div className="text-[10px] text-slate-400 tracking-wider mt-1">{sale.invoiceNumber}</div>
            <p className="mt-3 text-[10px] text-slate-500 font-sans leading-relaxed">
              {settings.receiptFooter}
            </p>
          </div>
        </div>

        {/* Done / Dismiss Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-teal-600 py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
          >
            Done & Ready for Next Sale
          </button>
        </div>
      </div>
    </div>
  );
};
