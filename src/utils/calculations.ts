import {
  Product,
  Sale,
  Expense,
  Purchase,
  TimeframeFilter,
  BestSellerStat,
  SalesTrendPoint,
  CustomerHistorySummary,
  InventoryTurnoverStat,
} from '../types';

/**
 * Format currency with Ghanaian Cedi default (GH₵)
 */
export function formatCurrency(amount: number, symbol: string = 'GH₵'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = absVal.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${symbol} ${formatted}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Get current date in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Date filtering check for sales / expenses / purchases
 */
export function isInTimeframe(
  dateStr: string,
  timeframe: TimeframeFilter,
  customStart?: string,
  customEnd?: string
): boolean {
  if (!dateStr) return false;
  if (timeframe === 'all') return true;

  const itemDate = new Date(dateStr.slice(0, 10) + 'T00:00:00');
  const now = new Date();
  const todayStr = getTodayDateString();
  const today = new Date(todayStr + 'T00:00:00');

  switch (timeframe) {
    case 'today':
      return dateStr.slice(0, 10) === todayStr;

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);
      return dateStr.slice(0, 10) === yStr;
    }

    case 'week': {
      // Start of week (Monday)
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);
      return itemDate >= monday && itemDate <= now;
    }

    case 'month': {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      );
    }

    case 'year': {
      return itemDate.getFullYear() === now.getFullYear();
    }

    case 'custom': {
      if (!customStart && !customEnd) return true;
      if (customStart && customEnd) {
        return dateStr.slice(0, 10) >= customStart && dateStr.slice(0, 10) <= customEnd;
      }
      if (customStart) {
        return dateStr.slice(0, 10) >= customStart;
      }
      if (customEnd) {
        return dateStr.slice(0, 10) <= customEnd;
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Financial metrics calculation
 */
export interface FinancialMetrics {
  totalSales: number;
  totalCostOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  isLoss: boolean;
  profitMarginPercent: number; // (Net Profit / Sales) * 100
  markupPercent: number;       // (Gross Profit / COGS) * 100
  salesCount: number;
  quantitySold: number;
  expensesCount: number;
}

export function calculateMetrics(
  sales: Sale[],
  expenses: Expense[],
  timeframe: TimeframeFilter = 'all',
  customStart?: string,
  customEnd?: string
): FinancialMetrics {
  const filteredSales = sales.filter((s) =>
    isInTimeframe(s.date, timeframe, customStart, customEnd)
  );
  const filteredExpenses = expenses.filter((e) =>
    isInTimeframe(e.date, timeframe, customStart, customEnd)
  );

  let totalSales = 0;
  let totalCostOfGoodsSold = 0;
  let quantitySold = 0;

  for (const s of filteredSales) {
    totalSales += s.totalAmount || 0;
    // COGS = quantity * unitCostPrice
    totalCostOfGoodsSold += (s.totalCost || (s.quantity * (s.unitCostPrice || 0)));
    quantitySold += s.quantity || 0;
  }

  let totalExpenses = 0;
  for (const e of filteredExpenses) {
    totalExpenses += e.amount || 0;
  }

  const grossProfit = totalSales - totalCostOfGoodsSold;
  const netProfit = grossProfit - totalExpenses;
  const isLoss = netProfit < 0;

  const profitMarginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
  const markupPercent =
    totalCostOfGoodsSold > 0 ? (grossProfit / totalCostOfGoodsSold) * 100 : 0;

  return {
    totalSales,
    totalCostOfGoodsSold,
    grossProfit,
    totalExpenses,
    netProfit,
    isLoss,
    profitMarginPercent,
    markupPercent,
    salesCount: filteredSales.length,
    quantitySold,
    expensesCount: filteredExpenses.length,
  };
}

/**
 * Inventory & Stock Value calculations
 */
export interface InventoryMetrics {
  totalItemsInStock: number;
  totalProductsCount: number;
  totalCostValue: number;      // Stock value at cost
  totalRetailValue: number;    // Stock value at retail
  totalWholesaleValue: number; // Stock value at wholesale
  potentialProfitAtRetail: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
}

export function calculateInventoryMetrics(products: Product[]): InventoryMetrics {
  let totalItemsInStock = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let totalWholesaleValue = 0;
  let lowStockItemsCount = 0;
  let outOfStockItemsCount = 0;

  for (const p of products) {
    const qty = p.quantity || 0;
    totalItemsInStock += qty;
    totalCostValue += qty * (p.costPrice || 0);
    totalRetailValue += qty * (p.retailPrice || 0);
    totalWholesaleValue += qty * (p.wholesalePrice || 0);

    if (qty <= 0) {
      outOfStockItemsCount++;
    } else if (qty <= (p.lowStockThreshold || 5)) {
      lowStockItemsCount++;
    }
  }

  return {
    totalItemsInStock,
    totalProductsCount: products.length,
    totalCostValue,
    totalRetailValue,
    totalWholesaleValue,
    potentialProfitAtRetail: totalRetailValue - totalCostValue,
    lowStockItemsCount,
    outOfStockItemsCount,
  };
}

/**
 * Purchases metrics
 */
export interface PurchasesMetrics {
  totalPurchasesCost: number;
  totalLorryFare: number;
  totalOtherCosts: number;
  totalLandedCost: number;
  itemsPurchasedCount: number;
}

export function calculatePurchasesMetrics(
  purchases: Purchase[],
  timeframe: TimeframeFilter = 'all',
  customStart?: string,
  customEnd?: string
): PurchasesMetrics {
  const filtered = purchases.filter((p) =>
    isInTimeframe(p.date, timeframe, customStart, customEnd)
  );

  let totalPurchasesCost = 0;
  let totalLorryFare = 0;
  let totalOtherCosts = 0;
  let totalLandedCost = 0;
  let itemsPurchasedCount = 0;

  for (const p of filtered) {
    const baseCost = (p.quantity || 0) * (p.costPrice || 0);
    totalPurchasesCost += baseCost;
    totalLorryFare += p.lorryFare || 0;
    totalOtherCosts += p.otherCosts || 0;
    totalLandedCost += p.totalLandedCost || (baseCost + (p.lorryFare || 0) + (p.otherCosts || 0));
    itemsPurchasedCount += p.quantity || 0;
  }

  return {
    totalPurchasesCost,
    totalLorryFare,
    totalOtherCosts,
    totalLandedCost,
    itemsPurchasedCount,
  };
}

/**
 * Aggregate best selling products with ranking options
 */
export function getBestSellingProducts(
  sales: Sale[],
  products: Product[] = [],
  sortBy: 'revenue' | 'quantity' | 'profit' = 'revenue',
  limit: number = 20,
  timeframe: TimeframeFilter = 'all',
  customStart?: string,
  customEnd?: string
): BestSellerStat[] {
  const filtered = sales.filter((s) =>
    isInTimeframe(s.date, timeframe, customStart, customEnd)
  );

  const productMap = new Map<string, BestSellerStat>();
  let grandTotalRevenue = 0;

  for (const s of filtered) {
    grandTotalRevenue += s.totalAmount || 0;
    const prod = products.find((p) => p.id === s.productId);

    const existing = productMap.get(s.productId) || {
      productId: s.productId,
      productName: s.productName,
      category: prod?.category || 'General',
      totalQuantity: 0,
      totalRevenue: 0,
      totalProfit: 0,
      profitMarginPercent: 0,
      revenueSharePercent: 0,
    };

    existing.totalQuantity += s.quantity || 0;
    existing.totalRevenue += s.totalAmount || 0;
    existing.totalProfit += s.profit || 0;

    productMap.set(s.productId, existing);
  }

  const list = Array.from(productMap.values()).map((item) => ({
    ...item,
    profitMarginPercent:
      item.totalRevenue > 0 ? (item.totalProfit / item.totalRevenue) * 100 : 0,
    revenueSharePercent:
      grandTotalRevenue > 0 ? (item.totalRevenue / grandTotalRevenue) * 100 : 0,
  }));

  list.sort((a, b) => {
    if (sortBy === 'quantity') return b.totalQuantity - a.totalQuantity;
    if (sortBy === 'profit') return b.totalProfit - a.totalProfit;
    return b.totalRevenue - a.totalRevenue;
  });

  return list.slice(0, limit);
}

/**
 * Sales Performance Over Time (Daily, Weekly, Monthly, Yearly trends)
 */
export function getSalesPerformanceTrends(
  sales: Sale[],
  expenses: Expense[],
  groupBy: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
  timeframe: TimeframeFilter = 'month',
  customStart?: string,
  customEnd?: string
): SalesTrendPoint[] {
  const filteredSales = sales.filter((s) =>
    isInTimeframe(s.date, timeframe, customStart, customEnd)
  );
  const filteredExpenses = expenses.filter((e) =>
    isInTimeframe(e.date, timeframe, customStart, customEnd)
  );

  const groupMap = new Map<
    string,
    { label: string; rawDate: string; sales: number; cogs: number; grossProfit: number; expenses: number; ordersCount: number }
  >();

  // Helper for grouping keys
  const getKey = (dateStr: string) => {
    const d = new Date(dateStr.slice(0, 10) + 'T00:00:00');
    if (groupBy === 'daily') {
      const short = d.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' });
      return { key: dateStr.slice(0, 10), label: short, rawDate: dateStr.slice(0, 10) };
    }
    if (groupBy === 'weekly') {
      const day = d.getDay();
      const diff = (day + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - diff);
      const key = monday.toISOString().slice(0, 10);
      const label = `Wk ${monday.toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}`;
      return { key, label, rawDate: key };
    }
    if (groupBy === 'monthly') {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-GH', { month: 'short', year: '2-digit' });
      return { key, label, rawDate: key };
    }
    // yearly
    const key = `${d.getFullYear()}`;
    return { key, label: key, rawDate: key };
  };

  // Accumulate sales
  for (const s of filteredSales) {
    const { key, label, rawDate } = getKey(s.date);
    const item = groupMap.get(key) || {
      label,
      rawDate,
      sales: 0,
      cogs: 0,
      grossProfit: 0,
      expenses: 0,
      ordersCount: 0,
    };

    item.sales += s.totalAmount || 0;
    const cogs = s.totalCost || (s.quantity * (s.unitCostPrice || 0));
    item.cogs += cogs;
    item.grossProfit += (s.profit || (s.totalAmount - cogs));
    item.ordersCount += 1;

    groupMap.set(key, item);
  }

  // Accumulate expenses
  for (const e of filteredExpenses) {
    const { key, label, rawDate } = getKey(e.date);
    const item = groupMap.get(key) || {
      label,
      rawDate,
      sales: 0,
      cogs: 0,
      grossProfit: 0,
      expenses: 0,
      ordersCount: 0,
    };
    item.expenses += e.amount || 0;
    groupMap.set(key, item);
  }

  const sortedPoints = Array.from(groupMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, v]) => ({
      label: v.label,
      rawDate: v.rawDate,
      sales: v.sales,
      cogs: v.cogs,
      grossProfit: v.grossProfit,
      netProfit: v.grossProfit - v.expenses,
      ordersCount: v.ordersCount,
    }));

  return sortedPoints;
}

/**
 * Customer Purchase History and Balances
 */
export function getCustomerPurchaseHistory(
  sales: Sale[],
  timeframe: TimeframeFilter = 'all',
  customStart?: string,
  customEnd?: string
): CustomerHistorySummary[] {
  const filtered = sales.filter((s) =>
    isInTimeframe(s.date, timeframe, customStart, customEnd)
  );

  const customerMap = new Map<string, CustomerHistorySummary>();

  for (const s of filtered) {
    const name = s.customerName.trim() || 'Walk-in Customer';
    const key = name.toLowerCase();

    const existing = customerMap.get(key) || {
      customerName: name,
      customerPhone: s.customerPhone,
      totalSpent: 0,
      totalProfit: 0,
      ordersCount: 0,
      lastPurchaseDate: s.date,
      totalDebt: 0,
      sales: [],
    };

    if (!existing.customerPhone && s.customerPhone) {
      existing.customerPhone = s.customerPhone;
    }

    existing.totalSpent += s.totalAmount || 0;
    existing.totalProfit += s.profit || 0;
    existing.ordersCount += 1;
    if (s.date > existing.lastPurchaseDate) {
      existing.lastPurchaseDate = s.date;
    }
    if (s.paymentStatus === 'unpaid' || s.paymentMethod === 'debt') {
      existing.totalDebt += s.totalAmount || 0;
    }

    existing.sales.push(s);
    customerMap.set(key, existing);
  }

  return Array.from(customerMap.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );
}

/**
 * Inventory Turnover Rate & Stock Velocity
 */
export function getInventoryTurnoverReport(
  products: Product[],
  sales: Sale[],
  timeframe: TimeframeFilter = 'all',
  customStart?: string,
  customEnd?: string
): InventoryTurnoverStat[] {
  const filteredSales = sales.filter((s) =>
    isInTimeframe(s.date, timeframe, customStart, customEnd)
  );

  // Group sales by productId
  const salesByProduct = new Map<string, { qty: number; cogs: number; rev: number }>();
  for (const s of filteredSales) {
    const existing = salesByProduct.get(s.productId) || { qty: 0, cogs: 0, rev: 0 };
    existing.qty += s.quantity || 0;
    existing.cogs += s.totalCost || (s.quantity * (s.unitCostPrice || 0));
    existing.rev += s.totalAmount || 0;
    salesByProduct.set(s.productId, existing);
  }

  return products.map((p) => {
    const saleInfo = salesByProduct.get(p.id) || { qty: 0, cogs: 0, rev: 0 };
    const stockValueAtCost = (p.quantity || 0) * (p.costPrice || 0);

    // Turnover ratio = COGS Sold / Average Stock Value
    // If stockValueAtCost is 0 and we sold items, turnover is high; if both 0, 0
    let turnoverRatio = 0;
    if (stockValueAtCost > 0) {
      turnoverRatio = saleInfo.cogs / stockValueAtCost;
    } else if (saleInfo.cogs > 0) {
      turnoverRatio = 99; // Cleared out entirely
    }

    // Days to sell inventory (365 / turnover or based on run-rate)
    let daysOfInventory = 0;
    if (turnoverRatio > 0) {
      daysOfInventory = Math.round(365 / turnoverRatio);
      if (daysOfInventory > 999) daysOfInventory = 999;
    } else {
      daysOfInventory = 999; // Stagnant
    }

    // Velocity classification
    let velocity: 'Fast Moving' | 'Steady Moving' | 'Slow Moving' | 'Stagnant / Dead Stock' =
      'Steady Moving';

    if (saleInfo.qty === 0) {
      velocity = 'Stagnant / Dead Stock';
    } else if (turnoverRatio >= 2.0 || saleInfo.qty >= 15) {
      velocity = 'Fast Moving';
    } else if (turnoverRatio >= 0.8 || saleInfo.qty >= 5) {
      velocity = 'Steady Moving';
    } else {
      velocity = 'Slow Moving';
    }

    return {
      productId: p.id,
      productName: p.name,
      category: p.category || 'General',
      currentStock: p.quantity,
      unit: p.unit,
      costPrice: p.costPrice,
      retailPrice: p.retailPrice,
      stockValueAtCost,
      quantitySold: saleInfo.qty,
      cogsSold: saleInfo.cogs,
      revenueSold: saleInfo.rev,
      turnoverRatio: Math.round(turnoverRatio * 100) / 100,
      daysOfInventory,
      velocity,
    };
  }).sort((a, b) => b.quantitySold - a.quantitySold);
}

