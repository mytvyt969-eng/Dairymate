import React from 'react';
import { Check, X, ChevronLeft, ChevronRight, Sun, Moon, RotateCcw } from 'lucide-react';
import {
  AttendanceStatus,
  CalendarCell,
  MilkRecord,
  MilkSettings,
  calculateRecordTotalCost,
  calculateRecordTotalLiters,
} from '../utils/milkCalculations';

interface AttendanceCalendarProps {
  year: number;
  month: number;
  monthLabel: string;
  cells: CalendarCell[];
  selectedDate: string;
  quickMode: 'inspect' | 'mark_purchased' | 'mark_absent';
  settings: MilkSettings;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
  onQuickModeChange: (mode: 'inspect' | 'mark_purchased' | 'mark_absent') => void;
  onMarkAllUpToToday: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  monthLabel,
  cells,
  selectedDate,
  quickMode,
  settings,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onQuickModeChange,
  onMarkAllUpToToday,
}) => {
  return (
    <section
      aria-label="Milk Attendance Calendar"
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs"
    >
      {/* Calendar Header & Month Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {monthLabel} Attendance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tap any date to inspect or toggle milk purchased vs. absent status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Previous Month"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 text-sm font-semibold text-slate-900 font-mono tabular-nums whitespace-nowrap">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Next Month"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tap Action Mode Selector (Segmented Control) */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-4">
        <div
          role="group"
          aria-label="Calendar tap mode"
          className="grid grid-cols-3 sm:inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={() => onQuickModeChange('inspect')}
            className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center whitespace-nowrap shrink-0 ${
              quickMode === 'inspect'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Edit Details
          </button>
          <button
            type="button"
            onClick={() => onQuickModeChange('mark_purchased')}
            className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
              quickMode === 'mark_purchased'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Present</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickModeChange('mark_absent')}
            className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
              quickMode === 'mark_absent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-3.5 h-3.5 shrink-0" />
            <span>Absent</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onMarkAllUpToToday}
          className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          Fill Unmarked Days till Today
        </button>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-xs font-semibold text-slate-500 py-1.5"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 7-Column Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {cells.map((cell) => {
          const rec: MilkRecord | undefined = cell.record;
          const status: AttendanceStatus = rec?.status || 'unmarked';
          const isSelected = cell.date === selectedDate;
          const liters = rec ? calculateRecordTotalLiters(rec) : 0;
          const cost = rec ? calculateRecordTotalCost(rec) : 0;

          let bgClasses = 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100';
          if (!cell.isCurrentMonth) {
            bgClasses = 'bg-slate-50/30 border-slate-100 text-slate-400 opacity-55';
          } else if (status === 'purchased') {
            bgClasses =
              'bg-emerald-50/90 border-emerald-300 text-emerald-950 hover:bg-emerald-100/80';
          } else if (status === 'absent') {
            bgClasses =
              'bg-rose-50/90 border-rose-300 text-rose-950 hover:bg-rose-100/80';
          }

          const ringClasses = isSelected
            ? 'ring-2 ring-slate-900 ring-offset-1 z-10'
            : cell.isToday
            ? 'ring-2 ring-sky-500/80'
            : '';

          const statusLabel =
            status === 'purchased'
              ? `Purchased ${liters}L (${settings.currencySymbol}${cost})`
              : status === 'absent'
              ? 'Absent'
              : 'Unmarked';

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              aria-label={`Date ${cell.date}, ${statusLabel}`}
              aria-pressed={isSelected}
              className={`relative min-h-[68px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between text-left transition-all active:scale-[0.98] ${bgClasses} ${ringClasses}`}
            >
              {/* Top row: Day number + Status Icon */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                    cell.isToday
                      ? 'underline decoration-2 underline-offset-2'
                      : ''
                  }`}
                >
                  {cell.dayOfMonth}
                </span>

                {status === 'purchased' && (
                  <span
                    className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0"
                    title="Milk Purchased (Present)"
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>
                )}

                {status === 'absent' && (
                  <span
                    className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center shrink-0"
                    title="Milk Absent (Skipped)"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </span>
                )}
              </div>

              {/* Middle/Bottom info: Liters & Price or Absent label */}
              <div className="mt-1 w-full">
                {status === 'purchased' && rec ? (
                  <div className="space-y-0.5">
                    <div className="text-[11px] sm:text-xs font-bold font-mono tabular-nums text-emerald-900 leading-tight truncate">
                      {liters}L
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-emerald-700 leading-tight truncate">
                      {settings.currencySymbol}
                      {cost}
                    </div>
                  </div>
                ) : status === 'absent' ? (
                  <div className="space-y-0.5">
                    <div className="text-[10px] sm:text-[11px] font-semibold text-rose-700 leading-tight truncate">
                      Absent
                    </div>
                    <div className="text-[10px] font-mono tabular-nums text-rose-600/80 leading-tight">
                      {settings.currencySymbol}0
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 font-medium leading-tight">
                    Tap
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Clean Legend with explicit text & icons (no decorative dots) */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
            <span className="w-4 h-4 rounded bg-emerald-600 text-white inline-flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[2.5]" />
            </span>
            Purchased (Present)
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-rose-800">
            <span className="w-4 h-4 rounded bg-rose-600 text-white inline-flex items-center justify-center">
              <X className="w-2.5 h-2.5 stroke-[2.5]" />
            </span>
            Absent (No Delivery)
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <RotateCcw className="w-3.5 h-3.5" />
            Unmarked
          </span>
        </div>

        <div className="text-xs text-slate-500 font-mono tabular-nums">
          Standard Rate: {settings.currencySymbol}{settings.defaultPricePerLiter}/L
        </div>
      </div>
    </section>
  );
};
