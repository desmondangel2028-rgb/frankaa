import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code,
  X,
  Sparkles,
  Link,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  copyForGoogleSheets,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  generateSalesCSV,
  generatePurchasesCSV,
  generateExpensesCSV,
  generateProductsCSV,
  downloadCSV,
} from '../utils/googleSheetsExport';
import { getTodayDateString } from '../utils/calculations';

export const GoogleSheetsModal: React.FC = () => {
  const {
    isGoogleSheetsModalOpen,
    setIsGoogleSheetsModalOpen,
    sales,
    purchases,
    expenses,
    products,
    settings,
    updateSettings,
  } = useApp();

  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [webhookInput, setWebhookInput] = useState<string>(settings.googleSheetsWebhookUrl || '');
  const [isSavedWebhook, setIsSavedWebhook] = useState<boolean>(false);

  if (!isGoogleSheetsModalOpen) return null;

  const handleCopy = async (type: 'sales' | 'purchases' | 'expenses' | 'inventory' | 'pnl') => {
    const success = await copyForGoogleSheets(type, {
      sales,
      purchases,
      expenses,
      products,
      settings,
    });
    if (success) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      alert('Could not copy to clipboard. Please copy manually.');
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ googleSheetsWebhookUrl: webhookInput.trim() });
    setIsSavedWebhook(true);
    setTimeout(() => setIsSavedWebhook(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-black">Google Sheets Hub</h3>
              <p className="text-xs text-emerald-200">
                Export, Copy & Sync your business data with Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGoogleSheetsModalOpen(false)}
            className="w-8 h-8 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700 flex-1">
          {/* Method 1: Instant Copy to Clipboard */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-sm">
                <Copy className="w-4 h-4 text-emerald-700" />
                1-Click Direct Copy for Google Sheets
              </h4>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                Fastest & Works 100% Offline
              </span>
            </div>
            <p className="text-xs text-emerald-900">
              Click a button below, then open your Google Sheet or Excel and press <strong>Ctrl+V (Paste)</strong>. Columns, prices, and rows will align automatically!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { type: 'sales', label: 'Sales Records' },
                { type: 'inventory', label: 'Stock & Inventory' },
                { type: 'purchases', label: 'Purchases & Fare' },
                { type: 'expenses', label: 'Expenses List' },
                { type: 'pnl', label: 'Profit & Loss Statement' },
              ].map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => handleCopy(btn.type as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                    copiedType === btn.type
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-emerald-600'
                  }`}
                >
                  <span className="truncate">{btn.label}</span>
                  {copiedType === btn.type ? (
                    <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-amber-300" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0 ml-1 text-slate-400" />
                  )}
                </button>
              ))}
            </div>

            {copiedType && (
              <p className="text-xs text-emerald-800 font-bold bg-emerald-100 p-2 rounded-lg text-center animate-fade-in">
                ✓ Copied to clipboard! Go to your Google Sheet and press Paste (Ctrl+V).
              </p>
            )}
          </div>

          {/* Method 2: CSV File Download */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4 text-slate-700" />
              Download CSV Spreadsheet Files
            </h4>
            <p className="text-xs text-slate-600">
              In Google Sheets, go to <strong>File → Import → Upload</strong> and pick any of these downloaded CSV files.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => downloadCSV(`Sales_${getTodayDateString()}.csv`, generateSalesCSV(sales, settings))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800"
              >
                Sales.csv
              </button>
              <button
                onClick={() => downloadCSV(`Purchases_${getTodayDateString()}.csv`, generatePurchasesCSV(purchases, settings))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800"
              >
                Purchases.csv
              </button>
              <button
                onClick={() => downloadCSV(`Expenses_${getTodayDateString()}.csv`, generateExpensesCSV(expenses, settings))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800"
              >
                Expenses.csv
              </button>
              <button
                onClick={() => downloadCSV(`Stock_${getTodayDateString()}.csv`, generateProductsCSV(products, settings))}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-800"
              >
                Stock.csv
              </button>
            </div>
          </div>

          {/* Method 3: Automated Google Apps Script Live Sync */}
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-blue-950 flex items-center gap-1.5 text-sm">
                <Link className="w-4 h-4 text-blue-700" />
                Live Google Sheet Webhook Sync (Optional)
              </h4>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-200 px-2 py-0.5 rounded-md">
                Automatic Cloud Sync
              </span>
            </div>

            <p className="text-xs text-blue-900 leading-relaxed">
              Want sales to automatically save straight into your personal Google Sheet every time you complete a sale?
            </p>

            <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Free 2-minute Setup Guide:</span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 text-[11px] text-blue-700 hover:underline font-bold"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{copiedScript ? 'Copied Code!' : 'Copy Script Code'}</span>
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Create a blank Google Sheet.</li>
                <li>Click <strong>Extensions → Apps Script</strong>.</li>
                <li>Click "Copy Script Code" above, paste it, and click <strong>Deploy → New deployment</strong>.</li>
                <li>Set type to <strong>Web app</strong>, Who has access: <strong>Anyone</strong>.</li>
                <li>Copy the resulting Web App URL and paste below:</li>
              </ol>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 py-2 px-3 border border-blue-300 rounded-xl bg-white text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl text-xs shrink-0 active:scale-95 shadow-xs"
                >
                  {isSavedWebhook ? 'Saved!' : 'Save URL'}
                </button>
              </div>
              {settings.googleSheetsWebhookUrl && (
                <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Google Sheet Webhook is active! Future sales will sync to your spreadsheet.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={() => setIsGoogleSheetsModalOpen(false)}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
