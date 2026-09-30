import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Award,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Eye,
  Filter,
  Users,
  Repeat,
  Printer,
  Trash2,
  Search,
  ChevronRight,
  ArrowUpDown,
  Smartphone,
  Check,
  Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TimeframeFilter, DateRange, Sale } from '../types';
import {
  calculateMetrics,
  calculateInventoryMetrics,
  getBestSellingProducts,
  getSalesPerformanceTrends,
  getCustomerPurchaseHistory,
  getInventoryTurnoverReport,
  formatCurrency,
  formatPercent,
  getTodayDateString,
  isInTimeframe,
} from '../utils/calculations';
import {
  downloadCSV,
  generateSalesCSV,
  generatePurchasesCSV,
  generateExpensesCSV,
  generateProductsCSV,
  generateProfitLossCSV,
  generateBestSellersCSV,
  generateTrendsCSV,
  generateCustomerHistoryCSV,
  generateInventoryTurnoverCSV,
} from '../utils/googleSheetsExport';
import { SalesTrendChart, MarginBreakdownBar } from './VisualCharts';

type ReportTab = 'pnl' | 'best-sellers' | 'trends' | 'customers' | 'turnover' | 'transactions';

export const ReportsView: React.FC = () => {
  const {
    sales,
    purchases,
    expenses,
    products,
    settings,
    toggleSalePaymentStatus,
    setCurrentReceipt,
    deleteSale,
    setIsGoogleSheetsModalOpen,
  } = useApp();

  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('pnl');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: getTodayDateString(),
    endDate: getTodayDateString(),
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Best sellers sub-sort
  const [bestSellerSort, setBestSellerSort] = useState<'revenue' | 'quantity' | 'profit'>('revenue');

  // Trend grouping
  const [trendGrouping, setTrendGrouping] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Customer search & selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);

  // Transactions search
  const [transactionSearch, setTransactionSearch] = useState('');

  // Financial calculations
  const metrics = calculateMetrics(
    sales,
    expenses,
    timeframe,
    timeframe === 'custom' ? customRange.startDate : undefined,
    timeframe === 'custom' ? customRange.endDate : undefined
  );

  const inventoryMetrics = calculateInventoryMetrics(products);

  // Best Sellers Report
  const bestSellers = useMemo(() => {
    return getBestSellingProducts(
      sales,
      products,
      bestSellerSort,
      30,
      timeframe,
      timeframe === 'custom' ? customRange.startDate : undefined,
      timeframe === 'custom' ? customRange.endDate : undefined
    );
  }, [sales, products, bestSellerSort, timeframe, customRange]);

  // Performance Trends Over Time
  const trendData = useMemo(() => {
    return getSalesPerformanceTrends(
      sales,
      expenses,
      trendGrouping,
      timeframe,
      timeframe === 'custom' ? customRange.startDate : undefined,
      timeframe === 'custom' ? customRange.endDate : undefined
    );
  }, [sales, expenses, trendGrouping, timeframe, customRange]);

  // Expenses breakdown by category for current timeframe
  const expensesByCategory = useMemo(() => {
    const filtered = expenses.filter((e) =>
      isInTimeframe(
        e.date,
        timeframe,
        timeframe === 'custom' ? customRange.startDate : undefined,
        timeframe === 'custom' ? customRange.endDate : undefined
      )
    );

    const map = new Map<string, { total: number; count: number }>();
    filtered.forEach((e) => {
      const cat = e.category?.trim() || 'Other Operating Expenses';
      const existing = map.get(cat) || { total: 0, count: 0 };
      map.set(cat, { total: existing.total + (e.amount || 0), count: existing.count + 1 });
    });

    const list = Array.from(map.entries()).map(([cat, data]) => ({
      category: cat,
      total: data.total,
      count: data.count,
      percentOfExpenses: metrics.totalExpenses > 0 ? (data.total / metrics.totalExpenses) * 100 : 0,
    }));

    list.sort((a, b) => b.total - a.total);
    return list;
  }, [expenses, timeframe, customRange, metrics.totalExpenses]);

  // Customer Purchase History
  const customerHistoryList = useMemo(() => {
    const list = getCustomerPurchaseHistory(
      sales,
      timeframe,
      timeframe === 'custom' ? customRange.startDate : undefined,
      timeframe === 'custom' ? customRange.endDate : undefined
    );
    if (!customerSearch.trim()) return list;
    return list.filter(
      (c) =>
        c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.customerPhone && c.customerPhone.includes(customerSearch))
    );
  }, [sales, timeframe, customRange, customerSearch]);

  // Selected customer object
  const activeCustomer = useMemo(() => {
    if (!selectedCustomerName) return null;
    return customerHistoryList.find(
      (c) => c.customerName.toLowerCase() === selectedCustomerName.toLowerCase()
    );
  }, [customerHistoryList, selectedCustomerName]);

  // Inventory Turnover Rate
  const turnoverStats = useMemo(() => {
    return getInventoryTurnoverReport(
      products,
      sales,
      timeframe,
      timeframe === 'custom' ? customRange.startDate : undefined,
      timeframe === 'custom' ? customRange.endDate : undefined
    );
  }, [products, sales, timeframe, customRange]);

  // Filtered transactions
  const filteredSalesTransactions = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.customerName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        s.productName.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        s.receiptNumber.toLowerCase().includes(transactionSearch.toLowerCase());
      return matchSearch;
    });
  }, [sales, transactionSearch]);

  // CSV Export for the currently active tab
  const handleExportActiveTabCSV = () => {
    const today = getTodayDateString();
    switch (activeReportTab) {
      case 'pnl':
        downloadCSV(`Profit_Loss_Statement_${today}.csv`, generateProfitLossCSV(sales, expenses, settings));
        break;
      case 'best-sellers':
        downloadCSV(`Best_Sellers_${bestSellerSort}_${today}.csv`, generateBestSellersCSV(bestSellers, settings));
        break;
      case 'trends':
        downloadCSV(`Sales_Trends_${trendGrouping}_${today}.csv`, generateTrendsCSV(trendData, settings));
        break;
      case 'customers':
        downloadCSV(`Customer_Purchase_History_${today}.csv`, generateCustomerHistoryCSV(customerHistoryList, settings));
        break;
      case 'turnover':
        downloadCSV(`Inventory_Turnover_Rate_${today}.csv`, generateInventoryTurnoverCSV(turnoverStats, settings));
        break;
      case 'transactions':
        downloadCSV(`All_Sales_Transactions_${today}.csv`, generateSalesCSV(sales, settings));
        break;
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDeleteSale = (saleId: string, item: string) => {
    if (confirm(`Delete sale transaction for "${item}"? The quantity will be automatically restored to your stock.`)) {
      deleteSale(saleId, true);
    }
  };

  return (
    <div className="space-y-4 pb-16 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 print:hidden">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Advanced Business Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Best sellers, sales trends, customer history, inventory turnover, and export to CSV or PDF
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportActiveTabCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
            title="Download CSV for current report"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={() => setIsGoogleSheetsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sheets Hub</span>
          </button>
        </div>
      </div>

      {/* REPORT SUB-TABS NAVIGATION (Horizontal scroll for mobile / old Android) */}
      <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar print:hidden">
        {[
          { id: 'pnl', label: 'P&L Statement', icon: DollarSign },
          { id: 'best-sellers', label: 'Best-Sellers', icon: Award },
          { id: 'trends', label: 'Trends Over Time', icon: TrendingUp },
          { id: 'customers', label: 'Customer History', icon: Users },
          { id: 'turnover', label: 'Stock Turnover', icon: Repeat },
          { id: 'transactions', label: 'All Sales Log', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as ReportTab)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-1 justify-center ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* DATE FILTER CONTROLS */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 space-y-2 print:hidden">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(['today', 'yesterday', 'week', 'month', 'year', 'all'] as TimeframeFilter[]).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setShowCustomPicker(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition capitalize ${
                timeframe === tf && !showCustomPicker
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}

          <button
            onClick={() => {
              setTimeframe('custom');
              setShowCustomPicker(!showCustomPicker);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              timeframe === 'custom' || showCustomPicker
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Custom Dates</span>
          </button>
        </div>

        {showCustomPicker && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="py-1 px-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-600">To:</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="py-1 px-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <button
              onClick={() => setTimeframe('custom')}
              className="px-3 py-1 bg-emerald-700 text-white font-bold rounded-lg text-xs"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: PROFIT & LOSS STATEMENT (P&L)
          ========================================================================= */}
      {activeReportTab === 'pnl' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Profit & Loss Statement (P&L)
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {settings.businessName} • Period: {timeframe.toUpperCase()}{' '}
                  {timeframe === 'custom' && `(${customRange.startDate} to ${customRange.endDate})`}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">Total Sales Revenue</span>
                  <span className="text-xs text-slate-500">{metrics.salesCount} sales • {metrics.quantitySold} items sold</span>
                </div>
                <span className="text-base font-black text-slate-900">
                  {formatCurrency(metrics.totalSales, settings.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">Cost of Goods Sold (COGS)</span>
                  <span className="text-xs text-slate-500">Unit base inventory costs captured at sale</span>
                </div>
                <span className="text-base font-black text-rose-700">
                  -{formatCurrency(metrics.totalCostOfGoodsSold, settings.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div>
                  <span className="font-extrabold text-emerald-950 block">GROSS PROFIT</span>
                  <span className="text-xs text-emerald-800 font-medium">Markup: {formatPercent(metrics.markupPercent)}</span>
                </div>
                <span className="text-lg font-black text-emerald-800">
                  {formatCurrency(metrics.grossProfit, settings.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">Operating Overhead & Bills</span>
                  <span className="text-xs text-slate-500">Lorry fare, ECG, water, rent, internet, salaries</span>
                </div>
                <span className="text-base font-black text-rose-700">
                  -{formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
                </span>
              </div>

              <div
                className={`p-4 rounded-2xl flex items-center justify-between text-white shadow-md ${
                  metrics.isLoss
                    ? 'bg-gradient-to-r from-rose-700 to-red-800'
                    : 'bg-gradient-to-r from-emerald-800 to-teal-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-wider opacity-90">
                    {metrics.isLoss ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    <span>{metrics.isLoss ? 'NET LOSS FOR PERIOD' : 'NET PROFIT FOR PERIOD'}</span>
                  </div>
                  <span className="text-xs opacity-80 mt-0.5 block">
                    Profit Margin: {formatPercent(metrics.profitMarginPercent)}
                  </span>
                </div>

                <span className="text-2xl sm:text-3xl font-black tracking-tight">
                  {formatCurrency(metrics.netProfit, settings.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          <MarginBreakdownBar
            salesAmount={metrics.totalSales}
            cogsAmount={metrics.totalCostOfGoodsSold}
            grossProfit={metrics.grossProfit}
            expensesAmount={metrics.totalExpenses}
            netProfit={metrics.netProfit}
            currencySymbol={settings.currencySymbol}
          />

          {/* Granular Operating Expenses Breakdown by Category */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <span>Granular Expenses Breakdown by Category</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Exact distribution of overhead costs for {timeframe.toUpperCase()}{' '}
                  {timeframe === 'custom' && `(${customRange.startDate} to ${customRange.endDate})`}
                </p>
              </div>
              <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                Total Bills: -{formatCurrency(metrics.totalExpenses, settings.currencySymbol)}
              </span>
            </div>

            {expensesByCategory.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No operating expenses recorded for this timeframe.
              </div>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <div className="flex items-center gap-1.5 truncate mr-2">
                        <span className="truncate">{item.category}</span>
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                          ({item.count} {item.count === 1 ? 'bill' : 'bills'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-rose-700 font-black">
                          -{formatCurrency(item.total, settings.currencySymbol)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-extrabold w-12 text-right">
                          {formatPercent(item.percentOfExpenses)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(3, item.percentOfExpenses))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BEST-SELLING PRODUCTS (By Quantity & Revenue)
          ========================================================================= */}
      {activeReportTab === 'best-sellers' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Best-Selling Products Report
              </h3>
              <p className="text-xs text-slate-500">
                Identify your top products by revenue generated, quantity sold, or profit margin
              </p>
            </div>

            {/* Sub-Sort Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setBestSellerSort('revenue')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  bestSellerSort === 'revenue'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Revenue
              </button>
              <button
                onClick={() => setBestSellerSort('quantity')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  bestSellerSort === 'quantity'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Quantity Sold
              </button>
              <button
                onClick={() => setBestSellerSort('profit')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  bestSellerSort === 'profit'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Profit
              </button>
            </div>
          </div>

          {bestSellers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No sales recorded for this timeframe.
            </div>
          ) : (
            <div className="space-y-2">
              {bestSellers.map((item, index) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        index === 0
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                          : index === 1
                          ? 'bg-slate-300 text-slate-900'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {item.revenueSharePercent.toFixed(1)}% of total sales
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <strong className="text-slate-900 font-bold">{item.totalQuantity} units</strong> sold
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 block">
                      {formatCurrency(item.totalRevenue, settings.currencySymbol)}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 block">
                      +{formatCurrency(item.totalProfit, settings.currencySymbol)} profit
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Margin: {item.profitMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: SALES PERFORMANCE OVER TIME (Daily, Weekly, Monthly, Yearly)
          ========================================================================= */}
      {activeReportTab === 'trends' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Sales Performance Over Time
                </h3>
                <p className="text-xs text-slate-500">
                  Compare sales revenue, COGS, and profit across daily, weekly, monthly, and yearly cycles
                </p>
              </div>

              {/* Grouping switch */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setTrendGrouping(grp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition capitalize ${
                      trendGrouping === grp
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Trend Chart */}
            <SalesTrendChart
              data={trendData}
              currencySymbol={settings.currencySymbol}
              title={`Sales & Profit Trend (${trendGrouping.toUpperCase()})`}
            />

            {/* Data Comparison Table */}
            <div className="overflow-x-auto no-scrollbar pt-2">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Transactions</th>
                    <th className="py-2.5 px-3">Revenue</th>
                    <th className="py-2.5 px-3">COGS</th>
                    <th className="py-2.5 px-3">Gross Profit</th>
                    <th className="py-2.5 px-3">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trendData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No transactions recorded for this period.
                      </td>
                    </tr>
                  ) : (
                    trendData.map((row) => (
                      <tr key={row.rawDate} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{row.label}</td>
                        <td className="py-2.5 px-3 text-slate-600">{row.ordersCount} sales</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{formatCurrency(row.sales, settings.currencySymbol)}</td>
                        <td className="py-2.5 px-3 text-rose-700">-{formatCurrency(row.cogs, settings.currencySymbol)}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">{formatCurrency(row.grossProfit, settings.currencySymbol)}</td>
                        <td className={`py-2.5 px-3 font-black ${row.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                          {formatCurrency(row.netProfit, settings.currencySymbol)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: CUSTOMER PURCHASE HISTORY & DEBT LEDGER
          ========================================================================= */}
      {activeReportTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Customer Purchase History & Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Track individual customer spending, order frequency, and outstanding credit/debts
                </p>
              </div>

              {/* Search customer */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer name or phone..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Customer List */}
            {customerHistoryList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No customer purchase history found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customerHistoryList.map((customer) => {
                  const hasDebt = customer.totalDebt > 0;
                  const isSelected = selectedCustomerName === customer.customerName;

                  return (
                    <div
                      key={customer.customerName}
                      onClick={() =>
                        setSelectedCustomerName(
                          isSelected ? null : customer.customerName
                        )
                      }
                      className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : hasDebt
                          ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
                          : 'border-slate-200/90 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {customer.customerName}
                          </h4>
                          {customer.customerPhone && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              <span>{customer.customerPhone}</span>
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            {customer.ordersCount} total orders • Last: {customer.lastPurchaseDate}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 block">
                            {formatCurrency(customer.totalSpent, settings.currencySymbol)}
                          </span>
                          {hasDebt && (
                            <span className="text-[11px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                              Owes: {formatCurrency(customer.totalDebt, settings.currencySymbol)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                        <span>{isSelected ? 'Hide Transaction List' : 'View Full Transaction List'}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* EXPANDED CUSTOMER STATEMENT MODAL / DRAWER */}
            {activeCustomer && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Statement of Purchases for: {activeCustomer.customerName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {activeCustomer.ordersCount} orders • Total Spent: {formatCurrency(activeCustomer.totalSpent, settings.currencySymbol)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomerName(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {activeCustomer.sales.map((sale: Sale) => (
                    <div
                      key={sale.id}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{sale.productName}</span>
                          <span className="text-[10px] text-slate-500">({sale.receiptNumber})</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {sale.date} {sale.time} • {sale.quantity} units @ {formatCurrency(sale.bargainUnitPrice, settings.currencySymbol)}
                          {sale.discountPerUnit > 0 && ` (Negotiated -${formatCurrency(sale.discountPerUnit, settings.currencySymbol)}/ea)`}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {formatCurrency(sale.totalAmount, settings.currencySymbol)}
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${sale.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {sale.paymentStatus}
                          </span>
                        </div>
                        <button
                          onClick={() => setCurrentReceipt(sale)}
                          className="p-1 text-slate-400 hover:text-emerald-700 rounded"
                          title="View Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.id, sale.productName)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: INVENTORY TURNOVER RATE & VELOCITY REPORT
          ========================================================================= */}
      {activeReportTab === 'turnover' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-600" />
                Inventory Turnover Rate & Stock Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Measures how quickly your stock sells out vs sitting on shelves (Dead stock prevention)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">In Stock</th>
                  <th className="py-2.5 px-3">Units Sold</th>
                  <th className="py-2.5 px-3">COGS Sold</th>
                  <th className="py-2.5 px-3">Turnover Ratio</th>
                  <th className="py-2.5 px-3">Days to Clear (DSI)</th>
                  <th className="py-2.5 px-3">Velocity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {turnoverStats.map((item) => {
                  const isFast = item.velocity === 'Fast Moving';
                  const isStagnant = item.velocity === 'Stagnant / Dead Stock';

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-slate-900 block truncate max-w-xs">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.category}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {item.quantitySold}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {formatCurrency(item.cogsSold, settings.currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 font-black text-slate-900">
                        {item.turnoverRatio}x
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {item.daysOfInventory >= 999 ? 'Over 1 Year' : `${item.daysOfInventory} days`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block whitespace-nowrap ${
                            isFast
                              ? 'bg-emerald-100 text-emerald-800'
                              : isStagnant
                              ? 'bg-rose-100 text-rose-800'
                              : item.velocity === 'Slow Moving'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {item.velocity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: ALL SALES TRANSACTIONS LOG (With Delete option)
          ========================================================================= */}
      {activeReportTab === 'transactions' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Complete Sales Transactions Log
              </h3>
              <p className="text-xs text-slate-500">
                View receipts, payment statuses, or delete accidental sales (restores inventory)
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                placeholder="Search receipt, item, customer..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredSalesTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No sales transactions found.
              </div>
            ) : (
              filteredSalesTransactions.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{sale.receiptNumber}</span>
                      <span className="text-[10px] text-slate-500">{sale.date} {sale.time}</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {sale.priceType}
                      </span>
                      {sale.isNegotiatedPrice && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                          Negotiated
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                      {sale.productName} (×{sale.quantity})
                    </h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Customer: <strong>{sale.customerName}</strong></span>
                      <span>•</span>
                      <span>Price: {formatCurrency(sale.bargainUnitPrice, settings.currencySymbol)}</span>
                      {sale.discountPerUnit > 0 && (
                        <span className="text-amber-700 font-semibold">
                          (Saved {formatCurrency(sale.discountPerUnit, settings.currencySymbol)}/ea)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">
                        {formatCurrency(sale.totalAmount, settings.currencySymbol)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        +{formatCurrency(sale.profit, settings.currencySymbol)} profit
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${sale.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {sale.paymentStatus}
                      </span>
                    </div>

                    <button
                      onClick={() => setCurrentReceipt(sale)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="View Receipt"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteSale(sale.id, sale.productName)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Sale (Restores inventory)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
