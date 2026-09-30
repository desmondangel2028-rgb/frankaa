/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { PosSaleView } from './components/PosSaleView';
import { StockView } from './components/StockView';
import { PurchasesView } from './components/PurchasesView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-24">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'pos' && <PosSaleView />}
      {activeTab === 'stock' && <StockView />}
      {activeTab === 'purchases' && <PurchasesView />}
      {activeTab === 'expenses' && <ExpensesView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* Global Modals */}
      <ReceiptModal />
      <GoogleSheetsModal />
      <OfflineIndicator />
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col">
        <Header />
        <div className="flex-1">
          <MainContent />
        </div>
        <BottomNav />
      </div>
    </AppProvider>
  );
}
