import React, { useState, useEffect } from 'react';
import { Check, X, RotateCcw, Sun, Moon, Plus, Minus, Save } from 'lucide-react';
import {
  AttendanceStatus,
  MilkRecord,
  MilkSettings,
  calculateRecordMilkCost,
  calculateRecordTotalCost,
  calculateRecordTotalLiters,
} from '../utils/milkCalculations';

interface DayAttendanceEditorProps {
  selectedDate: string;
  record?: MilkRecord;
  settings: MilkSettings;
  onSaveRecord: (record: MilkRecord) => void;
  onClearRecord: (dateKey: string) => void;
}

export const DayAttendanceEditor: React.FC<DayAttendanceEditorProps> = ({
  selectedDate,
  record,
  settings,
  onSaveRecord,
  onClearRecord,
}) => {
  const [status, setStatus] = useState<AttendanceStatus>('purchased');
  const [morningLiters, setMorningLiters] = useState<number>(settings.defaultMorningLiters);
  const [eveningLiters, setEveningLiters] = useState<number>(settings.defaultEveningLiters);
  const [pricePerLiter, setPricePerLiter] = useState<number>(settings.defaultPricePerLiter);
  const [extraCost, setExtraCost] = useState<number>(0);
  const [extraNote, setExtraNote] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    if (record) {
      setStatus(record.status);
      setMorningLiters(
        record.status === 'purchased' ? record.morningLiters : settings.defaultMorningLiters
      );
      setEveningLiters(
        record.status === 'purchased' ? record.eveningLiters : settings.defaultEveningLiters
      );
      setPricePerLiter(record.pricePerLiter || settings.defaultPricePerLiter);
      setExtraCost(record.extraCost || 0);
      setExtraNote(record.extraNote || '');
      setNote(record.note || '');
    } else {
      setStatus('unmarked');
      setMorningLiters(settings.defaultMorningLiters);
      setEveningLiters(settings.defaultEveningLiters);
      setPricePerLiter(settings.defaultPricePerLiter);
      setExtraCost(0);
      setExtraNote('');
      setNote('');
    }
    setSavedFeedback(false);
  }, [selectedDate, record, settings]);

  const draftRecord: MilkRecord = {
    date: selectedDate,
    status: status === 'unmarked' ? 'purchased' : status,
    morningLiters: status === 'absent' ? 0 : morningLiters,
    eveningLiters: status === 'absent' ? 0 : eveningLiters,
    pricePerLiter,
    extraCost: status === 'absent' ? 0 : extraCost,
    extraNote: status === 'absent' ? '' : extraNote,
    note,
  };

  const totalLiters = calculateRecordTotalLiters(draftRecord);
  const milkCost = calculateRecordMilkCost(draftRecord);
  const totalCost = calculateRecordTotalCost(draftRecord);

  const handleStatusButton = (newStatus: AttendanceStatus) => {
    setStatus(newStatus);
    if (newStatus === 'unmarked') {
      onClearRecord(selectedDate);
      return;
    }
    const updated: MilkRecord = {
      date: selectedDate,
      status: newStatus,
      morningLiters: newStatus === 'purchased' ? morningLiters : 0,
      eveningLiters: newStatus === 'purchased' ? eveningLiters : 0,
      pricePerLiter,
      extraCost: newStatus === 'purchased' ? extraCost : 0,
      extraNote: newStatus === 'purchased' ? extraNote : '',
      note:
        newStatus === 'absent' && !note
          ? 'Skipped delivery (Absent)'
          : newStatus === 'purchased' && note === 'Skipped delivery (Absent)'
          ? ''
          : note,
    };
    onSaveRecord(updated);
    setSavedFeedback(true);
  };

  const adjustQuantity = (slot: 'morning' | 'evening', delta: number) => {
    const nextStatus: AttendanceStatus = 'purchased';
    setStatus(nextStatus);
    if (slot === 'morning') {
      const nextVal = Math.max(0, Number((morningLiters + delta).toFixed(2)));
      setMorningLiters(nextVal);
      onSaveRecord({
        ...draftRecord,
        status: nextStatus,
        morningLiters: nextVal,
      });
    } else {
      const nextVal = Math.max(0, Number((eveningLiters + delta).toFixed(2)));
      setEveningLiters(nextVal);
      onSaveRecord({
        ...draftRecord,
        status: nextStatus,
        eveningLiters: nextVal,
      });
    }
    setSavedFeedback(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStatus = status === 'unmarked' ? 'purchased' : status;
    setStatus(finalStatus);
    onSaveRecord({
      date: selectedDate,
      status: finalStatus,
      morningLiters: finalStatus === 'purchased' ? morningLiters : 0,
      eveningLiters: finalStatus === 'purchased' ? eveningLiters : 0,
      pricePerLiter,
      extraCost: finalStatus === 'purchased' ? extraCost : 0,
      extraNote: finalStatus === 'purchased' ? extraNote : '',
      note,
    });
    setSavedFeedback(true);
  };

  const formattedDateHeading = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  return (
    <aside
      aria-label="Daily Attendance and Price Editor"
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-medium text-slate-500">Selected Date</span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {formattedDateHeading}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Day Total</span>
          <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
            {settings.currencySymbol}
            {status === 'absent' || status === 'unmarked' ? '0.00' : totalCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Primary Attendance Toggle Buttons */}
      <div className="my-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Milk Attendance Status
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleStatusButton('purchased')}
            className={`min-h-[48px] px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap ${
              status === 'purchased'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Purchased</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusButton('absent')}
            className={`min-h-[48px] px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap ${
              status === 'absent'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/60 text-rose-900 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <X className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Absent</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusButton('unmarked')}
            className={`min-h-[48px] px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-all whitespace-nowrap ${
              status === 'unmarked'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {status !== 'absent' ? (
          <>
            {/* Morning & Evening Liters Steppers */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Morning Shift
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {settings.currencySymbol}
                      {(morningLiters * pricePerLiter).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Decrease Morning Liters"
                    onClick={() => adjustQuantity('morning', -0.25)}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    aria-label="Morning Milk Liters"
                    value={morningLiters}
                    onChange={(e) => setMorningLiters(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 min-h-[44px] text-center font-mono tabular-nums font-bold text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    aria-label="Increase Morning Liters"
                    onClick={() => adjustQuantity('morning', 0.25)}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Evening Shift
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {settings.currencySymbol}
                      {(eveningLiters * pricePerLiter).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Decrease Evening Liters"
                    onClick={() => adjustQuantity('evening', -0.25)}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    aria-label="Evening Milk Liters"
                    value={eveningLiters}
                    onChange={(e) => setEveningLiters(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 min-h-[44px] text-center font-mono tabular-nums font-bold text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    aria-label="Increase Evening Liters"
                    onClick={() => adjustQuantity('evening', 0.25)}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Rate & Extra Dairy Items */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label
                  htmlFor="day-rate-input"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Rate per Liter ({settings.currencySymbol})
                </label>
                <input
                  id="day-rate-input"
                  type="number"
                  step="0.5"
                  min="1"
                  value={pricePerLiter}
                  onChange={(e) => setPricePerLiter(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="day-extra-cost"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Extra Dairy ({settings.currencySymbol})
                </label>
                <input
                  id="day-extra-cost"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={extraCost}
                  onChange={(e) => setExtraCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3 font-mono tabular-nums text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {extraCost > 0 && (
              <div>
                <label
                  htmlFor="day-extra-note"
                  className="block text-xs font-medium text-slate-600 mb-1"
                >
                  Extra Item Name (e.g. Curd, Paneer, Ghee)
                </label>
                <input
                  id="day-extra-note"
                  type="text"
                  placeholder="e.g. Fresh Paneer 200g"
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  className="w-full min-h-[44px] px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 text-xs space-y-1">
            <p className="font-semibold">Marked Absent — No Milk Purchased</p>
            <p className="text-rose-700">
              0 Liters billed for {formattedDateHeading}. You save{' '}
              <span className="font-mono tabular-nums font-semibold">
                {settings.currencySymbol}
                {(
                  (settings.defaultMorningLiters + settings.defaultEveningLiters) *
                  settings.defaultPricePerLiter
                ).toFixed(2)}
              </span>{' '}
              on this skipped delivery.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="day-note-input"
            className="block text-xs font-medium text-slate-600 mb-1"
          >
            Delivery Note / Reason
          </label>
          <input
            id="day-note-input"
            type="text"
            placeholder={
              status === 'absent'
                ? 'e.g. Out of town / Vendor absent'
                : 'e.g. Guests at home, extra 0.5L'
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full min-h-[44px] px-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Summary breakdown line */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono tabular-nums">
          <span>
            Milk: {status === 'absent' ? '0' : totalLiters}L × {settings.currencySymbol}
            {pricePerLiter} = {settings.currencySymbol}
            {status === 'absent' ? '0.00' : milkCost.toFixed(2)}
          </span>
          {extraCost > 0 && status !== 'absent' && (
            <span>
              + Extra {settings.currencySymbol}
              {extraCost}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
        >
          <Save className="w-4 h-4" />
          <span>
            {savedFeedback
              ? 'Saved Entry'
              : `Save ${formattedDateHeading.split(',')[1]?.trim() || 'Day'} Entry`}
          </span>
        </button>
      </form>
    </aside>
  );
};
