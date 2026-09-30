import React, { useState } from 'react';
import { SalesTrendPoint } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { TrendingUp, DollarSign, Calendar, BarChart2 } from 'lucide-react';

interface SalesTrendChartProps {
  data: SalesTrendPoint[];
  currencySymbol: string;
  title?: string;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
  currencySymbol,
  title = 'Sales & Profit Performance Over Time',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-50 p-6 rounded-2xl text-center border border-slate-200 text-slate-400 text-xs">
        No sales data available for this chart period.
      </div>
    );
  }

  // Find max value for scaling
  const maxSale = Math.max(...data.map((d) => Math.max(d.sales, d.grossProfit, 100)));
  const chartHeight = 160;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-emerald-600" />
          <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
            <span>Sales Revenue</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
            <span>Gross Profit</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip banner */}
      {hoveredIndex !== null && data[hoveredIndex] ? (
        <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between animate-fade-in">
          <div>
            <span className="text-slate-400 font-medium">{data[hoveredIndex].label}</span>
            <span className="ml-2 font-bold text-slate-200">
              ({data[hoveredIndex].ordersCount} orders)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-extrabold">
              Sales: {formatCurrency(data[hoveredIndex].sales, currencySymbol)}
            </span>
            <span className="text-amber-400 font-extrabold">
              Profit: {formatCurrency(data[hoveredIndex].grossProfit, currencySymbol)}
            </span>
          </div>
        </div>
      ) : null}

      {/* SVG Bar Chart with Responsive ViewBox */}
      <div className="relative pt-2">
        <div className="h-44 flex items-end gap-1.5 sm:gap-3 px-1 border-b border-slate-200">
          {data.map((point, index) => {
            const salesHeightPercent = Math.max(4, Math.round((point.sales / maxSale) * 100));
            const profitHeightPercent = Math.max(2, Math.round((Math.max(0, point.grossProfit) / maxSale) * 100));
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={point.rawDate || index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(isHovered ? null : index)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
              >
                {/* Bar cluster */}
                <div className="w-full flex items-end justify-center gap-0.5 max-w-[36px]">
                  {/* Sales bar */}
                  <div
                    style={{ height: `${salesHeightPercent}%` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      isHovered ? 'bg-emerald-500 scale-105' : 'bg-emerald-700'
                    }`}
                  />
                  {/* Profit bar */}
                  <div
                    style={{ height: `${profitHeightPercent}%` }}
                    className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                      isHovered ? 'bg-amber-300 scale-105' : 'bg-amber-400'
                    }`}
                  />
                </div>

                {/* X Axis Label */}
                <span className={`text-[10px] sm:text-[11px] font-bold mt-2 truncate w-full text-center transition-colors ${
                  isHovered ? 'text-emerald-700' : 'text-slate-500'
                }`}>
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface MarginBreakdownProps {
  salesAmount: number;
  cogsAmount: number;
  grossProfit: number;
  expensesAmount: number;
  netProfit: number;
  currencySymbol: string;
}

export const MarginBreakdownBar: React.FC<MarginBreakdownProps> = ({
  salesAmount,
  cogsAmount,
  grossProfit,
  expensesAmount,
  netProfit,
  currencySymbol,
}) => {
  if (salesAmount <= 0) return null;

  const cogsPercent = Math.min(100, Math.round((cogsAmount / salesAmount) * 100));
  const expensesPercent = Math.min(100, Math.round((expensesAmount / salesAmount) * 100));
  const netMarginPercent = Math.round((netProfit / salesAmount) * 100);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
          Financial Margin Distribution
        </h4>
        <span className="text-xs font-bold text-slate-600">
          Total Sales: {formatCurrency(salesAmount, currencySymbol)}
        </span>
      </div>

      {/* Multi-segment distribution progress bar */}
      <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 p-0.5 border border-slate-200">
        {/* COGS Segment */}
        <div
          style={{ width: `${Math.max(5, cogsPercent)}%` }}
          className="bg-blue-600 h-full rounded-l-lg transition-all text-[10px] font-bold text-white flex items-center justify-center truncate px-1"
          title={`COGS: ${cogsPercent}%`}
        >
          COGS {cogsPercent}%
        </div>

        {/* Expenses Segment */}
        {expensesPercent > 0 && (
          <div
            style={{ width: `${Math.max(5, expensesPercent)}%` }}
            className="bg-rose-500 h-full transition-all text-[10px] font-bold text-white flex items-center justify-center truncate px-1"
            title={`Overhead & Lorry Fare: ${expensesPercent}%`}
          >
            Bills {expensesPercent}%
          </div>
        )}

        {/* Net Profit Segment */}
        <div
          style={{ width: `${Math.max(5, Math.max(0, netMarginPercent))}%` }}
          className={`h-full rounded-r-lg transition-all text-[10px] font-black text-slate-950 flex items-center justify-center truncate px-1 ${
            netProfit >= 0 ? 'bg-amber-400' : 'bg-red-700 text-white'
          }`}
          title={`Net Margin: ${netMarginPercent}%`}
        >
          Net {netMarginPercent}%
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
          <span className="text-blue-800 font-bold block">1. COGS (Items Cost)</span>
          <span className="font-extrabold text-blue-900">{formatCurrency(cogsAmount, currencySymbol)}</span>
        </div>
        <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
          <span className="text-rose-800 font-bold block">2. Expenses & Fares</span>
          <span className="font-extrabold text-rose-900">{formatCurrency(expensesAmount, currencySymbol)}</span>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
          <span className="text-emerald-800 font-bold block">3. Net Profit</span>
          <span className="font-extrabold text-emerald-950">{formatCurrency(netProfit, currencySymbol)}</span>
        </div>
      </div>
    </div>
  );
};
