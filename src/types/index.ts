export type PriceType = 'retail' | 'wholesale' | 'custom';
export type PaymentMethod = 'cash' | 'momo' | 'debt';
export type PaymentStatus = 'paid' | 'unpaid';

export type ExpenseCategory = string;

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;       // Unit cost price (GH₵)
  retailPrice: number;     // Standard retail selling price (GH₵)
  wholesalePrice: number;  // Standard wholesale price (GH₵)
  quantity: number;        // Units currently in stock
  unit: string;            // pcs, bags, boxes, cartons, kg, litres, yards
  lowStockThreshold: number; // Alert when stock <= this
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  date: string;            // YYYY-MM-DD
  supplier: string;        // Name / Market location (e.g. Accra Central, Kumasi Kejetia)
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;       // Base purchase cost per unit
  lorryFare: number;       // Transport / lorry fare for this batch
  otherCosts: number;      // Coolie / loading / offloading / council tolls
  totalLandedCost: number; // (quantity * costPrice) + lorryFare + otherCosts
  unitLandedCost: number;  // totalLandedCost / quantity
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string;            // YYYY-MM-DD
  time?: string;           // HH:mm
  customerName: string;    // e.g. "Walk-in" or "Sister Comfort"
  customerPhone?: string;
  productId: string;
  productName: string;
  quantity: number;
  priceType: PriceType;
  originalCatalogPrice: number; // Catalog retail or wholesale price (reference)
  negotiatedPrice: number;      // The actual agreed / negotiated price charged per unit
  bargainUnitPrice: number;     // Backwards compatibility alias
  isNegotiatedPrice: boolean;   // Whether a negotiated custom price was applied
  discountPerUnit: number;      // originalCatalogPrice - negotiatedPrice
  unitCostPrice: number;        // Product cost captured at time of sale
  totalAmount: number;          // quantity * negotiatedPrice
  totalCost: number;            // quantity * unitCostPrice (COGS)
  profit: number;               // totalAmount - totalCost
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;            // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  description: string;
  paidTo?: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  phone: string;
  location: string;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number;              // Percentage (e.g. 0% or 3%)
  googleSheetsWebhookUrl?: string;
  receiptFooter: string;
}

export type TimeframeFilter = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface BestSellerStat {
  productId: string;
  productName: string;
  category?: string;
  totalQuantity: number;
  totalRevenue: number;
  totalProfit: number;
  profitMarginPercent: number;
  revenueSharePercent: number;
}

export interface CustomerHistorySummary {
  customerName: string;
  customerPhone?: string;
  totalSpent: number;
  totalProfit: number;
  ordersCount: number;
  lastPurchaseDate: string;
  totalDebt: number;
  sales: Sale[];
}

export interface InventoryTurnoverStat {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: string;
  costPrice: number;
  retailPrice: number;
  stockValueAtCost: number;
  quantitySold: number;
  cogsSold: number;
  revenueSold: number;
  turnoverRatio: number;      // COGS sold / Current stock value (or sales/stock)
  daysOfInventory: number;    // Days to clear stock based on run-rate
  velocity: 'Fast Moving' | 'Steady Moving' | 'Slow Moving' | 'Stagnant / Dead Stock';
}

export interface SalesTrendPoint {
  label: string;
  rawDate: string;
  sales: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  ordersCount: number;
}

