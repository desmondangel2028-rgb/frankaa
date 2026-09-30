import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Sale,
  Purchase,
  Expense,
  BusinessSettings,
  PriceType,
  PaymentMethod,
  PaymentStatus,
  ExpenseCategory,
} from '../types';
import { getTodayDateString } from '../utils/calculations';

interface AppContextType {
  // Data
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  settings: BusinessSettings;

  // View state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentReceipt: Sale | null;
  setCurrentReceipt: (sale: Sale | null) => void;
  isGoogleSheetsModalOpen: boolean;
  setIsGoogleSheetsModalOpen: (open: boolean) => void;

  // Product Operations
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Purchase Operations
  addPurchase: (data: {
    date: string;
    supplier: string;
    productId: string;
    quantity: number;
    costPrice: number;
    lorryFare: number;
    otherCosts: number;
    notes?: string;
  }) => Purchase;
  deletePurchase: (id: string) => void;

  // Sale Operations
  addSale: (data: {
    date?: string;
    customerName: string;
    customerPhone?: string;
    productId: string;
    quantity: number;
    priceType: PriceType;
    negotiatedPrice?: number;
    bargainUnitPrice?: number;
    isNegotiatedPrice?: boolean;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    notes?: string;
  }) => Sale | null;
  deleteSale: (id: string, restoreStock?: boolean) => void;
  toggleSalePaymentStatus: (id: string) => void;

  // Expense Operations
  addExpense: (data: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    paidTo?: string;
  }) => Expense;
  deleteExpense: (id: string) => void;

  // Settings & Storage
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  exportBackupData: () => void;
  importBackupData: (jsonString: string) => boolean;
  resetToSampleData: () => void;
  clearAllData: () => void;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Awurade Ne Me Franka Business Manager',
  tagline: 'Wholesale & Retail Trading | The Lord is My Banner',
  phone: '024 123 4567 / 055 987 6543',
  location: 'Kejetia Central Market, Kumasi - Ghana',
  currencySymbol: 'GH₵',
  currencyCode: 'GHS',
  taxRate: 0,
  receiptFooter: 'Medaase pa ara! Thank you for buying from us. God bless you!',
};

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  PRODUCTS: 'anm_products_v4_clean',
  SALES: 'anm_sales_v4_clean',
  PURCHASES: 'anm_purchases_v4_clean',
  EXPENSES: 'anm_expenses_v4_clean',
  SETTINGS: 'anm_settings_v4_clean',
};

// Clean legacy mock storage keys if present
try {
  ['anm_products_v2', 'anm_sales_v2', 'anm_purchases_v2', 'anm_expenses_v2', 'anm_settings_v2',
   'anm_products_v3', 'anm_sales_v3', 'anm_purchases_v3', 'anm_expenses_v3'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch {
  // Ignore in non-browser env
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All sections start 100% clean with NO pre-existing content
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentReceipt, setCurrentReceipt] = useState<Sale | null>(null);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Product Operations
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Purchase Operations (adds stock!)
  const addPurchase = (data: {
    date: string;
    supplier: string;
    productId: string;
    quantity: number;
    costPrice: number;
    lorryFare: number;
    otherCosts: number;
    notes?: string;
  }): Purchase => {
    const targetProduct = products.find((p) => p.id === data.productId);
    const productName = targetProduct ? targetProduct.name : 'Unknown Product';

    const baseCost = data.quantity * data.costPrice;
    const totalLandedCost = baseCost + data.lorryFare + data.otherCosts;
    const unitLandedCost = data.quantity > 0 ? totalLandedCost / data.quantity : data.costPrice;

    const newPurchase: Purchase = {
      id: `purch-${Date.now()}`,
      date: data.date,
      supplier: data.supplier,
      productId: data.productId,
      productName,
      quantity: data.quantity,
      costPrice: data.costPrice,
      lorryFare: data.lorryFare,
      otherCosts: data.otherCosts,
      totalLandedCost,
      unitLandedCost,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    // 1. Add purchase
    setPurchases((prev) => [newPurchase, ...prev]);

    // 2. Increment product stock & update product cost to landed cost if product exists
    if (targetProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === data.productId
            ? {
                ...p,
                quantity: p.quantity + data.quantity,
                costPrice: Math.round(unitLandedCost * 100) / 100, // reflect actual landed cost
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
    }

    return newPurchase;
  };

  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  };

  // Sale Operations (custom negotiated price + auto stock deduction!)
  const addSale = (data: {
    date?: string;
    customerName: string;
    customerPhone?: string;
    productId: string;
    quantity: number;
    priceType: PriceType;
    negotiatedPrice?: number;
    bargainUnitPrice?: number;
    isNegotiatedPrice?: boolean;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    notes?: string;
  }): Sale | null => {
    const targetProduct = products.find((p) => p.id === data.productId);
    if (!targetProduct) return null;

    const originalCatalogPrice =
      data.priceType === 'wholesale'
        ? targetProduct.wholesalePrice
        : targetProduct.retailPrice;

    // Use negotiatedPrice or bargainUnitPrice, falling back to originalCatalogPrice
    const actualSalePrice =
      typeof data.negotiatedPrice === 'number'
        ? data.negotiatedPrice
        : typeof data.bargainUnitPrice === 'number'
        ? data.bargainUnitPrice
        : originalCatalogPrice;

    const isNegotiated =
      typeof data.isNegotiatedPrice === 'boolean'
        ? data.isNegotiatedPrice
        : actualSalePrice !== originalCatalogPrice;

    const discountPerUnit = originalCatalogPrice - actualSalePrice;
    const unitCostPrice = targetProduct.costPrice || 0;

    const totalAmount = data.quantity * actualSalePrice;
    const totalCost = data.quantity * unitCostPrice;
    const profit = totalAmount - totalCost;

    const now = new Date();
    const dateStr = data.date || getTodayDateString();
    const timeStr = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });

    // Generate readable receipt number
    const count = sales.length + 1;
    const receiptNumber = `ANM-${String(count).padStart(5, '0')}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      receiptNumber,
      date: dateStr,
      time: timeStr,
      customerName: data.customerName.trim() || 'Walk-in Customer',
      customerPhone: data.customerPhone?.trim(),
      productId: targetProduct.id,
      productName: targetProduct.name,
      quantity: data.quantity,
      priceType: data.priceType,
      originalCatalogPrice,
      negotiatedPrice: actualSalePrice,
      bargainUnitPrice: actualSalePrice,
      isNegotiatedPrice: isNegotiated,
      discountPerUnit,
      unitCostPrice,
      totalAmount,
      totalCost,
      profit,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus || (data.paymentMethod === 'debt' ? 'unpaid' : 'paid'),
      notes: data.notes,
      createdAt: now.toISOString(),
    };

    // 1. Add sale
    setSales((prev) => [newSale, ...prev]);

    // 2. Automatically deduct product stock! (Original catalog prices strictly remain untouched!)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === targetProduct.id
          ? {
              ...p,
              quantity: Math.max(0, p.quantity - data.quantity),
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    // 3. Set current receipt for immediate viewing / printing
    setCurrentReceipt(newSale);

    // 4. Optional Google Sheets Webhook sync in background if configured
    if (settings.googleSheetsWebhookUrl) {
      try {
        fetch(settings.googleSheetsWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_sale', sale: newSale }),
        }).catch((e) => console.log('Google Sheets sync background error (ignored):', e));
      } catch (err) {
        console.error('Webhook post error', err);
      }
    }

    return newSale;
  };

  const deleteSale = (id: string, restoreStock: boolean = true) => {
    const saleToDelete = sales.find((s) => s.id === id);
    if (saleToDelete && restoreStock) {
      // Restore inventory
      setProducts((prev) =>
        prev.map((p) =>
          p.id === saleToDelete.productId
            ? { ...p, quantity: p.quantity + saleToDelete.quantity }
            : p
        )
      );
    }
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSalePaymentStatus = (id: string) => {
    setSales((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              paymentStatus: s.paymentStatus === 'paid' ? 'unpaid' : 'paid',
            }
          : s
      )
    );
  };

  // Expense Operations
  const addExpense = (data: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    description: string;
    paidTo?: string;
  }): Expense => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: data.date,
      category: data.category,
      amount: data.amount,
      description: data.description,
      paidTo: data.paidTo,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);

    if (settings.googleSheetsWebhookUrl) {
      try {
        fetch(settings.googleSheetsWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_expense', expense: newExpense }),
        }).catch(() => {});
      } catch (e) {
        console.log(e);
      }
    }

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Settings & Storage
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const exportBackupData = () => {
    const backupObj = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      businessName: settings.businessName,
      settings,
      products,
      sales,
      purchases,
      expenses,
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = settings.businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    link.download = `${cleanName}_backup_${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackupData = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.products)) setProducts(parsed.products);
      if (Array.isArray(parsed.sales)) setSales(parsed.sales);
      if (Array.isArray(parsed.purchases)) setPurchases(parsed.purchases);
      if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      if (parsed.settings && typeof parsed.settings === 'object') {
        setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }
      return true;
    } catch (err) {
      console.error('Failed to import backup JSON', err);
      return false;
    }
  };

  const resetToSampleData = () => {
    setProducts([]);
    setSales([]);
    setPurchases([]);
    setExpenses([]);
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.SALES);
      localStorage.removeItem(STORAGE_KEYS.PURCHASES);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } catch {}
  };

  const clearAllData = () => {
    setProducts([]);
    setSales([]);
    setPurchases([]);
    setExpenses([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.SALES);
      localStorage.removeItem(STORAGE_KEYS.PURCHASES);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    } catch {}
  };

  return (
    <AppContext.Provider
      value={{
        products,
        sales,
        purchases,
        expenses,
        settings,
        activeTab,
        setActiveTab,
        currentReceipt,
        setCurrentReceipt,
        isGoogleSheetsModalOpen,
        setIsGoogleSheetsModalOpen,
        addProduct,
        updateProduct,
        deleteProduct,
        addPurchase,
        deletePurchase,
        addSale,
        deleteSale,
        toggleSalePaymentStatus,
        addExpense,
        deleteExpense,
        updateSettings,
        exportBackupData,
        importBackupData,
        resetToSampleData,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
