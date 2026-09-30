import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  Package,
  TrendingUp,
  DollarSign,
  X,
  Check,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatCurrency, calculateInventoryMetrics } from '../utils/calculations';

export const StockView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, settings, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'quantity-desc' | 'price-desc' | 'profit-desc'>('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState('pcs');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  const inventoryMetrics = calculateInventoryMetrics(products);

  // Dynamically extract categories with product counts
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category?.trim() || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return map;
  }, [products]);

  const uniqueCategories = useMemo(() => {
    return Array.from(categoryCounts.keys()).sort();
  }, [categoryCounts]);

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Provisions');
    setCostPrice(0);
    setRetailPrice(0);
    setWholesalePrice(0);
    setQuantity(10);
    setUnit('pcs');
    setLowStockThreshold(5);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category || 'General');
    setCostPrice(p.costPrice);
    setRetailPrice(p.retailPrice);
    setWholesalePrice(p.wholesalePrice);
    setQuantity(p.quantity);
    setUnit(p.unit);
    setLowStockThreshold(p.lowStockThreshold || 5);
    setIsModalOpen(true);
  };

  // Submit product
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product name');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: name.trim(),
        category: category.trim(),
        costPrice: Number(costPrice) || 0,
        retailPrice: Number(retailPrice) || 0,
        wholesalePrice: Number(wholesalePrice) || 0,
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'pcs',
        lowStockThreshold: Number(lowStockThreshold) || 5,
      });
    } else {
      addProduct({
        name: name.trim(),
        category: category.trim() || 'General',
        costPrice: Number(costPrice) || 0,
        retailPrice: Number(retailPrice) || 0,
        wholesalePrice: Number(wholesalePrice) || 0,
        quantity: Number(quantity) || 0,
        unit: unit.trim() || 'pcs',
        lowStockThreshold: Number(lowStockThreshold) || 5,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, prodName: string) => {
    if (confirm(`Are you sure you want to delete "${prodName}" from stock?`)) {
      deleteProduct(id);
    }
  };

  // Filtered and sorted product list
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      // 1. Search Query (name, category, or unit)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = (p.category || 'General').toLowerCase().includes(q);
        const matchUnit = p.unit?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchUnit) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        const prodCat = (p.category || 'General').toLowerCase();
        if (prodCat !== selectedCategory.toLowerCase()) return false;
      }

      // 3. Stock Level Filter
      if (filterType === 'low') {
        return p.quantity > 0 && p.quantity <= (p.lowStockThreshold || 5);
      }
      if (filterType === 'out') {
        return p.quantity <= 0;
      }
      return true;
    });

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === 'quantity-desc') return b.quantity - a.quantity;
      if (sortBy === 'price-desc') return b.retailPrice - a.retailPrice;
      if (sortBy === 'profit-desc') {
        const profitA = a.retailPrice - a.costPrice;
        const profitB = b.retailPrice - b.costPrice;
        return profitB - profitA;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [products, searchQuery, selectedCategory, filterType, sortBy]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-600" />
            Stock & Products Inventory
          </h2>
          <p className="text-xs text-slate-500">
            Track quantities, cost, retail and wholesale prices, and low stock alerts
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Stock Value Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Items in Stock</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {inventoryMetrics.totalItemsInStock}
          </span>
          <span className="text-[10px] text-slate-500">{inventoryMetrics.totalProductsCount} unique products</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Stock Value (Cost)</span>
          <span className="text-xl font-black text-blue-700 mt-1 block">
            {formatCurrency(inventoryMetrics.totalCostValue, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-500">Capital invested</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Stock Value (Retail)</span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">
            {formatCurrency(inventoryMetrics.totalRetailValue, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-500">Expected sales value</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Potential Profit</span>
          <span className="text-xl font-black text-amber-700 mt-1 block">
            {formatCurrency(inventoryMetrics.potentialProfitAtRetail, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-500">Retail minus cost</span>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        {/* Search Bar with Quick Clear & Match Counter */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, category, or unit..."
            className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden transition bg-slate-50/50 focus:bg-white font-medium text-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Category Filter Pills (Dynamically populated from products) */}
        {uniqueCategories.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Filter by Category:</span>
              </span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-emerald-700 hover:underline text-[11px]"
                >
                  Show All Categories
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All Categories</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-800 text-emerald-100'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {uniqueCategories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                const count = categoryCounts.get(cat) || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock Status & Sorting Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Status:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                filterType === 'low'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low ({inventoryMetrics.lowStockItemsCount})</span>
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filterType === 'out'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              }`}
            >
              Out of Stock ({inventoryMetrics.outOfStockItemsCount})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1 px-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="name">Name (A-Z)</option>
              <option value="quantity-desc">Stock (Highest)</option>
              <option value="price-desc">Price (Highest)</option>
              <option value="profit-desc">Profit (Highest)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicator Tag */}
        {(searchQuery || selectedCategory !== 'all' || filterType !== 'all') && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-1 text-slate-600 truncate flex-wrap">
              <span className="font-semibold text-slate-500">Filtering:</span>
              {searchQuery && (
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-900">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-emerald-800">
                  Category: {selectedCategory}
                </span>
              )}
              {filterType !== 'all' && (
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-amber-800">
                  Status: {filterType}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFilterType('all');
              }}
              className="text-emerald-700 font-bold hover:underline shrink-0 ml-2 text-xs"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Product Items List / Table */}
      <div className="space-y-2.5">
        {products.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-900">Your stock inventory is empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No products recorded yet. Click below to add your first product with its cost price, retail price, and stock quantity.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Your First Product</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-900">No matching products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No products match your search or category filter. Try clearing your filters to view all products.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFilterType('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isOut = p.quantity <= 0;
            const isLow = !isOut && p.quantity <= (p.lowStockThreshold || 5);
            const stockCostValue = p.quantity * p.costPrice;
            const stockRetailValue = p.quantity * p.retailPrice;

            return (
              <div
                key={p.id}
                className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.category || 'General'}
                      </span>
                      {isOut ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock Alert
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          In Stock
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="Edit product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price & Quantity Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">In Stock</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {p.quantity} <span className="font-medium text-slate-500">{p.unit}</span>
                    </span>
                    <span className="text-[10px] text-slate-600 block">(Alert at ≤ {p.lowStockThreshold})</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Cost Price</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(p.costPrice, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-600 block">Total: {formatCurrency(stockCostValue, settings.currencySymbol)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Retail Price</span>
                    <span className="font-black text-emerald-700">
                      {formatCurrency(p.retailPrice, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-600 block">Total: {formatCurrency(stockRetailValue, settings.currencySymbol)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Wholesale Price</span>
                    <span className="font-bold text-blue-700">
                      {formatCurrency(p.wholesalePrice, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-600 block">Bulk rate</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          ADD / EDIT PRODUCT MODAL
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Aroma Perfumed Rice 50kg"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Provisions, Fabrics"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-sm bg-white"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="bags">Bags</option>
                    <option value="boxes">Boxes</option>
                    <option value="cartons">Cartons</option>
                    <option value="gallons">Gallons</option>
                    <option value="cans">Cans / Tins</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="yards">Yards</option>
                    <option value="packets">Packets</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-black uppercase text-slate-600 block">
                  Pricing (in {settings.currencyCode})
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                      Cost Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg text-sm font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                      Retail Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                      className="w-full py-1.5 px-2.5 border border-emerald-400 rounded-lg text-sm font-bold bg-white text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">
                      Wholesale Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full py-1.5 px-2.5 border border-blue-400 rounded-lg text-sm font-bold bg-white text-blue-800"
                    />
                  </div>
                </div>

                {retailPrice > 0 && costPrice > 0 && (
                  <div className="text-[11px] text-slate-600 flex justify-between">
                    <span>Retail Profit: <strong>{formatCurrency(retailPrice - costPrice, settings.currencySymbol)}/ea</strong></span>
                    <span>Markup: <strong>{(((retailPrice - costPrice) / costPrice) * 100).toFixed(1)}%</strong></span>
                  </div>
                )}

                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10.5px] text-emerald-900 leading-snug">
                  🛡️ <strong>Historical Price Protection:</strong> Price or cost edits made here apply strictly to future sales. Past recorded sales (e.g. yesterday's sales) remain permanently locked at their original sold price.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl focus:border-emerald-600 focus:outline-hidden text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${editingProduct.name}" from inventory?`)) {
                        deleteProduct(editingProduct.id);
                        setIsModalOpen(false);
                      }
                    }}
                    className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm border border-rose-200 transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>{editingProduct ? 'Save Product Changes' : 'Add Product to Stock'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
