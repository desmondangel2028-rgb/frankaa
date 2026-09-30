import React, { useState } from 'react';
import { Calculator, X, Sparkles, TrendingUp, DollarSign, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent } from '../utils/calculations';

export const MarginCalculatorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { settings } = useApp();

  const [costPrice, setCostPrice] = useState<number>(100);
  const [lorryFarePerUnit, setLorryFarePerUnit] = useState<number>(10);
  const [targetMargin, setTargetMargin] = useState<number>(25); // percentage
  const [wholesaleMargin, setWholesaleMargin] = useState<number>(15); // percentage

  if (!isOpen) return null;

  const landedCost = (Number(costPrice) || 0) + (Number(lorryFarePerUnit) || 0);

  // Recommended Retail Price to achieve target Margin: Price = LandedCost / (1 - (margin / 100))
  const marginDecimal = Math.min(0.95, (Number(targetMargin) || 0) / 100);
  const recommendedRetail = landedCost > 0 && marginDecimal < 1 ? landedCost / (1 - marginDecimal) : landedCost;
  const retailProfit = recommendedRetail - landedCost;
  const retailMarkup = landedCost > 0 ? (retailProfit / landedCost) * 100 : 0;

  // Recommended Wholesale Price:
  const wsMarginDecimal = Math.min(0.95, (Number(wholesaleMargin) || 0) / 100);
  const recommendedWholesale = landedCost > 0 && wsMarginDecimal < 1 ? landedCost / (1 - wsMarginDecimal) : landedCost;
  const wholesaleProfit = recommendedWholesale - landedCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">Profit & Price Calculator</h3>
              <p className="text-[11px] text-emerald-200">
                Calculate smart selling prices including lorry fare & desired margin %
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Item Cost Price ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full py-2 px-3 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-600" />
                <span>Lorry Fare / Unit</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={lorryFarePerUnit}
                onChange={(e) => setLorryFarePerUnit(parseFloat(e.target.value) || 0)}
                className="w-full py-2 px-3 border border-amber-300 rounded-xl font-bold text-slate-900 bg-amber-50/40"
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>True Landed Unit Cost:</span>
            <span className="text-sm font-black text-slate-950">
              {formatCurrency(landedCost, settings.currencySymbol)}
            </span>
          </div>

          {/* Margins */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Retail Target Margin %
              </label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 1)}
                  className="w-full py-2 px-3 border border-emerald-300 rounded-xl font-bold text-emerald-800"
                />
                <span className="font-black text-slate-500">%</span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Wholesale Margin %
              </label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={wholesaleMargin}
                  onChange={(e) => setWholesaleMargin(parseFloat(e.target.value) || 1)}
                  className="w-full py-2 px-3 border border-blue-300 rounded-xl font-bold text-blue-800"
                />
                <span className="font-black text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Recommended Pricing Results */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
              Recommended Selling Prices
            </span>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Recommended Retail Price:</span>
                <span className="text-[11px] text-emerald-400">Profit: +{formatCurrency(retailProfit, settings.currencySymbol)}/ea ({retailMarkup.toFixed(1)}% markup)</span>
              </div>
              <span className="text-xl font-black text-emerald-400">
                {formatCurrency(recommendedRetail, settings.currencySymbol)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Recommended Wholesale:</span>
                <span className="text-[11px] text-blue-300">Profit: +{formatCurrency(wholesaleProfit, settings.currencySymbol)}/ea</span>
              </div>
              <span className="text-lg font-black text-blue-300">
                {formatCurrency(recommendedWholesale, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
