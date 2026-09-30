import React from 'react';
import {
  Printer,
  Share2,
  X,
  CheckCircle2,
  Store,
  Clock,
  Sparkles,
  Phone,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';

export const ReceiptModal: React.FC = () => {
  const { currentReceipt, setCurrentReceipt, settings, deleteSale } = useApp();

  if (!currentReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteThisSale = () => {
    if (confirm(`Are you sure you want to permanently delete this sale (${currentReceipt.receiptNumber})? The items (${currentReceipt.quantity}) will be restored back to stock.`)) {
      deleteSale(currentReceipt.id, true);
      setCurrentReceipt(null);
    }
  };

  const handleShareWhatsApp = () => {
    const sale = currentReceipt;
    const lines = [
      `🧾 *${settings.businessName.toUpperCase()}*`,
      `${settings.location || 'Ghana'} | Tel: ${settings.phone}`,
      `---------------------------------`,
      `*Official Sales Receipt*`,
      `Receipt #: ${sale.receiptNumber}`,
      `Date: ${sale.date} ${sale.time || ''}`,
      `Customer: ${sale.customerName}`,
      `---------------------------------`,
      `*Item:* ${sale.productName}`,
      `*Quantity:* ${sale.quantity}`,
      `*Price Charged:* ${formatCurrency(sale.bargainUnitPrice, settings.currencySymbol)}`,
      sale.discountPerUnit > 0 ? `*Bargain Discount:* -${formatCurrency(sale.discountPerUnit, settings.currencySymbol)}/ea` : '',
      `---------------------------------`,
      `*TOTAL AMOUNT:* ${formatCurrency(sale.totalAmount, settings.currencySymbol)}`,
      `*Payment:* ${sale.paymentMethod.toUpperCase()} (${sale.paymentStatus.toUpperCase()})`,
      `---------------------------------`,
      `${settings.receiptFooter || 'Thank you for your business! God bless you!'}`,
    ].filter(Boolean).join('\n');

    const encoded = encodeURIComponent(lines);
    const phoneParam = sale.customerPhone ? sale.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phoneParam ? `https://wa.me/${phoneParam}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 print:p-0 print:bg-white print:static">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Modal Top Controls (hidden when printing) */}
        <div className="p-3 bg-emerald-900 text-white flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Sale Completed Successfully
          </span>
          <button
            onClick={() => setCurrentReceipt(null)}
            className="w-7 h-7 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RECEIPT PAPER VIEW (Styled like clean thermal retail receipt) */}
        <div id="receipt-paper" className="p-5 font-mono text-slate-800 text-xs space-y-3 bg-white">
          <div className="text-center space-y-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center mx-auto mb-1">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black tracking-tight text-slate-950 font-sans">
              {settings.businessName}
            </h2>
            <p className="text-[11px] text-slate-500 font-sans font-medium">
              {settings.tagline}
            </p>
            <p className="text-[10px] text-slate-500 font-sans">
              {settings.location}
            </p>
            <p className="text-[10px] text-slate-600 font-sans font-semibold">
              Tel: {settings.phone}
            </p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No:</span>
              <strong className="text-slate-900 font-bold">{currentReceipt.receiptNumber}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{currentReceipt.date} {currentReceipt.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <strong className="text-slate-900 font-bold">{currentReceipt.customerName}</strong>
            </div>
            {currentReceipt.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span>{currentReceipt.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Item details */}
          <div className="space-y-1.5 py-1">
            <div className="flex justify-between font-bold text-slate-900 text-xs">
              <span className="flex-1 truncate pr-2">{currentReceipt.productName}</span>
              <span>×{currentReceipt.quantity}</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[10px]">
              <span>Standard {currentReceipt.priceType.toUpperCase()} Price:</span>
              <span>{formatCurrency(currentReceipt.originalCatalogPrice, settings.currencySymbol)}</span>
            </div>

            <div className="flex justify-between text-slate-800 text-[11px] font-bold">
              <span>Actual Sale Price Charged:</span>
              <span className="text-slate-950 font-black">
                {formatCurrency(currentReceipt.bargainUnitPrice, settings.currencySymbol)}
              </span>
            </div>

            {currentReceipt.discountPerUnit > 0 && (
              <div className="flex justify-between text-emerald-700 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                <span>Negotiated Savings:</span>
                <span>-{formatCurrency(currentReceipt.discountPerUnit * currentReceipt.quantity, settings.currencySymbol)} (-{formatCurrency(currentReceipt.discountPerUnit, settings.currencySymbol)}/ea)</span>
              </div>
            )}

            {currentReceipt.notes && (
              <div className="text-[10px] text-slate-500 italic">
                Note: {currentReceipt.notes}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="border-t border-b border-dashed border-slate-300 py-2.5 space-y-1">
            <div className="flex justify-between items-center text-sm font-black text-slate-950">
              <span>TOTAL PAID:</span>
              <span className="text-base text-emerald-800">
                {formatCurrency(currentReceipt.totalAmount, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Payment Mode:</span>
              <span className="uppercase font-bold text-slate-800">{currentReceipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Status:</span>
              <span className={`uppercase font-bold ${currentReceipt.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-rose-600'}`}>
                {currentReceipt.paymentStatus}
              </span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-1 space-y-1 text-[10px] text-slate-500 font-sans">
            <p className="font-semibold text-slate-700">
              {settings.receiptFooter || 'Medaase! Thank you for buying from us. God bless your business!'}
            </p>
            <p className="text-[9px] text-slate-400">
              Awurade Ne Me Franka Business Manager • Offline Ready
            </p>
          </div>
        </div>

        {/* Bottom Actions (hidden when printing) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-2 print:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ticket</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleDeleteThisSale}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 hover:bg-rose-50 rounded"
              title="Delete this transaction and restore items to stock"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Sale</span>
            </button>

            <button
              onClick={() => setCurrentReceipt(null)}
              className="py-1 px-3 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Close & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
