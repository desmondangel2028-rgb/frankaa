import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Zap,
  Droplets,
  Home,
  Wifi,
  Users,
  FileText,
  Truck,
  Building,
  X,
  Check,
  Search,
  Tag,
  Wrench,
  Package,
  Shield,
  Coffee,
  Fuel,
  Sparkles,
  Settings2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ExpenseCategory } from '../types';
import { formatCurrency, getTodayDateString } from '../utils/calculations';

// Built-in standard categories for Ghanaian retail & wholesale trading
const DEFAULT_CATEGORIES = [
  'Transport & Lorry Fare',
  'Utilities (ECG & Water)',
  'Salaries & Wages',
  'Store Rent & Council Tolls',
  'Taxes & Statutory Levies',
  'Internet, Airtime & MoMo Charges',
  'Repairs & Store Maintenance',
  'Packaging & Shopping Bags',
  'Food & Staff Welfare',
  'Security & Sanitation',
  'Other Operating Expenses',
];

const CATEGORY_STORAGE_KEY = 'anm_custom_expense_categories_v2';

// Helper to choose appropriate icon and color based on category name
const getCategoryStyle = (catName: string) => {
  const lower = catName.toLowerCase();
  if (lower.includes('transport') || lower.includes('lorry') || lower.includes('fare') || lower.includes('taxi')) {
    return { icon: Truck, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  if (lower.includes('ecg') || lower.includes('electric') || lower.includes('power') || lower.includes('light')) {
    return { icon: Zap, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  }
  if (lower.includes('water') || lower.includes('gwcl')) {
    return { icon: Droplets, color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }
  if (lower.includes('utility') || lower.includes('utilities')) {
    return { icon: Zap, color: 'text-orange-700 bg-orange-50 border-orange-200' };
  }
  if (lower.includes('salary') || lower.includes('wage') || lower.includes('staff') || lower.includes('payroll')) {
    return { icon: Users, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (lower.includes('rent') || lower.includes('store') || lower.includes('shop') || lower.includes('shed')) {
    return { icon: Home, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  }
  if (lower.includes('tax') || lower.includes('toll') || lower.includes('gra') || lower.includes('assembly')) {
    return { icon: Building, color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }
  if (lower.includes('internet') || lower.includes('momo') || lower.includes('data') || lower.includes('phone') || lower.includes('airtime')) {
    return { icon: Wifi, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
  }
  if (lower.includes('repair') || lower.includes('maintenance') || lower.includes('carpenter')) {
    return { icon: Wrench, color: 'text-purple-700 bg-purple-50 border-purple-200' };
  }
  if (lower.includes('pack') || lower.includes('bag') || lower.includes('rubber') || lower.includes('box')) {
    return { icon: Package, color: 'text-teal-700 bg-teal-50 border-teal-200' };
  }
  if (lower.includes('fuel') || lower.includes('generator') || lower.includes('petrol') || lower.includes('diesel')) {
    return { icon: Fuel, color: 'text-amber-800 bg-amber-100 border-amber-300' };
  }
  if (lower.includes('security') || lower.includes('watchman') || lower.includes('sanitation')) {
    return { icon: Shield, color: 'text-slate-700 bg-slate-100 border-slate-300' };
  }
  if (lower.includes('food') || lower.includes('welfare') || lower.includes('lunch')) {
    return { icon: Coffee, color: 'text-lime-700 bg-lime-50 border-lime-200' };
  }
  return { icon: FileText, color: 'text-slate-700 bg-slate-50 border-slate-200' };
};

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, deleteExpense, settings } = useApp();

  // Custom Categories State (loaded from storage + built-ins + existing expenses)
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_CATEGORIES;
  });

  // Save custom categories when modified
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(customCategories));
    } catch {}
  }, [customCategories]);

  // Combine categories: custom list + any category found in expenses
  const allCategories = useMemo(() => {
    const set = new Set<string>(customCategories);
    expenses.forEach((e) => {
      if (e.category?.trim()) set.add(e.category.trim());
    });
    return Array.from(set);
  }, [customCategories, expenses]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState<ExpenseCategory>('Transport & Lorry Fare');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [paidTo, setPaidTo] = useState('');

  // Inline "New Category" input inside modal
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleOpenModal = (cat?: ExpenseCategory) => {
    setDate(getTodayDateString());
    setCategory(cat || (allCategories[0] || 'Transport & Lorry Fare'));
    setAmount(0);
    setDescription('');
    setPaidTo('');
    setIsAddingNewCategory(false);
    setNewCategoryName('');
    setIsModalOpen(true);
  };

  const handleCreateNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (!allCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCustomCategories((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingNewCategory(false);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (confirm(`Remove category "${catToDelete}" from your categories list? Existing expenses will not be lost.`)) {
      setCustomCategories((prev) => prev.filter((c) => c !== catToDelete));
      if (filterCategory === catToDelete) setFilterCategory('all');
      if (category === catToDelete) setCategory('Other Operating Expenses');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter an expense amount greater than 0');
      return;
    }

    const finalCategory = category.trim() || 'Other Operating Expenses';

    addExpense({
      date,
      category: finalCategory,
      amount: Number(amount),
      description: description.trim() || `${finalCategory} payment`,
      paidTo: paidTo.trim(),
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, desc: string) => {
    if (confirm(`Delete expense record "${desc}"?`)) {
      deleteExpense(id);
    }
  };

  // Filtered expenses with search and category filter
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Category match
      if (filterCategory !== 'all' && e.category.toLowerCase() !== filterCategory.toLowerCase()) {
        return false;
      }
      // Search query match (description, paidTo, category, date)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = e.description?.toLowerCase().includes(q);
        const matchPayee = e.paidTo?.toLowerCase().includes(q);
        const matchCat = e.category?.toLowerCase().includes(q);
        const matchDate = e.date?.toLowerCase().includes(q);
        if (!matchDesc && !matchPayee && !matchCat && !matchDate) return false;
      }
      return true;
    });
  }, [expenses, filterCategory, searchQuery]);

  const totalExpensesAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  // Category totals & counts
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other Operating Expenses';
      if (!stats[cat]) stats[cat] = { total: 0, count: 0 };
      stats[cat].total += e.amount || 0;
      stats[cat].count += 1;
    });
    return stats;
  }, [expenses]);

  // Find highest category
  const highestCategory = useMemo(() => {
    let topCat = '';
    let max = 0;
    Object.entries(categoryStats).forEach(([cat, data]) => {
      if (data.total > max) {
        max = data.total;
        topCat = cat;
      }
    });
    return { name: topCat, amount: max };
  }, [categoryStats]);

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            Expenses & Overhead Bills
          </h2>
          <p className="text-xs text-slate-500">
            Granular expense tracking: transport, utilities, salaries, rent, taxes, and custom operational costs
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCategoryManagerOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Manage custom expense categories"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Categories ({allCategories.length})</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Expenses</span>
          <span className="text-xl font-black text-rose-700 mt-0.5 block">
            {formatCurrency(totalExpensesAmount, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-400">{expenses.length} total payments</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Highest Category</span>
          <span className="text-sm font-black text-slate-900 mt-1 block truncate">
            {highestCategory.name || 'None'}
          </span>
          <span className="text-[10px] text-rose-600 font-bold">
            {highestCategory.amount > 0 ? formatCurrency(highestCategory.amount, settings.currencySymbol) : 'GH₵ 0.00'}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Active Categories</span>
          <span className="text-xl font-black text-emerald-700 mt-0.5 block">
            {Object.keys(categoryStats).length} in use
          </span>
          <span className="text-[10px] text-slate-400">out of {allCategories.length} available</span>
        </div>
      </div>

      {/* QUICK CATEGORY TAP CARDS & FILTER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-rose-600" />
            <span>Expense Categories (Tap to Filter or Record)</span>
          </span>
          <button
            onClick={() => handleOpenModal()}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            <span>Add Bill</span>
          </button>
        </div>

        {/* Scrollable / Responsive Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {allCategories.slice(0, 8).map((catName) => {
            const style = getCategoryStyle(catName);
            const Icon = style.icon;
            const data = categoryStats[catName] || { total: 0, count: 0 };
            const isSelected = filterCategory === catName;

            return (
              <button
                key={catName}
                type="button"
                onClick={() => setFilterCategory(isSelected ? 'all' : catName)}
                className={`p-2.5 rounded-xl border text-left transition select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                    : `${style.color} hover:shadow-xs`
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4" />
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-300' : 'opacity-80'}`}>
                    {data.count} {data.count === 1 ? 'bill' : 'bills'}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold block truncate">{catName}</span>
                  <span className={`text-[11px] font-black ${isSelected ? 'text-amber-400' : 'text-slate-900'}`}>
                    {data.total > 0 ? formatCurrency(data.total, settings.currencySymbol) : 'GH₵ 0.00'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {allCategories.length > 8 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">More:</span>
            {allCategories.slice(8).map((catName) => {
              const isSelected = filterCategory === catName;
              const data = categoryStats[catName];
              return (
                <button
                  key={catName}
                  onClick={() => setFilterCategory(isSelected ? 'all' : catName)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{catName}</span>
                  {data && data.total > 0 && (
                    <span className="text-[10px] font-normal opacity-70">
                      ({formatCurrency(data.total, settings.currencySymbol)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses by description, recipient, or category..."
            className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-rose-600 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
            {filteredExpenses.length} found
          </span>
        </div>

        {/* Active Filter Notification */}
        {(filterCategory !== 'all' || searchQuery) && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-600">
              Filtering by:{' '}
              {filterCategory !== 'all' && (
                <strong className="text-rose-700 font-extrabold mr-2">Category: {filterCategory}</strong>
              )}
              {searchQuery && (
                <span className="text-slate-800 font-bold">Search: "{searchQuery}"</span>
              )}
            </span>
            <button
              onClick={() => {
                setFilterCategory('all');
                setSearchQuery('');
              }}
              className="text-emerald-700 font-bold hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* EXPENSES HISTORY LIST */}
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500 space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-slate-900">No expenses recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Record transport, utilities, salaries, or shop rent to get an accurate Net Profit on your P&L statement.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs active:scale-95 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Record First Expense</span>
            </button>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-1" />
            <p className="text-sm font-semibold text-slate-800">No expenses match your search or filter.</p>
            <button
              onClick={() => {
                setFilterCategory('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Show all expenses
            </button>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const style = getCategoryStyle(exp.category);
            const Icon = style.icon;

            return (
              <div
                key={exp.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${style.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                      <span className="text-xs text-slate-400">{exp.date}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5 truncate">
                      {exp.description}
                    </h4>
                    {exp.paidTo && (
                      <p className="text-[11px] text-slate-500">Paid to: <span className="font-semibold text-slate-700">{exp.paidTo}</span></p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="text-base font-black text-rose-600">
                    -{formatCurrency(exp.amount, settings.currencySymbol)}
                  </span>
                  <button
                    onClick={() => handleDelete(exp.id, exp.description)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete expense record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          RECORD EXPENSE MODAL (With Customizable Category Selector)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-200" />
                Record Business Expense
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-rose-800 text-white hover:bg-rose-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Amount ({settings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full py-2 px-3 border border-rose-300 rounded-xl text-base font-black text-rose-700 focus:border-rose-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* CUSTOMIZABLE CATEGORY SELECTOR */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-600" />
                    <span>Select Expense Category *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>{isAddingNewCategory ? 'Cancel' : '+ New Category'}</span>
                  </button>
                </div>

                {/* Inline New Category Creator */}
                {isAddingNewCategory && (
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-300 space-y-2 mb-2 shadow-xs">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      Add a New Custom Category (e.g. Generator Fuel, Delivery Bike):
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name..."
                        className="flex-1 py-1.5 px-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-emerald-600 focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleCreateNewCategory()}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-xs"
                      >
                        Add & Select
                      </button>
                    </div>
                  </div>
                )}

                {/* Visual Category Chip Selector (Scrollable grid with icons) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {allCategories.map((catName) => {
                    const style = getCategoryStyle(catName);
                    const Icon = style.icon;
                    const isSelected = category.toLowerCase() === catName.toLowerCase();

                    return (
                      <button
                        key={catName}
                        type="button"
                        onClick={() => setCategory(catName)}
                        className={`p-2 rounded-xl text-left border text-xs font-bold flex items-center gap-2 transition ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate flex-1 text-[11px]">{catName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>Selected: <strong className="text-slate-900">{category}</strong></span>
                  <span className="text-[10px] text-slate-400">{allCategories.length} categories available</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Description / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`e.g. ${category} payment`}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Paid To / Recipient (Optional)
                </label>
                <input
                  type="text"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="e.g. ECG Vendor, Driver Kofi, Landlord"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>SAVE EXPENSE RECORD</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CATEGORY MANAGER MODAL
          ========================================================================= */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                Customize Expense Categories
              </h3>
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Add New Category Box */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 block">
                  Add New Custom Category:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Generator Fuel, Security..."
                    className="flex-1 py-1.5 px-2.5 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:outline-hidden focus:border-emerald-600"
                  />
                  <button
                    onClick={() => handleCreateNewCategory()}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* List of all categories */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  All Active Categories ({allCategories.length})
                </span>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {allCategories.map((cat) => {
                    const style = getCategoryStyle(cat);
                    const Icon = style.icon;
                    const count = categoryStats[cat]?.count || 0;
                    const isDefault = DEFAULT_CATEGORIES.includes(cat);

                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{cat}</span>
                          {count > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 font-bold">
                              {count} {count === 1 ? 'bill' : 'bills'}
                            </span>
                          )}
                        </div>

                        {!isDefault && (
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete custom category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                💡 <strong>Tip:</strong> Categorizing expenses accurately helps your P&L statement show exact breakdowns of where your shop revenue goes.
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
