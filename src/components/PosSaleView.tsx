import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Banknote,
  Clock,
  X,
  Package,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, PriceType, PaymentMethod } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';

export const PosSaleView: React.FC = () => {
  const { products, addSale, settings, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sale form state for selected product
  const [quantity, setQuantity] = useState<number>(1);
  const [priceType, setPriceType] = useState<PriceType>('retail');
  const [bargainUnitPrice, setBargainUnitPrice] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // When a product is clicked to sell
  const openSaleModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setPriceType('retail');
    setBargainUnitPrice(product.retailPrice);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setPaymentMethod('cash');
    setNotes('');
  };

  // Switch price type (retail vs wholesale) and reset bargain price to that default
  const handlePriceTypeChange = (type: PriceType) => {
    if (!selectedProduct) return;
    setPriceType(type);
    const base = type === 'wholesale' ? selectedProduct.wholesalePrice : selectedProduct.retailPrice;
    setBargainUnitPrice(base);
  };

  // Quick quantity modifier
  const adjustQuantity = (delta: number) => {
    if (!selectedProduct) return;
    const newQty = Math.max(1, Math.min(selectedProduct.quantity || 9999, quantity + delta));
    setQuantity(newQty);
  };

  // Calculations for current active sale
  const catalogBasePrice = selectedProduct
    ? priceType === 'wholesale'
      ? selectedProduct.wholesalePrice
      : selectedProduct.retailPrice
    : 0;

  const unitDiscount = Math.max(0, catalogBasePrice - bargainUnitPrice);
  const totalAmount = quantity * bargainUnitPrice;
  const totalCost = selectedProduct ? quantity * selectedProduct.costPrice : 0;
  const estimatedProfit = totalAmount - totalCost;
  const isLoss = estimatedProfit < 0;

  // Handle submit sale
  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (quantity <= 0) {
      alert('Please enter a quantity greater than zero');
      return;
    }

    if (selectedProduct.quantity < quantity) {
      if (!confirm(`Warning: You only have ${selectedProduct.quantity} in stock. Proceed with selling ${quantity}?`)) {
        return;
      }
    }

    addSale({
      customerName,
      customerPhone,
      productId: selectedProduct.id,
      quantity,
      priceType,
      negotiatedPrice: bargainUnitPrice,
      bargainUnitPrice: bargainUnitPrice,
      isNegotiatedPrice: bargainUnitPrice !== catalogBasePrice,
      paymentMethod,
      notes: notes.trim() || (bargainUnitPrice !== catalogBasePrice ? `Negotiated from ${formatCurrency(catalogBasePrice, settings.currencySymbol)} to ${formatCurrency(bargainUnitPrice, settings.currencySymbol)}` : undefined),
    });

    // Close modal
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner / Search */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Make a Sale (POS)
            </h2>
            <p className="text-xs text-slate-500">
              Select product to sell • Bargain prices allowed without changing original catalog price
            </p>
          </div>
          <button
            onClick={() => setActiveTab('stock')}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
          >
            + New Product
          </button>
        </div>

        {/* Big Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product name or category..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition capitalize ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid / Cards (Big touch targets for fast mobile tapping) */}
      {products.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-slate-900">Your shop inventory is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any products in stock yet. Add your first item to start recording sales with custom bargaining prices!
          </p>
          <button
            onClick={() => setActiveTab('stock')}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs hover:bg-emerald-600 active:scale-95 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Your First Product</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-medium">No products match your search "{searchQuery}".</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((product) => {
            const isLow = product.quantity <= (product.lowStockThreshold || 5);
            const isOutOfStock = product.quantity <= 0;

            return (
              <div
                key={product.id}
                onClick={() => openSaleModal(product)}
                className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] hover:shadow-md flex flex-col justify-between ${
                  isOutOfStock
                    ? 'border-slate-300 opacity-60 bg-slate-50'
                    : isLow
                    ? 'border-amber-300 ring-1 ring-amber-300/50 hover:border-amber-400'
                    : 'border-slate-200/90 hover:border-emerald-500'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate">
                      {product.category || 'General'}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-800'
                          : isLow
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {product.quantity} {product.unit} left
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-2 line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Retail Price</span>
                    <span className="text-base font-black text-emerald-700">
                      {formatCurrency(product.retailPrice, settings.currencySymbol)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-600 block">Wholesale</span>
                    <span className="text-xs font-bold text-slate-700">
                      {formatCurrency(product.wholesalePrice, settings.currencySymbol)}
                    </span>
                  </div>

                  <button
                    className="w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black flex items-center justify-center shadow-xs shrink-0 ml-2"
                    title="Sell this product"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          BARGAINING SALE MODAL (Custom negotiable price on the fly!)
          ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">
                  Sell with Bargaining Support
                </span>
                <h3 className="text-base sm:text-lg font-black truncate">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleConfirmSale} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Product Stock & Cost Info */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 font-medium">In Stock:</span>{' '}
                  <strong className="text-slate-900 font-bold">{selectedProduct.quantity} {selectedProduct.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Cost Price (COGS):</span>{' '}
                  <strong className="text-slate-700 font-bold">{formatCurrency(selectedProduct.costPrice, settings.currencySymbol)}</strong>
                </div>
              </div>

              {/* Price Type Switch: Retail vs Wholesale */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">
                  1. Select Price Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePriceTypeChange('retail')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition font-bold text-xs sm:text-sm flex flex-col items-center ${
                      priceType === 'retail'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>Retail Standard</span>
                    <span className="text-sm sm:text-base font-extrabold">
                      {formatCurrency(selectedProduct.retailPrice, settings.currencySymbol)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePriceTypeChange('wholesale')}
                    className={`py-2.5 px-3 rounded-xl border text-center transition font-bold text-xs sm:text-sm flex flex-col items-center ${
                      priceType === 'wholesale'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>Wholesale Bulk</span>
                    <span className="text-sm sm:text-base font-extrabold">
                      {formatCurrency(selectedProduct.wholesalePrice, settings.currencySymbol)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quantity Stepper (Big buttons for easy fingers) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    2. Quantity ({selectedProduct.unit})
                  </label>
                  <div className="flex gap-1">
                    {[1, 5, 10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantity(num)}
                        className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold"
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(-1)}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-lg active:scale-95 shrink-0"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center py-2.5 text-xl font-black text-slate-900 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />

                  <button
                    type="button"
                    onClick={() => adjustQuantity(1)}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-lg active:scale-95 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* CUSTOM NEGOTIATED PRICING (Key requested feature!) */}
              <div className="bg-amber-50/90 p-4 rounded-2xl border-2 border-amber-400 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    3. Negotiated Sale Price (Per Unit)
                  </label>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md">
                    Custom Bargain Override
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-slate-700 shrink-0">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={bargainUnitPrice}
                    onChange={(e) => setBargainUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full py-2.5 px-3 text-xl font-black text-slate-900 bg-white border-2 border-amber-400 rounded-xl focus:outline-hidden focus:border-emerald-700 shadow-inner"
                    placeholder="Enter agreed price..."
                  />
                </div>

                {/* Quick Negotiated Price Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Quick Bargain:</span>
                  {[
                    { label: '-5', action: () => setBargainUnitPrice(Math.max(1, catalogBasePrice - 5)) },
                    { label: '-10', action: () => setBargainUnitPrice(Math.max(1, catalogBasePrice - 10)) },
                    { label: '-20', action: () => setBargainUnitPrice(Math.max(1, catalogBasePrice - 20)) },
                    { label: '-5%', action: () => setBargainUnitPrice(Math.round(catalogBasePrice * 0.95)) },
                    { label: '-10%', action: () => setBargainUnitPrice(Math.round(catalogBasePrice * 0.90)) },
                    { label: 'Reset Standard', action: () => setBargainUnitPrice(catalogBasePrice) },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={preset.action}
                      className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-950 font-bold text-[11px] rounded-lg border border-amber-300 transition active:scale-95 shadow-2xs"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Detailed Comparison & Profit Proof */}
                <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Catalog Price:</span>
                    <span className="font-bold">{formatCurrency(catalogBasePrice, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold">
                    <span>Actual Sale Price Charged:</span>
                    <span className="text-amber-800 font-black">{formatCurrency(bargainUnitPrice, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Unit Cost Price (COGS):</span>
                    <span>{formatCurrency(selectedProduct.costPrice, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-700">Unit Profit (Based on Sale Price):</span>
                    <span className={`font-black ${bargainUnitPrice >= selectedProduct.costPrice ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatCurrency(bargainUnitPrice - selectedProduct.costPrice, settings.currencySymbol)} / unit
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 pt-0.5">
                    Original stock catalog price remains strictly {formatCurrency(catalogBasePrice, settings.currencySymbol)} and is never changed.
                  </div>
                </div>

                {/* Loss warning if price is under cost */}
                {bargainUnitPrice < selectedProduct.costPrice && (
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Price is below cost ({formatCurrency(selectedProduct.costPrice, settings.currencySymbol)}). You are selling at a loss!</span>
                  </div>
                )}
              </div>

              {/* Customer Details & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full py-2 px-3 text-sm border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />
                  <div className="flex gap-1 mt-1 overflow-x-auto no-scrollbar">
                    {['Walk-in', 'Madam', 'Bro', 'Sister', 'Wholesaler'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCustomerName(tag)}
                        className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-slate-700"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Phone / MoMo (Optional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0244123456"
                    className="w-full py-2 px-3 text-sm border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'momo'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('debt')}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'debt'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Credit (Debt)</span>
                  </button>
                </div>
              </div>

              {/* Total & Profit Calculation Summary Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Selling Amount:</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400">
                    {formatCurrency(totalAmount, settings.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Cost of Goods (COGS):</span>
                  <span className="text-slate-300 font-semibold">
                    {formatCurrency(totalCost, settings.currencySymbol)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Your Profit on this Sale:</span>
                  <span className={`font-black ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(estimatedProfit, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Big Confirm Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base shadow-lg transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>CONFIRM SALE & VIEW RECEIPT</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
