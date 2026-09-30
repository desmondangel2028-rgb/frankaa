import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Truck,
  Receipt,
  AlertTriangle,
  Package,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  BarChart2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateMetrics,
  calculateInventoryMetrics,
  getSalesPerformanceTrends,
  formatCurrency,
  formatPercent,
} from '../utils/calculations';
import { TimeframeFilter } from '../types';
import { SalesTrendChart, MarginBreakdownBar } from './VisualCharts';

export const DashboardView: React.FC = () => {
  const {
    sales,
    expenses,
    products,
    purchases,
    settings,
    setActiveTab,
    setCurrentReceipt,
    deleteSale,
  } = useApp();

  const [timeframe, setTimeframe] = useState<TimeframeFilter>('today');

  const metrics = calculateMetrics(sales, expenses, timeframe);
  const inventoryMetrics = calculateInventoryMetrics(products);

  const trendGranularity =
    timeframe === 'year' || timeframe === 'all'
      ? 'monthly'
      : timeframe === 'month'
      ? 'weekly'
      : 'daily';

  const salesTrendData = getSalesPerformanceTrends(
    sales,
    expenses,
    trendGranularity,
    timeframe
  );

  // Timeframe labels
  const timeframeLabels: Record<TimeframeFilter, string> = {
    today: "Today's",
    yesterday: "Yesterday's",
    week: "This Week's",
    month: "This Month's",
    year: "This Year's",
    all: 'All Time',
    custom: 'Custom Period',
  };

  const periodTitle = timeframeLabels[timeframe];

  // Unpaid credit / debtors
  const unpaidSales = sales.filter((s) => s.paymentStatus === 'unpaid');
  const totalUnpaidAmount = unpaidSales.reduce((acc, s) => acc + s.totalAmount, 0);

  // Low stock products
  const lowStockProducts = products.filter(
    (p) => p.quantity <= (p.lowStockThreshold || 5)
  );

  const handleDeleteSale = (saleId: string, item: string) => {
    if (confirm(`Delete sale transaction for "${item}"? The quantity sold will be restored back to stock automatically.`)) {
      deleteSale(saleId, true);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Timeframe Selector Bar */}
      <div className="bg-white p-2 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {(['today', 'yesterday', 'week', 'month', 'year', 'all'] as TimeframeFilter[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-1 text-center ${
              timeframe === tf
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Net Profit Banner Card */}
      <div
        className={`rounded-2xl p-5 text-white shadow-md relative overflow-hidden transition-all ${
          metrics.isLoss
            ? 'bg-gradient-to-br from-rose-700 via-red-800 to-rose-950'
            : 'bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900'
        }`}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm uppercase tracking-wider font-semibold opacity-90">
              {periodTitle} Financial Health
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-xs">
              {metrics.isLoss ? (
                <>
                  <TrendingDown className="w-4 h-4 text-rose-300" />
                  <span>NET LOSS</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span>NET PROFIT</span>
                </>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatCurrency(metrics.netProfit, settings.currencySymbol)}
            </h2>
            <span className="text-xs sm:text-sm opacity-85">
              (Margin: {formatPercent(metrics.profitMarginPercent)})
            </span>
          </div>

          <p className="mt-1 text-xs opacity-80">
            Gross Profit of {formatCurrency(metrics.grossProfit, settings.currencySymbol)} minus {formatCurrency(metrics.totalExpenses, settings.currencySymbol)} operating expenses & bills.
          </p>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* 4 Essential Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Sales */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">{periodTitle} Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(metrics.totalSales, settings.currencySymbol)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{metrics.salesCount} sale transactions</span>
            <span>{metrics.quantitySold} units</span>
          </div>
        </div>

        {/* COGS (Cost of goods sold) */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Cost of Goods (COGS)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(metrics.totalCostOfGoodsSold, settings.currencySymbol)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Cost of items sold</span>
            <span className="font-semibold text-blue-700">Markup: {formatPercent(metrics.markupPercent)}</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">Gross Profit</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-2">
            {formatCurrency(metrics.grossProfit, settings.currencySymbol)}
          </p>
          <div className="mt-1 text-xs text-slate-500">
            <span>Sales minus COGS</span>
          </div>
        </div>

        {/* Expenses & Bills */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase">{periodTitle} Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-2">
            {formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>{metrics.expensesCount} bills/fares</span>
            <span>Overhead costs</span>
          </div>
        </div>
      </div>

      {/* VISUAL CHARTS & GRAPHS FOR DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <SalesTrendChart
            data={salesTrendData}
            currencySymbol={settings.currencySymbol}
            title={`${periodTitle} Sales & Profit Trend`}
          />
        </div>
        <div>
          <MarginBreakdownBar
            salesAmount={metrics.totalSales}
            cogsAmount={metrics.totalCostOfGoodsSold}
            grossProfit={metrics.grossProfit}
            expensesAmount={metrics.totalExpenses}
            netProfit={metrics.netProfit}
            currencySymbol={settings.currencySymbol}
          />
        </div>
      </div>

      {/* BIG ACTION BUTTONS - High contrast, large touch targets for old Androids & Market speed */}
      <div className="bg-emerald-950/5 border border-emerald-900/10 p-4 rounded-2xl">
        <h3 className="text-xs font-black uppercase text-emerald-900 tracking-wider mb-3">
          Quick Actions (Fast Tap)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-sm active:scale-95 transition text-center"
          >
            <ShoppingCart className="w-6 h-6 mb-1 text-slate-950" />
            <span className="text-xs sm:text-sm">+ Make a Sale</span>
            <span className="text-[10px] font-normal text-slate-800">Bargain & receipt</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black shadow-sm active:scale-95 transition text-center"
          >
            <Truck className="w-6 h-6 mb-1 text-white" />
            <span className="text-xs sm:text-sm">+ Buy Stock</span>
            <span className="text-[10px] font-normal text-emerald-100">With lorry fare</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-sm active:scale-95 transition text-center"
          >
            <Receipt className="w-6 h-6 mb-1 text-white" />
            <span className="text-xs sm:text-sm">+ Add Expense</span>
            <span className="text-[10px] font-normal text-rose-100">ECG, fare, water</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black shadow-sm active:scale-95 transition text-center"
          >
            <Package className="w-6 h-6 mb-1 text-white" />
            <span className="text-xs sm:text-sm">+ Add Product</span>
            <span className="text-[10px] font-normal text-slate-300">Set prices & unit</span>
          </button>
        </div>
      </div>

      {/* Unpaid Debtors Alert Banner */}
      {unpaidSales.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Customers Owning You (Debt Sales): {unpaidSales.length}
              </h4>
              <p className="text-xs text-amber-900 font-medium">
                Total Debt: <strong>{formatCurrency(totalUnpaidAmount, settings.currencySymbol)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shrink-0 shadow-xs"
          >
            View Debtors
          </button>
        </div>
      )}

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Low Stock Alert ({lowStockProducts.length} items need restock)
            </h4>
            <button
              onClick={() => setActiveTab('stock')}
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
            >
              Manage Stock <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {lowStockProducts.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white px-3 py-2 rounded-xl text-xs border border-rose-100"
              >
                <span className="font-semibold text-slate-800 truncate mr-2">
                  {p.name}
                </span>
                <span className="px-2 py-0.5 rounded-md font-bold text-rose-700 bg-rose-100 shrink-0">
                  {p.quantity} {p.unit} remaining
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Value & Inventory Summary Card */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            Current Inventory Worth
          </h3>
          <button
            onClick={() => setActiveTab('stock')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            View All ({inventoryMetrics.totalProductsCount})
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Stock Value at Cost</p>
            <p className="text-lg font-black text-slate-900">
              {formatCurrency(inventoryMetrics.totalCostValue, settings.currencySymbol)}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-700 font-medium">Stock Value at Retail</p>
            <p className="text-lg font-black text-emerald-800">
              {formatCurrency(inventoryMetrics.totalRetailValue, settings.currencySymbol)}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 bg-amber-50 rounded-xl">
            <p className="text-xs text-amber-800 font-medium">Potential Profit Locked</p>
            <p className="text-lg font-black text-amber-900">
              {formatCurrency(inventoryMetrics.potentialProfitAtRetail, settings.currencySymbol)}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Recent Sales Feed */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            Recent Sales Transactions
          </h3>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            All Sales ({sales.length})
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No sales recorded yet. Click "+ Make a Sale" above to start selling!
          </div>
        ) : (
          <div className="space-y-2">
            {sales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition"
              >
                <div className="min-w-0 flex-1 mr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {sale.productName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 uppercase font-bold shrink-0">
                      {sale.priceType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{sale.customerName}</span>
                    <span>•</span>
                    <span>{sale.quantity} qty</span>
                    {sale.discountPerUnit > 0 && (
                      <span className="text-amber-700 font-semibold">
                        (Bargained -{formatCurrency(sale.discountPerUnit, settings.currencySymbol)}/ea)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {formatCurrency(sale.totalAmount, settings.currencySymbol)}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600">
                      +{formatCurrency(sale.profit, settings.currencySymbol)} profit
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentReceipt(sale)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                    title="View Receipt"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSale(sale.id, sale.productName)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Sale (Restores inventory)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
