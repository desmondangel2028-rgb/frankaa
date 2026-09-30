import { Product, Sale, Purchase, Expense, BusinessSettings } from '../types';
import { calculateMetrics, formatCurrency } from './calculations';

/**
 * Clean cell content for CSV (escape quotes and handle commas)
 */
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Trigger browser file download for CSV
 */
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Sales CSV
 */
export function generateSalesCSV(sales: Sale[], settings: BusinessSettings): string {
  const headers = [
    'Receipt No',
    'Date',
    'Time',
    'Customer Name',
    'Product Name',
    'Quantity',
    'Price Type',
    `Original Price (${settings.currencyCode})`,
    `Charged / Bargain Price (${settings.currencyCode})`,
    `Unit Discount (${settings.currencyCode})`,
    `Unit Cost (${settings.currencyCode})`,
    `Total Amount (${settings.currencyCode})`,
    `Total Cost (${settings.currencyCode})`,
    `Profit (${settings.currencyCode})`,
    'Payment Method',
    'Payment Status',
    'Notes',
  ];

  const rows = sales.map((s) => [
    escapeCSV(s.receiptNumber),
    escapeCSV(s.date),
    escapeCSV(s.time || ''),
    escapeCSV(s.customerName),
    escapeCSV(s.productName),
    escapeCSV(s.quantity),
    escapeCSV(s.priceType),
    escapeCSV(s.originalCatalogPrice),
    escapeCSV(s.bargainUnitPrice),
    escapeCSV(s.discountPerUnit),
    escapeCSV(s.unitCostPrice),
    escapeCSV(s.totalAmount),
    escapeCSV(s.totalCost),
    escapeCSV(s.profit),
    escapeCSV(s.paymentMethod.toUpperCase()),
    escapeCSV(s.paymentStatus.toUpperCase()),
    escapeCSV(s.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Purchases CSV (with lorry fare and buying costs)
 */
export function generatePurchasesCSV(purchases: Purchase[], settings: BusinessSettings): string {
  const headers = [
    'Purchase Date',
    'Supplier / Market',
    'Product / Item',
    'Quantity',
    `Cost Price Per Unit (${settings.currencyCode})`,
    `Lorry Fare / Transport (${settings.currencyCode})`,
    `Other Buying Costs (${settings.currencyCode})`,
    `Total Landed Cost (${settings.currencyCode})`,
    `Unit Landed Cost (${settings.currencyCode})`,
    'Notes',
  ];

  const rows = purchases.map((p) => [
    escapeCSV(p.date),
    escapeCSV(p.supplier),
    escapeCSV(p.productName),
    escapeCSV(p.quantity),
    escapeCSV(p.costPrice),
    escapeCSV(p.lorryFare),
    escapeCSV(p.otherCosts),
    escapeCSV(p.totalLandedCost),
    escapeCSV(p.unitLandedCost.toFixed(2)),
    escapeCSV(p.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Expenses CSV
 */
export function generateExpensesCSV(expenses: Expense[], settings: BusinessSettings): string {
  const headers = [
    'Date',
    'Category',
    `Amount (${settings.currencyCode})`,
    'Description',
    'Paid To',
  ];

  const rows = expenses.map((e) => [
    escapeCSV(e.date),
    escapeCSV(e.category),
    escapeCSV(e.amount),
    escapeCSV(e.description),
    escapeCSV(e.paidTo || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Products / Stock Inventory CSV
 */
export function generateProductsCSV(products: Product[], settings: BusinessSettings): string {
  const headers = [
    'Product Name',
    'Category',
    'Unit',
    'Quantity in Stock',
    `Cost Price (${settings.currencyCode})`,
    `Retail Price (${settings.currencyCode})`,
    `Wholesale Price (${settings.currencyCode})`,
    `Total Stock Value at Cost (${settings.currencyCode})`,
    `Total Stock Value at Retail (${settings.currencyCode})`,
    `Potential Gross Margin (%)`,
    'Low Stock Alert Level',
    'Stock Status',
  ];

  const rows = products.map((p) => {
    const costVal = p.quantity * p.costPrice;
    const retailVal = p.quantity * p.retailPrice;
    const margin = p.retailPrice > 0 ? ((p.retailPrice - p.costPrice) / p.retailPrice) * 100 : 0;
    const status = p.quantity <= 0 ? 'OUT OF STOCK' : p.quantity <= p.lowStockThreshold ? 'LOW STOCK' : 'IN STOCK';

    return [
      escapeCSV(p.name),
      escapeCSV(p.category || 'General'),
      escapeCSV(p.unit),
      escapeCSV(p.quantity),
      escapeCSV(p.costPrice),
      escapeCSV(p.retailPrice),
      escapeCSV(p.wholesalePrice),
      escapeCSV(costVal.toFixed(2)),
      escapeCSV(retailVal.toFixed(2)),
      escapeCSV(margin.toFixed(1) + '%'),
      escapeCSV(p.lowStockThreshold),
      escapeCSV(status),
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Profit & Loss Financial Summary CSV
 */
export function generateProfitLossCSV(
  sales: Sale[],
  expenses: Expense[],
  settings: BusinessSettings
): string {
  const metrics = calculateMetrics(sales, expenses, 'all');

  const rows = [
    ['BUSINESS PROFIT & LOSS STATEMENT', ''],
    ['Business Name', escapeCSV(settings.businessName)],
    ['Date Generated', escapeCSV(new Date().toLocaleDateString())],
    ['Currency', escapeCSV(settings.currencyCode)],
    ['', ''],
    ['FINANCIAL SUMMARY METRIC', `AMOUNT (${settings.currencyCode})`],
    ['Total Sales Revenue', escapeCSV(metrics.totalSales.toFixed(2))],
    ['Cost of Goods Sold (COGS)', escapeCSV(metrics.totalCostOfGoodsSold.toFixed(2))],
    ['GROSS PROFIT', escapeCSV(metrics.grossProfit.toFixed(2))],
    ['Total Operating Expenses', escapeCSV(metrics.totalExpenses.toFixed(2))],
    ['NET PROFIT / LOSS', escapeCSV(metrics.netProfit.toFixed(2))],
    ['Profit Margin (%)', escapeCSV(metrics.profitMarginPercent.toFixed(1) + '%')],
    ['Markup (%)', escapeCSV(metrics.markupPercent.toFixed(1) + '%')],
    ['Total Sales Transactions', escapeCSV(metrics.salesCount)],
    ['Total Units Sold', escapeCSV(metrics.quantitySold)],
  ];

  return rows.map((r) => r.join(',')).join('\n');
}

/**
 * Generate Best Selling Products CSV
 */
export function generateBestSellersCSV(
  bestSellers: import('../types').BestSellerStat[],
  settings: BusinessSettings
): string {
  const headers = [
    'Rank',
    'Product Name',
    'Category',
    'Total Units Sold',
    `Total Revenue (${settings.currencyCode})`,
    `Total Profit (${settings.currencyCode})`,
    'Profit Margin (%)',
    'Share of Total Sales (%)',
  ];

  const rows = bestSellers.map((item, idx) => [
    escapeCSV(idx + 1),
    escapeCSV(item.productName),
    escapeCSV(item.category || 'General'),
    escapeCSV(item.totalQuantity),
    escapeCSV(item.totalRevenue.toFixed(2)),
    escapeCSV(item.totalProfit.toFixed(2)),
    escapeCSV(item.profitMarginPercent.toFixed(1) + '%'),
    escapeCSV(item.revenueSharePercent.toFixed(1) + '%'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Sales Trends CSV
 */
export function generateTrendsCSV(
  trends: import('../types').SalesTrendPoint[],
  settings: BusinessSettings
): string {
  const headers = [
    'Period',
    'Date / Key',
    'Order Count',
    `Sales Revenue (${settings.currencyCode})`,
    `COGS (${settings.currencyCode})`,
    `Gross Profit (${settings.currencyCode})`,
    `Net Profit (${settings.currencyCode})`,
  ];

  const rows = trends.map((t) => [
    escapeCSV(t.label),
    escapeCSV(t.rawDate),
    escapeCSV(t.ordersCount),
    escapeCSV(t.sales.toFixed(2)),
    escapeCSV(t.cogs.toFixed(2)),
    escapeCSV(t.grossProfit.toFixed(2)),
    escapeCSV(t.netProfit.toFixed(2)),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Customer History CSV
 */
export function generateCustomerHistoryCSV(
  customers: import('../types').CustomerHistorySummary[],
  settings: BusinessSettings
): string {
  const headers = [
    'Customer Name',
    'Phone / MoMo',
    'Total Orders Count',
    `Total Spent (${settings.currencyCode})`,
    `Total Profit (${settings.currencyCode})`,
    `Unpaid Debt Balance (${settings.currencyCode})`,
    'Last Purchase Date',
  ];

  const rows = customers.map((c) => [
    escapeCSV(c.customerName),
    escapeCSV(c.customerPhone || 'N/A'),
    escapeCSV(c.ordersCount),
    escapeCSV(c.totalSpent.toFixed(2)),
    escapeCSV(c.totalProfit.toFixed(2)),
    escapeCSV(c.totalDebt.toFixed(2)),
    escapeCSV(c.lastPurchaseDate),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate Inventory Turnover Rate CSV
 */
export function generateInventoryTurnoverCSV(
  turnoverStats: import('../types').InventoryTurnoverStat[],
  settings: BusinessSettings
): string {
  const headers = [
    'Product Name',
    'Category',
    'In Stock',
    'Unit',
    `Unit Cost (${settings.currencyCode})`,
    `Current Stock Value (${settings.currencyCode})`,
    'Quantity Sold',
    `COGS Sold (${settings.currencyCode})`,
    `Revenue Sold (${settings.currencyCode})`,
    'Turnover Ratio',
    'Days to Clear Stock (DSI)',
    'Stock Velocity Status',
  ];

  const rows = turnoverStats.map((item) => [
    escapeCSV(item.productName),
    escapeCSV(item.category),
    escapeCSV(item.currentStock),
    escapeCSV(item.unit),
    escapeCSV(item.costPrice.toFixed(2)),
    escapeCSV(item.stockValueAtCost.toFixed(2)),
    escapeCSV(item.quantitySold),
    escapeCSV(item.cogsSold.toFixed(2)),
    escapeCSV(item.revenueSold.toFixed(2)),
    escapeCSV(item.turnoverRatio),
    escapeCSV(item.daysOfInventory >= 999 ? 'Over 1 Year (Stagnant)' : `${item.daysOfInventory} days`),
    escapeCSV(item.velocity),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Copy data to clipboard formatted with TAB delimiters so pasting into Google Sheets
 * perfectly fills rows and columns!
 */
export async function copyForGoogleSheets(
  type: 'sales' | 'purchases' | 'expenses' | 'inventory' | 'pnl',
  data: {
    sales: Sale[];
    purchases: Purchase[];
    expenses: Expense[];
    products: Product[];
    settings: BusinessSettings;
  }
): Promise<boolean> {
  try {
    let tsv = '';
    const { sales, purchases, expenses, products, settings } = data;

    if (type === 'sales') {
      const headers = ['Receipt #', 'Date', 'Customer', 'Item', 'Qty', 'Price Type', 'Original Price', 'Charged Price', 'Discount', 'Unit Cost', 'Total Revenue', 'COGS', 'Profit', 'Payment'];
      const lines = sales.map((s) => [
        s.receiptNumber,
        s.date,
        s.customerName,
        s.productName,
        s.quantity,
        s.priceType,
        s.originalCatalogPrice,
        s.bargainUnitPrice,
        s.discountPerUnit,
        s.unitCostPrice,
        s.totalAmount,
        s.totalCost,
        s.profit,
        s.paymentMethod,
      ].join('\t'));
      tsv = [headers.join('\t'), ...lines].join('\n');
    } else if (type === 'purchases') {
      const headers = ['Date', 'Supplier', 'Item', 'Quantity', 'Cost Price', 'Lorry Fare', 'Other Costs', 'Total Landed Cost', 'Unit Landed Cost', 'Notes'];
      const lines = purchases.map((p) => [
        p.date,
        p.supplier,
        p.productName,
        p.quantity,
        p.costPrice,
        p.lorryFare,
        p.otherCosts,
        p.totalLandedCost,
        p.unitLandedCost.toFixed(2),
        p.notes || '',
      ].join('\t'));
      tsv = [headers.join('\t'), ...lines].join('\n');
    } else if (type === 'expenses') {
      const headers = ['Date', 'Category', 'Amount', 'Description', 'Paid To'];
      const lines = expenses.map((e) => [
        e.date,
        e.category,
        e.amount,
        e.description,
        e.paidTo || '',
      ].join('\t'));
      tsv = [headers.join('\t'), ...lines].join('\n');
    } else if (type === 'inventory') {
      const headers = ['Product', 'Category', 'Unit', 'Stock Qty', 'Cost Price', 'Retail Price', 'Wholesale Price', 'Stock Value (Cost)', 'Stock Value (Retail)', 'Status'];
      const lines = products.map((p) => [
        p.name,
        p.category,
        p.unit,
        p.quantity,
        p.costPrice,
        p.retailPrice,
        p.wholesalePrice,
        (p.quantity * p.costPrice).toFixed(2),
        (p.quantity * p.retailPrice).toFixed(2),
        p.quantity <= 0 ? 'Out of Stock' : p.quantity <= p.lowStockThreshold ? 'Low Stock' : 'In Stock',
      ].join('\t'));
      tsv = [headers.join('\t'), ...lines].join('\n');
    } else {
      const metrics = calculateMetrics(sales, expenses, 'all');
      tsv = [
        ['Metric', 'Value'].join('\t'),
        ['Business Name', settings.businessName].join('\t'),
        ['Total Sales Revenue', metrics.totalSales.toFixed(2)].join('\t'),
        ['Cost of Goods Sold (COGS)', metrics.totalCostOfGoodsSold.toFixed(2)].join('\t'),
        ['Gross Profit', metrics.grossProfit.toFixed(2)].join('\t'),
        ['Total Operating Expenses', metrics.totalExpenses.toFixed(2)].join('\t'),
        ['Net Profit / Loss', metrics.netProfit.toFixed(2)].join('\t'),
        ['Profit Margin %', metrics.profitMarginPercent.toFixed(1) + '%'].join('\t'),
      ].join('\n');
    }

    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Google Apps Script snippet code template for user to copy into Google Sheets Extensions -> Apps Script
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// -------------------------------------------------------------
// Google Apps Script to Sync with "Awurade Ne Me Franka Business Manager"
// -------------------------------------------------------------
// 1. Open your Google Sheet.
// 2. Click "Extensions" -> "Apps Script".
// 3. Paste this code and click "Deploy" -> "New deployment".
// 4. Select type: "Web app".
// 5. Execute as: "Me", Who has access: "Anyone".
// 6. Copy the Web app URL and paste it into the App Settings!

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === "sync_sale") {
      var sheet = ss.getSheetByName("Sales") || ss.insertSheet("Sales");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Receipt #", "Date", "Customer", "Item", "Qty", "Price Type", "Price", "Total", "Cost", "Profit", "Payment"]);
      }
      var s = data.sale;
      sheet.appendRow([s.receiptNumber, s.date, s.customerName, s.productName, s.quantity, s.priceType, s.bargainUnitPrice, s.totalAmount, s.totalCost, s.profit, s.paymentMethod]);
    } else if (data.action === "sync_expense") {
      var sheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Date", "Category", "Amount", "Description", "Paid To"]);
      }
      var ex = data.expense;
      sheet.appendRow([ex.date, ex.category, ex.amount, ex.description, ex.paidTo || ""]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
