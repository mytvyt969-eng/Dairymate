import React, { useState } from 'react';
import { Check, X, Download, Copy, CheckCheck, Calculator } from 'lucide-react';
import {
  AttendanceStatus,
  MilkRecord,
  MilkSettings,
  MonthlySummary,
  calculateRecordMilkCost,
  calculateRecordTotalCost,
  calculateRecordTotalLiters,
  formatDateKey,
  generateCSVExport,
  generateWhatsAppBillText,
} from '../utils/milkCalculations';

interface MonthlyBillLedgerProps {
  year: number;
  month: number;
  monthLabel: string;
  summary: MonthlySummary;
  recordsMap: Record<string, MilkRecord>;
  settings: MilkSettings;
  onSelectDateInCalendar: (dateKey: string) => void;
}

export const MonthlyBillLedger: React.FC<MonthlyBillLedgerProps> = ({
  year,
  month,
  monthLabel,
  summary,
  recordsMap,
  settings,
  onSelectDateInCalendar,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'purchased' | 'absent'>('all');
  const [copiedBill, setCopiedBill] = useState(false);

  // Build list of logged or all days for the month
  const rows: Array<{
    dateKey: string;
    dayNum: number;
    weekday: string;
    status: AttendanceStatus;
    record?: MilkRecord;
  }> = [];

  for (let d = 1; d <= summary.totalDaysInMonth; d++) {
    const dateKey = formatDateKey(year, month, d);
    const rec = recordsMap[dateKey];
    const status: AttendanceStatus = rec?.status || 'unmarked';
    if (filterStatus === 'purchased' && status !== 'purchased') continue;
    if (filterStatus === 'absent' && status !== 'absent') continue;
    // In 'all' mode, show days that have a record (purchased or absent) so the ledger is scannable
    if (filterStatus === 'all' && status === 'unmarked') continue;

    const dt = new Date(year, month, d);
    const weekday = dt.toLocaleDateString('en-US', { weekday: 'short' });
    rows.push({ dateKey, dayNum: d, weekday, status, record: rec });
  }

  const handleCopyBill = async () => {
    const text = generateWhatsAppBillText(summary, settings, monthLabel);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBill(true);
      setTimeout(() => setCopiedBill(false), 2500);
    } catch {
      setCopiedBill(true);
      setTimeout(() => setCopiedBill(false), 2500);
    }
  };

  const handleDownloadCSV = () => {
    const csv = generateCSVExport(year, month, recordsMap);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DairyMate_${monthLabel.replace(/\s+/g, '_')}_Ledger.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Monthly Statement & Calculation Card */}
      <section
        aria-label="Monthly Milk Bill Calculation"
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-medium text-slate-500">
              {settings.vendorName} · {settings.milkType}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {monthLabel} Bill & Attendance Summary
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBill}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedBill ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>Copied WhatsApp Bill</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Bill Statement</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Formula & Breakdown Grid (Single-Elevation Depth with Hairline Dividers) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5 pt-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="pt-3 md:pt-0 md:pr-6">
            <span className="text-xs font-medium text-slate-500">Attendance Breakdown</span>
            <div className="mt-2.5 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Purchased Days
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {summary.purchasedDays} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-800 font-medium flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 text-rose-600" />
                  Absent Days
                </span>
                <span className="font-mono tabular-nums font-bold text-rose-700">
                  {summary.absentDays} days
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                <span>Unmarked Days</span>
                <span className="font-mono tabular-nums">{summary.unmarkedDays} days</span>
              </div>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:px-6">
            <span className="text-xs font-medium text-slate-500">Milk Volume Delivered</span>
            <div className="mt-2.5 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Morning Shift</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {summary.totalMorningLiters} L
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Evening Shift</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {summary.totalEveningLiters} L
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pt-1.5 border-t border-slate-100">
                <span>Total Quantity</span>
                <span className="font-mono tabular-nums">{summary.totalLiters} Liters</span>
              </div>
            </div>
          </div>

          <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                Net Payable Amount ({monthLabel})
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                {settings.currencySymbol}
                {summary.grandTotalCost.toFixed(2)}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between font-mono tabular-nums">
              <span>
                Milk: {settings.currencySymbol}
                {summary.totalMilkCost.toFixed(0)} + Extra: {settings.currencySymbol}
                {summary.totalExtraCost.toFixed(0)}
              </span>
              <span className="text-emerald-700 font-semibold">
                Saved: {settings.currencySymbol}
                {summary.savedOnAbsentDaysCost.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Day-by-Day Attendance & Price Ledger Table */}
      <section
        aria-label="Day-by-Day Attendance Log"
        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Daily Attendance & Price Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {rows.length} logged entries for {monthLabel}
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div
            role="group"
            aria-label="Filter ledger by attendance status"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
          >
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`min-h-[38px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Logged ({summary.purchasedDays + summary.absentDays})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('purchased')}
              className={`min-h-[38px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'purchased'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Purchased ({summary.purchasedDays})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('absent')}
              className={`min-h-[38px] px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                filterStatus === 'absent'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Absent ({summary.absentDays})
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <Calculator className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              No attendance entries match this filter
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Tap any date on the calendar to mark milk as Purchased or Absent.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                  <th className="py-2.5 pr-3">Date</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3 text-right">Morning</th>
                  <th className="py-2.5 px-3 text-right">Evening</th>
                  <th className="py-2.5 px-3 text-right">Total L</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 pl-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {rows.map(({ dateKey, dayNum, weekday, status, record }) => {
                  const liters = record ? calculateRecordTotalLiters(record) : 0;
                  const amount = record ? calculateRecordTotalCost(record) : 0;

                  return (
                    <tr
                      key={dateKey}
                      onClick={() => onSelectDateInCalendar(dateKey)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-3 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {String(dayNum).padStart(2, '0')} {weekday}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {status === 'purchased' ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            Purchased
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700">
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {status === 'purchased' && record ? `${record.morningLiters}L` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {status === 'purchased' && record ? `${record.eveningLiters}L` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {status === 'purchased' ? `${liters}L` : '0L'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                        {settings.currencySymbol}
                        {record?.pricePerLiter || settings.defaultPricePerLiter}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {settings.currencySymbol}
                        {amount.toFixed(2)}
                      </td>
                      <td className="py-3 pl-3 text-xs text-slate-500 max-w-[200px] truncate">
                        {record?.extraCost
                          ? `+${settings.currencySymbol}${record.extraCost} (${
                              record.extraNote || 'Extra'
                            }) ${record.note || ''}`
                          : record?.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
