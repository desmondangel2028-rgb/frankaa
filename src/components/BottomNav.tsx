import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Receipt,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Sell (POS)', icon: ShoppingCart, highlight: true },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Reports & P&L', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-slate-800 shadow-2xl safe-area-pb">
      <div className="max-w-4xl mx-auto px-1 sm:px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative -top-2 flex flex-col items-center justify-center py-1 px-2 group focus:outline-none"
              >
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 font-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span
                  className={`text-[11px] font-bold mt-0.5 tracking-tight ${
                    isActive ? 'text-amber-400' : 'text-emerald-300'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 py-2 sm:py-2.5 px-1 flex flex-col items-center justify-center transition-colors focus:outline-none ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
              <span className="text-[10px] sm:text-xs tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
