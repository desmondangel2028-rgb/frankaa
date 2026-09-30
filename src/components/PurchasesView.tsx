import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getTodayDateString } from '../utils/calculations';

export const PurchasesView: React.FC = () => {
  const { purchases, products, addPurchase, deletePurchase, settings, setActiveTab } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [date, setDate] = useState(getTodayDateString());
  const [supplier, setSupplier] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [lorryFare, setLorryFare] = useState<number>(0);
  const [otherCosts, setOtherCosts] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Selected product helper
  const selectedProduct = products.find((p) => p.id === productId);

  // When product is selected in dropdown, auto-fill its current cost price
  const handleProductSelect = (id: string) => {
    setProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCostPrice(prod.costPrice);
    }
  };

  const handleOpenModal = () => {
    setDate(getTodayDateString());
    setSupplier('Tema Port / Accra Market Wholesaler');
    if (products.length > 0) {
      setProductId(products[0].id);
      setCostPrice(products[0].costPrice);
    }
    setQuantity(10);
    setLorryFare(50);
    setOtherCosts(15);
    setNotes('');
    setIsModalOpen(true);
  };

  // Calculations for landed cost preview
  const basePurchaseTotal = quantity * costPrice;
  const totalLandedCost = basePurchaseTotal + Number(lorryFare || 0) + Number(otherCosts || 0);
  const unitLandedCost = quantity > 0 ? totalLandedCost / quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      alert('Please select a product from stock');
      return;
    }
    if (quantity <= 0) {
      alert('Quantity must be greater than zero');
      return;
    }

    addPurchase({
      date,
      supplier: supplier.trim() || 'General Wholesaler',
      productId,
      quantity,
      costPrice: Number(costPrice) || 0,
      lorryFare: Number(lorryFare) || 0,
      otherCosts: Number(otherCosts) || 0,
      notes: notes.trim(),
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, item: string) => {
    if (confirm(`Delete purchase record for "${item}"? Note: Stock will not be automatically decremented.`)) {
      deletePurchase(id);
    }
  };

  // Totals
  const totalLandedAll = purchases.reduce((acc, p) => acc + p.totalLandedCost, 0);
  const totalLorryFareAll = purchases.reduce((acc, p) => acc + p.lorryFare, 0);

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Purchases & Buying Costs (Lorry Fare)
          </h2>
          <p className="text-xs text-slate-500">
            Track buying cost, lorry fare, coolie & tolls to get true landed cost per unit
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Record Stock Purchase</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Purchases</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {formatCurrency(totalLandedAll, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-500">{purchases.length} stock restocks</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Total Lorry Fare Paid</span>
          <span className="text-xl font-black text-amber-700 mt-1 block">
            {formatCurrency(totalLorryFareAll, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-500">Transport & freight</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold uppercase text-slate-500 block">Auto-Stock Sync</span>
          <span className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Adds quantity to stock list</span>
          </span>
          <span className="text-[10px] text-slate-500">Updates unit cost to landed price</span>
        </div>
      </div>

      {/* Purchases History List */}
      <div className="space-y-2.5">
        {purchases.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 text-slate-500">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No purchases recorded yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "+ Record Stock Purchase" to log items bought, lorry fare, and coolie costs.
            </p>
          </div>
        ) : (
          purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      {purchase.productName}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      +{purchase.quantity} units added
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span>{purchase.date}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">Supplier: {purchase.supplier}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-slate-900 block">
                      {formatCurrency(purchase.totalLandedCost, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      {formatCurrency(purchase.unitLandedCost, settings.currencySymbol)} / unit landed
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(purchase.id, purchase.productName)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Buying Cost Breakdown */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-500 block">Base Item Cost</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(purchase.quantity * purchase.costPrice, settings.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-slate-600 block">({formatCurrency(purchase.costPrice, settings.currencySymbol)}/ea)</span>
                </div>

                <div className="bg-amber-50 p-2 rounded-lg">
                  <span className="text-amber-800 font-medium block">Lorry Fare</span>
                  <span className="font-bold text-amber-900">
                    {formatCurrency(purchase.lorryFare, settings.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-amber-800 block">Transport</span>
                </div>

                <div className="bg-blue-50 p-2 rounded-lg">
                  <span className="text-blue-800 font-medium block">Coolie / Toll / Other</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(purchase.otherCosts, settings.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-blue-800 block">Handling</span>
                </div>
              </div>

              {purchase.notes && (
                <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 px-2.5 py-1 rounded-md">
                  Note: {purchase.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          RECORD PURCHASE MODAL (With Lorry Fare & Other Buying Costs)
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Record Stock Purchase
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Purchase Date
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
                    Supplier / Market
                  </label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. Makola Market, Accra"
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Product Being Purchased *
                </label>
                {products.length === 0 ? (
                  <div className="p-2 bg-amber-50 text-amber-800 rounded-xl text-xs">
                    No products created yet. Please create a product in Stock first!
                  </div>
                ) : (
                  <select
                    value={productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current: {p.quantity} {p.unit})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Quantity Bought
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Unit Base Cost ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              {/* LORRY FARE & BUYING COSTS (Ghanaian business essential!) */}
              <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-300 space-y-2.5">
                <span className="text-xs font-black text-amber-950 uppercase block">
                  Transport & Additional Buying Costs
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">
                      Lorry Fare / Transport ({settings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={lorryFare}
                      onChange={(e) => setLorryFare(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 border border-amber-400 bg-white rounded-xl text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">
                      Coolie / Offloading / Tolls
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherCosts}
                      onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full py-2 px-3 border border-amber-400 bg-white rounded-xl text-sm font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Landed Cost Preview Card */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Base Items Purchase Cost:</span>
                  <span>{formatCurrency(basePurchaseTotal, settings.currencySymbol)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Lorry Fare + Extra:</span>
                  <span>+{formatCurrency(Number(lorryFare || 0) + Number(otherCosts || 0), settings.currencySymbol)}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-xs font-bold text-amber-300">Total Landed Cost:</span>
                  <span className="text-base font-black text-amber-400">
                    {formatCurrency(totalLandedCost, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400">True Cost Per Unit:</span>
                  <span className="font-black text-emerald-400">
                    {formatCurrency(unitLandedCost, settings.currencySymbol)} / unit
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notes / Truck Details (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Offloaded at Kumasi store, Driver Kwame"
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>CONFIRM & ADD TO STOCK</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
