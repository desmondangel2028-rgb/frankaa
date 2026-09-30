import React, { useState } from 'react';
import { Store, FileSpreadsheet, ShieldAlert, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { calculateInventoryMetrics } from '../utils/calculations';
import { MarginCalculatorModal } from './MarginCalculatorModal';

export const Header: React.FC = () => {
  const { settings, products, setActiveTab, setIsGoogleSheetsModalOpen } = useApp();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const inventoryMetrics = calculateInventoryMetrics(products);

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand info */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-950" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight truncate group-hover:text-amber-300 transition-colors">
              {settings.businessName}
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-200/90 truncate font-medium">
              {settings.tagline || 'Business & Stock Manager'}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Price & Margin Calculator */}
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 text-xs font-semibold border border-emerald-700 transition active:scale-95"
            title="Open Profit & Price Margin Calculator"
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          {/* Low stock alert badge */}
          {inventoryMetrics.lowStockItemsCount > 0 && (
            <button
              onClick={() => setActiveTab('stock')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600/90 text-white text-xs font-bold animate-pulse hover:bg-red-700 transition"
              title={`${inventoryMetrics.lowStockItemsCount} items low in stock!`}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">{inventoryMetrics.lowStockItemsCount} Low Stock</span>
              <span className="xs:hidden">{inventoryMetrics.lowStockItemsCount}</span>
            </button>
          )}

          {/* Google Sheets button */}
          <button
            onClick={() => setIsGoogleSheetsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold border border-emerald-700 transition active:scale-95"
            title="Export or Sync with Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="hidden md:inline">Google Sheets</span>
          </button>

          {/* Install PWA Button */}
          <PWAInstallButton compact />
        </div>
      </div>

      <MarginCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />
    </header>
  );
};
