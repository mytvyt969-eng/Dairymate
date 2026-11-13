/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Receipt,
  Settings,
  Check,
  X,
  Milk,
  Calculator,
  CalendarCheck,
  CalendarX,
} from 'lucide-react';
import {
  AttendanceStatus,
  MilkRecord,
  MilkSettings,
  TodayDateInfo,
  buildCalendarGrid,
  calculateMonthlySummary,
  calculateRecordTotalCost,
  calculateRecordTotalLiters,
  createInitialSeedData,
  createRecordFromDefaults,
  formatDateKey,
  getDaysInMonth,
  getMaxFillDayForMonth,
  getTodayDateInfo,
  parseDateKey,
} from './utils/milkCalculations';
import { AttendanceCalendar } from './components/AttendanceCalendar';
import { DayAttendanceEditor } from './components/DayAttendanceEditor';
import { MonthlyBillLedger } from './components/MonthlyBillLedger';
import { VendorRateSettings } from './components/VendorRateSettings';

const STORAGE_KEY_RECORDS = 'dairymate_records_v1';
const STORAGE_KEY_SETTINGS = 'dairymate_settings_v1';

const DEFAULT_SETTINGS: MilkSettings = {
  vendorName: 'Sharma Dairy Farm',
  vendorPhone: '+91 98765 43210',
  milkType: 'Farm Fresh A2 Buffalo Milk',
  currencySymbol: '₹',
  defaultPricePerLiter: 64,
  defaultMorningLiters: 1.5,
  defaultEveningLiters: 0.5,
};

export default function App() {
  const [todayInfo, setTodayInfo] = useState<TodayDateInfo>(() => getTodayDateInfo());
  const [activeTab, setActiveTab] = useState<'attendance' | 'ledger' | 'settings'>('attendance');
  const [currentYear, setCurrentYear] = useState<number>(() => todayInfo.year);
  const [currentMonth, setCurrentMonth] = useState<number>(() => todayInfo.month);
  const [selectedDate, setSelectedDate] = useState<string>(() => todayInfo.dateKey);
  const [quickMode, setQuickMode] = useState<'inspect' | 'mark_purchased' | 'mark_absent'>(
    'inspect'
  );

  // Keep todayInfo synced with the device clock when resuming app or crossing midnight
  useEffect(() => {
    const syncToday = () => {
      const latest = getTodayDateInfo();
      if (latest.dateKey === todayInfo.dateKey) return;
      const prevKey = todayInfo.dateKey;
      const prevYear = todayInfo.year;
      const prevMonth = todayInfo.month;
      setTodayInfo(latest);
      setSelectedDate((sel) => (sel === prevKey ? latest.dateKey : sel));
      if (currentYear === prevYear && currentMonth === prevMonth) {
        setCurrentYear(latest.year);
        setCurrentMonth(latest.month);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncToday();
      }
    };

    const intervalId = window.setInterval(syncToday, 60_000);
    window.addEventListener('focus', syncToday);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncToday);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [todayInfo, currentYear, currentMonth]);

  const [settings, setSettings] = useState<MilkSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_SETTINGS;
  });

  const [recordsMap, setRecordsMap] = useState<Record<string, MilkRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return createInitialSeedData(todayInfo.year, todayInfo.month, DEFAULT_SETTINGS, todayInfo.day);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(recordsMap));
    } catch {
      // ignore
    }
  }, [recordsMap]);

  const monthLabel = useMemo(() => {
    const dt = new Date(currentYear, currentMonth, 1);
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  const summary = useMemo(
    () => calculateMonthlySummary(currentYear, currentMonth, recordsMap, settings),
    [currentYear, currentMonth, recordsMap, settings]
  );

  const calendarCells = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth, recordsMap, todayInfo.dateKey),
    [currentYear, currentMonth, recordsMap, todayInfo.dateKey]
  );

  const todayRecord = recordsMap[todayInfo.dateKey];
  const todayStatus: AttendanceStatus = todayRecord?.status || 'unmarked';

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      const nextY = currentYear - 1;
      setCurrentYear(nextY);
      setCurrentMonth(11);
      setSelectedDate(formatDateKey(nextY, 11, 1));
    } else {
      const nextM = currentMonth - 1;
      setCurrentMonth(nextM);
      setSelectedDate(formatDateKey(currentYear, nextM, 1));
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      const nextY = currentYear + 1;
      setCurrentYear(nextY);
      setCurrentMonth(0);
      setSelectedDate(formatDateKey(nextY, 0, 1));
    } else {
      const nextM = currentMonth + 1;
      setCurrentMonth(nextM);
      setSelectedDate(formatDateKey(currentYear, nextM, 1));
    }
  };

  const handleSaveRecord = (record: MilkRecord) => {
    setRecordsMap((prev) => ({
      ...prev,
      [record.date]: record,
    }));
  };

  const handleClearRecord = (dateKey: string) => {
    setRecordsMap((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
  };

  const handleSelectDateOnCalendar = (dateKey: string) => {
    const { year, month } = parseDateKey(dateKey);
    if (year !== currentYear || month !== currentMonth) {
      setCurrentYear(year);
      setCurrentMonth(month);
    }
    setSelectedDate(dateKey);

    if (quickMode === 'mark_purchased') {
      const existing = recordsMap[dateKey];
      const nextRec = createRecordFromDefaults(dateKey, 'purchased', settings, {
        extraCost: existing?.extraCost || 0,
        extraNote: existing?.extraNote || '',
        note:
          existing?.note === 'Skipped delivery (Absent)' ? '' : existing?.note || '',
      });
      handleSaveRecord(nextRec);
    } else if (quickMode === 'mark_absent') {
      const nextRec = createRecordFromDefaults(dateKey, 'absent', settings);
      handleSaveRecord(nextRec);
    }
  };

  const handleQuickMarkToday = (status: 'purchased' | 'absent') => {
    const liveToday = getTodayDateInfo();
    setTodayInfo(liveToday);
    setCurrentYear(liveToday.year);
    setCurrentMonth(liveToday.month);
    setSelectedDate(liveToday.dateKey);
    const nextRec = createRecordFromDefaults(liveToday.dateKey, status, settings, {
      note:
        status === 'purchased'
          ? "Today's milk purchased"
          : 'Marked absent for today',
    });
    handleSaveRecord(nextRec);
  };

  const handleMarkAllUpToToday = () => {
    const liveToday = getTodayDateInfo();
    setTodayInfo(liveToday);
    const maxDay = getMaxFillDayForMonth(currentYear, currentMonth, liveToday);
    if (maxDay <= 0) return;

    setRecordsMap((prev) => {
      const next = { ...prev };
      for (let d = 1; d <= maxDay; d++) {
        const key = formatDateKey(currentYear, currentMonth, d);
        if (!next[key] || next[key].status === 'unmarked') {
          next[key] = createRecordFromDefaults(key, 'purchased', settings);
        }
      }
      return next;
    });
  };

  const handleUpdateSettings = (
    newSettings: MilkSettings,
    applyRateToCurrentMonth: boolean
  ) => {
    setSettings(newSettings);
    if (applyRateToCurrentMonth) {
      const totalDays = getDaysInMonth(currentYear, currentMonth);
      setRecordsMap((prev) => {
        const next = { ...prev };
        for (let d = 1; d <= totalDays; d++) {
          const key = formatDateKey(currentYear, currentMonth, d);
          if (next[key]) {
            next[key] = {
              ...next[key],
              pricePerLiter: newSettings.defaultPricePerLiter,
            };
          }
        }
        return next;
      });
    }
  };

  const handleResetDemoData = () => {
    const liveToday = getTodayDateInfo();
    setTodayInfo(liveToday);
    const seeded = createInitialSeedData(liveToday.year, liveToday.month, settings, liveToday.day);
    setRecordsMap(seeded);
    setCurrentYear(liveToday.year);
    setCurrentMonth(liveToday.month);
    setSelectedDate(liveToday.dateKey);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 pb-20 md:pb-8">
      {/* Top Bar: Clean Brand + Primary Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 h-14 flex items-center justify-between gap-8">
        {/* Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('attendance');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          DairyMate
        </a>

        {/* Clean single-line navigation links (Desktop) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'attendance'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Attendance Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'ledger'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Monthly Bill & Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Rate & Vendor
          </button>
        </nav>

        {/* Right indicator: active vendor & rate */}
        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono tabular-nums min-w-0 max-w-[200px] sm:max-w-none">
          <span className="truncate">{settings.vendorName}</span>
          <span aria-hidden="true" className="shrink-0">·</span>
          <span className="whitespace-nowrap shrink-0">
            {settings.currencySymbol}
            {settings.defaultPricePerLiter}/L
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-5 space-y-6">
        {/* Active Workspace View */}
        {activeTab === 'attendance' && (
          <>
            {/* Today's Quick Attendance Banner */}
            <section
              aria-label="Today's Milk Attendance Quick Action"
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    todayStatus === 'purchased'
                      ? 'bg-emerald-100 text-emerald-700'
                      : todayStatus === 'absent'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Milk className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    Today · {todayInfo.formattedLabel}
                  </div>
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {todayStatus === 'purchased' && todayRecord ? (
                      <>
                        Today Marked{' '}
                        <span className="text-emerald-700">Purchased (Present)</span> —{' '}
                        <span className="font-mono tabular-nums">
                          {calculateRecordTotalLiters(todayRecord)}L (
                          {settings.currencySymbol}
                          {calculateRecordTotalCost(todayRecord).toFixed(2)})
                        </span>
                      </>
                    ) : todayStatus === 'absent' ? (
                      <>
                        Today Marked <span className="text-rose-700">Absent (Skipped)</span> —{' '}
                        <span className="font-mono tabular-nums">{settings.currencySymbol}0.00</span>
                      </>
                    ) : (
                      <>Today&apos;s Milk Attendance is Unmarked</>
                    )}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleQuickMarkToday('purchased')}
                  className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                    todayStatus === 'purchased'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Milk Purchased Today</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickMarkToday('absent')}
                  className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                    todayStatus === 'absent'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Absent Today</span>
                </button>
              </div>
            </section>

            {/* 4-Column Monthly KPI Summary Strip */}
            <section
              aria-label="Monthly Milk & Attendance Metrics"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {/* Metric 1: Purchased Days */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Purchased Days</span>
                  <CalendarCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    data-testid="kpi-purchased-days"
                    className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700"
                  >
                    {summary.purchasedDays}
                  </span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    / {summary.totalDaysInMonth} days
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  {summary.attendanceRatePercent}% attendance rate
                </p>
              </div>

              {/* Metric 2: Absent Days */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Absent Days</span>
                  <CalendarX className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    data-testid="kpi-absent-days"
                    className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-rose-700"
                  >
                    {summary.absentDays}
                  </span>
                  <span className="text-xs text-slate-500">skipped</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  Saved {settings.currencySymbol}
                  {summary.savedOnAbsentDaysCost.toFixed(0)} on absent days
                </p>
              </div>

              {/* Metric 3: Total Milk Quantity */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Total Milk Quantity</span>
                  <Milk className="w-4 h-4 text-sky-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    data-testid="kpi-total-liters"
                    className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900"
                  >
                    {summary.totalLiters}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Liters</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  {summary.totalMorningLiters}L Morn · {summary.totalEveningLiters}L Eve
                </p>
              </div>

              {/* Metric 4: Total Payable Bill */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Total {monthLabel.split(' ')[0]} Bill</span>
                  <Calculator className="w-4 h-4 text-slate-700" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    data-testid="kpi-total-bill"
                    className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900"
                  >
                    {settings.currencySymbol}
                    {summary.grandTotalCost.toFixed(0)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    @ {settings.currencySymbol}
                    {settings.defaultPricePerLiter}/L
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  Milk {settings.currencySymbol}
                  {summary.totalMilkCost.toFixed(0)}
                  {summary.totalExtraCost > 0
                    ? ` + Extra ${settings.currencySymbol}${summary.totalExtraCost.toFixed(0)}`
                    : ''}
                </p>
              </div>
            </section>

            {/* Calendar + Day Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <AttendanceCalendar
                  year={currentYear}
                  month={currentMonth}
                  monthLabel={monthLabel}
                  cells={calendarCells}
                  selectedDate={selectedDate}
                  quickMode={quickMode}
                  settings={settings}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onSelectDate={handleSelectDateOnCalendar}
                  onQuickModeChange={setQuickMode}
                  onMarkAllUpToToday={handleMarkAllUpToToday}
                />
              </div>

              <div className="lg:col-span-4">
                <DayAttendanceEditor
                  selectedDate={selectedDate}
                  record={recordsMap[selectedDate]}
                  settings={settings}
                  onSaveRecord={handleSaveRecord}
                  onClearRecord={handleClearRecord}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'ledger' && (
          <MonthlyBillLedger
            year={currentYear}
            month={currentMonth}
            monthLabel={monthLabel}
            summary={summary}
            recordsMap={recordsMap}
            settings={settings}
            onSelectDateInCalendar={(dateKey) => {
              setSelectedDate(dateKey);
              setActiveTab('attendance');
            }}
          />
        )}

        {activeTab === 'settings' && (
          <VendorRateSettings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Tab Bar for Android / Mobile Viewports (< md) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3 items-center h-14 px-2"
      >
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'attendance'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
            Attendance
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'ledger'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
            Monthly Bill
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'settings'
              ? 'text-emerald-700 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
            Milk Price
          </span>
        </button>
      </nav>
    </div>
  );
}
