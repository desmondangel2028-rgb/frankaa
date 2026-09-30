import React, { useState } from 'react';
import {
  Settings,
  Store,
  Phone,
  MapPin,
  Coins,
  Percent,
  Download,
  Upload,
  RotateCcw,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportBackupData,
    importBackupData,
    resetToSampleData,
    clearAllData,
  } = useApp();

  const [businessName, setBusinessName] = useState(settings.businessName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [phone, setPhone] = useState(settings.phone);
  const [location, setLocation] = useState(settings.location);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode);
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate || 0);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName: businessName.trim() || 'Awurade Ne Me Franka Business Manager',
      tagline: tagline.trim(),
      phone: phone.trim(),
      location: location.trim(),
      currencySymbol: currencySymbol.trim() || 'GH₵',
      currencyCode: currencyCode.trim() || 'GHS',
      taxRate: Number(taxRate) || 0,
      receiptFooter: receiptFooter.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupData(content);
        if (success) {
          alert('✓ Data restored successfully!');
        } else {
          alert('Failed to restore data. Please make sure it is a valid backup file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('WARNING: Are you sure you want to delete ALL products, sales, purchases, and expenses? This will clear all data and give you a 100% fresh, blank store.')) {
      clearAllData();
      alert('All business records have been completely cleared. Your store is now 100% fresh and clean.');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          Settings & Data Backup
        </h2>
        <p className="text-xs text-slate-500">
          Personalize business name, phone, currency, receipt text, and backup your records
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Business Profile & Receipts
          </h3>
          {isSaved && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Business Name *
          </label>
          <input
            type="text"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Awurade Ne Me Franka Business Manager"
            className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-sm font-semibold"
          />
          <p className="text-[11px] text-slate-500 mt-0.5">
            You can customize this to your own personal shop name at any time.
          </p>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Business Tagline / Motto
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Wholesale & Retail Trading | The Lord is My Banner"
            className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Phone / MoMo Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="024 123 4567 / 055 987 6543"
              className="w-full py-2 px-3 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Shop Location / Market Address
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kejetia Market, Kumasi / Makola, Accra"
              className="w-full py-2 px-3 border border-slate-300 rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Currency Symbol
            </label>
            <input
              type="text"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-sm font-black bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Currency Code
            </label>
            <input
              type="text"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-sm font-black bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-sm font-bold bg-white"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">
            Receipt Footer Blessing / Message
          </label>
          <input
            type="text"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            placeholder="Medaase pa ara! Thank you for buying from us. God bless you!"
            className="w-full py-2 px-3 border border-slate-300 rounded-xl text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition active:scale-98 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>Save Changes</span>
        </button>
      </form>

      {/* Backup & Restore Data (100% Offline Protection) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Offline Data Safety & Backup
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your data is saved directly on your phone or computer. Create downloadable backups anytime to safeguard your store records.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export JSON */}
          <button
            onClick={exportBackupData}
            className="p-3.5 rounded-2xl border-2 border-dashed border-emerald-600 hover:bg-emerald-50/50 text-left transition flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">
                Download Backup File (.json)
              </span>
              <span className="text-[11px] text-slate-500">
                Saves all sales, stock, expenses, and settings
              </span>
            </div>
          </button>

          {/* Import JSON */}
          <label className="p-3.5 rounded-2xl border-2 border-dashed border-blue-600 hover:bg-blue-50/50 text-left transition flex items-center gap-3 cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">
                Restore from Backup File
              </span>
              <span className="text-[11px] text-slate-500">
                Upload a previously saved .json backup
              </span>
            </div>
          </label>
        </div>

        {/* Historical Price Protection Guarantee */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
          <div className="font-black flex items-center gap-1.5 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Historical Sales Price Protection Guarantee</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            If you increase a product's price today (for example, from <strong>GH₵ 3.00</strong> to <strong>GH₵ 4.00</strong>), your previous sales recorded yesterday at <strong>GH₵ 3.00</strong> will <strong>never change</strong>. All historical revenues, costs, and profits are permanently sealed at their transaction-time values.
          </p>
        </div>

        {/* Start Fresh Clean Wipe */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Want to start with a 100% clean slate?
          </span>

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 transition active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Wipe All Data (Start 100% Fresh)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
