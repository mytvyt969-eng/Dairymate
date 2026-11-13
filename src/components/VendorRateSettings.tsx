import React, { useState } from 'react';
import { Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { MilkSettings } from '../utils/milkCalculations';

interface VendorRateSettingsProps {
  settings: MilkSettings;
  onUpdateSettings: (newSettings: MilkSettings, applyRateToCurrentMonth: boolean) => void;
  onResetDemoData: () => void;
}

export const VendorRateSettings: React.FC<VendorRateSettingsProps> = ({
  settings,
  onUpdateSettings,
  onResetDemoData,
}) => {
  const [vendorName, setVendorName] = useState(settings.vendorName);
  const [vendorPhone, setVendorPhone] = useState(settings.vendorPhone);
  const [milkType, setMilkType] = useState(settings.milkType);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [defaultPricePerLiter, setDefaultPricePerLiter] = useState(settings.defaultPricePerLiter);
  const [defaultMorningLiters, setDefaultMorningLiters] = useState(settings.defaultMorningLiters);
  const [defaultEveningLiters, setDefaultEveningLiters] = useState(settings.defaultEveningLiters);
  const [applyToCurrentMonth, setApplyToCurrentMonth] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      setErrorMsg('Please enter a valid vendor or dairy name.');
      return;
    }
    if (isNaN(defaultPricePerLiter) || defaultPricePerLiter <= 0) {
      setErrorMsg('Price per liter must be greater than 0.');
      return;
    }
    setErrorMsg('');

    onUpdateSettings(
      {
        vendorName: vendorName.trim(),
        vendorPhone: vendorPhone.trim(),
        milkType: milkType.trim() || 'Fresh Dairy Milk',
        currencySymbol: currencySymbol.trim() || '₹',
        defaultPricePerLiter: Number(defaultPricePerLiter),
        defaultMorningLiters: Math.max(0, Number(defaultMorningLiters)),
        defaultEveningLiters: Math.max(0, Number(defaultEveningLiters)),
      },
      applyToCurrentMonth
    );

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <section
        aria-label="Milk Price and Vendor Settings"
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Milk Price & Default Quantity Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure your daily milk rate per liter, default morning/evening liters, and vendor profile
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-emerald-700 font-semibold">
            Daily default: {currencySymbol}
            {((defaultMorningLiters + defaultEveningLiters) * defaultPricePerLiter).toFixed(2)}/day
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800"
            >
              {errorMsg}
            </div>
          )}

          {savedSuccess && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Milk price and default delivery settings updated.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-price-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Milk Price per Liter ({currencySymbol})
              </label>
              <input
                id="settings-price-input"
                type="number"
                step="0.5"
                min="1"
                value={defaultPricePerLiter}
                onChange={(e) => setDefaultPricePerLiter(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3 font-mono tabular-nums font-bold text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="settings-currency-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Currency Symbol
              </label>
              <select
                id="settings-currency-input"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full min-h-[44px] px-3 text-sm font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="Rs ">Rs (PKR / NPR / LKR)</option>
                <option value="$">$ (USD / AUD / CAD)</option>
                <option value="£">£ (GBP)</option>
                <option value="€">€ (EUR)</option>
                <option value="AED ">AED (UAE Dirham)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-morning-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Default Morning Quantity (Liters)
              </label>
              <input
                id="settings-morning-input"
                type="number"
                step="0.25"
                min="0"
                max="20"
                value={defaultMorningLiters}
                onChange={(e) => setDefaultMorningLiters(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="settings-evening-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Default Evening Quantity (Liters)
              </label>
              <input
                id="settings-evening-input"
                type="number"
                step="0.25"
                min="0"
                max="20"
                value={defaultEveningLiters}
                onChange={(e) => setDefaultEveningLiters(parseFloat(e.target.value) || 0)}
                className="w-full min-h-[44px] px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label
                htmlFor="settings-vendor-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Milkman / Dairy Vendor Name
              </label>
              <input
                id="settings-vendor-name"
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full min-h-[44px] px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="settings-milk-type"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Milk Type / Category
              </label>
              <input
                id="settings-milk-type"
                type="text"
                value={milkType}
                onChange={(e) => setMilkType(e.target.value)}
                className="w-full min-h-[44px] px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-vendor-phone"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Vendor Phone / WhatsApp Number
            </label>
            <input
              id="settings-vendor-phone"
              type="text"
              value={vendorPhone}
              onChange={(e) => setVendorPhone(e.target.value)}
              className="w-full min-h-[44px] px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToCurrentMonth}
              onChange={(e) => setApplyToCurrentMonth(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs text-slate-700 font-medium">
              Also update rate per liter ({currencySymbol}
              {defaultPricePerLiter}/L) for existing entries in the current month
            </span>
          </label>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Rate & Defaults</span>
            </button>

            <button
              type="button"
              onClick={onResetDemoData}
              className="min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Sample Month Data</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
