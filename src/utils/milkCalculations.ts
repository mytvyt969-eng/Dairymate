export type AttendanceStatus = 'purchased' | 'absent' | 'unmarked';

export interface MilkRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  morningLiters: number;
  eveningLiters: number;
  pricePerLiter: number;
  extraCost: number; // e.g., curd, paneer, ghee on that day
  extraNote: string;
  note: string;
}

export interface MilkSettings {
  vendorName: string;
  vendorPhone: string;
  milkType: string; // e.g. "Buffalo A2 Milk", "Cow Fresh Milk"
  currencySymbol: string;
  defaultPricePerLiter: number;
  defaultMorningLiters: number;
  defaultEveningLiters: number;
}

export interface MonthlySummary {
  year: number;
  month: number; // 0-indexed (0 = Jan, 10 = Nov)
  totalDaysInMonth: number;
  purchasedDays: number;
  absentDays: number;
  unmarkedDays: number;
  attendanceRatePercent: number; // purchasedDays / (purchasedDays + absentDays) * 100
  totalMorningLiters: number;
  totalEveningLiters: number;
  totalLiters: number;
  totalMilkCost: number;
  totalExtraCost: number;
  grandTotalCost: number;
  averageDailyLiters: number;
  savedOnAbsentDaysCost: number;
}

export interface CalendarCell {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  record?: MilkRecord;
}

export interface TodayDateInfo {
  year: number;
  month: number; // 0-indexed
  day: number;
  dateKey: string; // YYYY-MM-DD
  formattedLabel: string; // e.g. "Nov 13, 2026"
}

export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function getTodayDateInfo(now: Date = new Date()): TodayDateInfo {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const dateKey = formatDateKey(year, month, day);
  const formattedLabel = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return { year, month, day, dateKey, formattedLabel };
}

export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateKey.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMaxFillDayForMonth(
  year: number,
  month: number,
  today: TodayDateInfo
): number {
  if (year < today.year || (year === today.year && month < today.month)) {
    return getDaysInMonth(year, month);
  }
  if (year === today.year && month === today.month) {
    return today.day;
  }
  return 0;
}

export function calculateRecordTotalLiters(record: MilkRecord): number {
  if (record.status !== 'purchased') return 0;
  return Math.max(0, Number((record.morningLiters + record.eveningLiters).toFixed(2)));
}

export function calculateRecordMilkCost(record: MilkRecord): number {
  if (record.status !== 'purchased') return 0;
  const liters = calculateRecordTotalLiters(record);
  return Math.max(0, Number((liters * record.pricePerLiter).toFixed(2)));
}

export function calculateRecordTotalCost(record: MilkRecord): number {
  if (record.status !== 'purchased') return 0;
  const milkCost = calculateRecordMilkCost(record);
  const extra = Math.max(0, record.extraCost || 0);
  return Number((milkCost + extra).toFixed(2));
}

export function createRecordFromDefaults(
  date: string,
  status: AttendanceStatus,
  settings: MilkSettings,
  overrides?: Partial<MilkRecord>
): MilkRecord {
  const isPurchased = status === 'purchased';
  return {
    date,
    status,
    morningLiters: isPurchased ? settings.defaultMorningLiters : 0,
    eveningLiters: isPurchased ? settings.defaultEveningLiters : 0,
    pricePerLiter: settings.defaultPricePerLiter,
    extraCost: 0,
    extraNote: '',
    note: status === 'absent' ? 'Skipped delivery (Absent)' : '',
    ...overrides,
  };
}

export function cycleAttendanceStatus(current: AttendanceStatus): AttendanceStatus {
  if (current === 'unmarked') return 'purchased';
  if (current === 'purchased') return 'absent';
  return 'unmarked';
}

export function calculateMonthlySummary(
  year: number,
  month: number,
  recordsMap: Record<string, MilkRecord>,
  settings: MilkSettings
): MonthlySummary {
  const totalDaysInMonth = getDaysInMonth(year, month);
  let purchasedDays = 0;
  let absentDays = 0;
  let unmarkedDays = 0;
  let totalMorningLiters = 0;
  let totalEveningLiters = 0;
  let totalMilkCost = 0;
  let totalExtraCost = 0;

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const key = formatDateKey(year, month, day);
    const rec = recordsMap[key];
    if (!rec || rec.status === 'unmarked') {
      unmarkedDays++;
    } else if (rec.status === 'absent') {
      absentDays++;
    } else if (rec.status === 'purchased') {
      purchasedDays++;
      totalMorningLiters += rec.morningLiters;
      totalEveningLiters += rec.eveningLiters;
      totalMilkCost += calculateRecordMilkCost(rec);
      totalExtraCost += Math.max(0, rec.extraCost || 0);
    }
  }

  const totalLiters = Number((totalMorningLiters + totalEveningLiters).toFixed(2));
  totalMorningLiters = Number(totalMorningLiters.toFixed(2));
  totalEveningLiters = Number(totalEveningLiters.toFixed(2));
  totalMilkCost = Number(totalMilkCost.toFixed(2));
  totalExtraCost = Number(totalExtraCost.toFixed(2));
  const grandTotalCost = Number((totalMilkCost + totalExtraCost).toFixed(2));

  const loggedDays = purchasedDays + absentDays;
  const attendanceRatePercent =
    loggedDays > 0 ? Math.round((purchasedDays / loggedDays) * 100) : 0;

  const averageDailyLiters =
    purchasedDays > 0 ? Number((totalLiters / purchasedDays).toFixed(2)) : 0;

  const defaultDailyLiters = settings.defaultMorningLiters + settings.defaultEveningLiters;
  const savedOnAbsentDaysCost = Number(
    (absentDays * defaultDailyLiters * settings.defaultPricePerLiter).toFixed(2)
  );

  return {
    year,
    month,
    totalDaysInMonth,
    purchasedDays,
    absentDays,
    unmarkedDays,
    attendanceRatePercent,
    totalMorningLiters,
    totalEveningLiters,
    totalLiters,
    totalMilkCost,
    totalExtraCost,
    grandTotalCost,
    averageDailyLiters,
    savedOnAbsentDaysCost,
  };
}

export function buildCalendarGrid(
  year: number,
  month: number,
  recordsMap: Record<string, MilkRecord>,
  todayDateKey: string
): CalendarCell[] {
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  const cells: CalendarCell[] = [];

  // Leading days from previous month
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const dateKey = formatDateKey(prevYear, prevMonth, d);
    cells.push({
      date: dateKey,
      dayOfMonth: d,
      isCurrentMonth: false,
      isToday: dateKey === todayDateKey,
      record: recordsMap[dateKey],
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = formatDateKey(year, month, d);
    cells.push({
      date: dateKey,
      dayOfMonth: d,
      isCurrentMonth: true,
      isToday: dateKey === todayDateKey,
      record: recordsMap[dateKey],
    });
  }

  // Trailing days to complete 35 or 42 cells
  const totalSlots = cells.length <= 35 ? 35 : 42;
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  let nextDay = 1;
  while (cells.length < totalSlots) {
    const dateKey = formatDateKey(nextYear, nextMonth, nextDay);
    cells.push({
      date: dateKey,
      dayOfMonth: nextDay,
      isCurrentMonth: false,
      isToday: dateKey === todayDateKey,
      record: recordsMap[dateKey],
    });
    nextDay++;
  }

  return cells;
}

export function generateWhatsAppBillText(
  summary: MonthlySummary,
  settings: MilkSettings,
  monthLabel: string
): string {
  const cur = settings.currencySymbol;
  const lines = [
    `*DairyMate Monthly Milk Statement*`,
    `Month: ${monthLabel}`,
    `Vendor: ${settings.vendorName} (${settings.milkType})`,
    `--------------------------------`,
    ` Attendance Summary:`,
    `• Purchased Days: ${summary.purchasedDays} days`,
    `• Absent (Skipped) Days: ${summary.absentDays} days`,
    `• Unmarked Days: ${summary.unmarkedDays} days`,
    `--------------------------------`,
    ` Quantity & Rate:`,
    `• Morning Milk: ${summary.totalMorningLiters} L`,
    `• Evening Milk: ${summary.totalEveningLiters} L`,
    `• Total Milk Quantity: ${summary.totalLiters} L`,
    `• Standard Rate: ${cur}${settings.defaultPricePerLiter}/L`,
    `--------------------------------`,
    ` Billing Breakdown:`,
    `• Milk Amount: ${cur}${summary.totalMilkCost.toFixed(2)}`,
  ];

  if (summary.totalExtraCost > 0) {
    lines.push(`• Extra Dairy Items: ${cur}${summary.totalExtraCost.toFixed(2)}`);
  }

  lines.push(
    `• *Grand Total Payable: ${cur}${summary.grandTotalCost.toFixed(2)}*`,
    `*(Saved ${cur}${summary.savedOnAbsentDaysCost.toFixed(2)} on ${summary.absentDays} absent days)*`
  );

  return lines.join('\n');
}

export function generateCSVExport(
  year: number,
  month: number,
  recordsMap: Record<string, MilkRecord>
): string {
  const totalDays = getDaysInMonth(year, month);
  const headers = [
    'Date',
    'Status',
    'Morning Liters',
    'Evening Liters',
    'Total Liters',
    'Price Per Liter',
    'Milk Cost',
    'Extra Cost',
    'Total Cost',
    'Notes',
  ];

  const rows = [headers.join(',')];

  for (let d = 1; d <= totalDays; d++) {
    const key = formatDateKey(year, month, d);
    const rec = recordsMap[key];
    if (!rec || rec.status === 'unmarked') {
      rows.push(`${key},Unmarked,0,0,0,0,0,0,0,""`);
    } else {
      const totalL = calculateRecordTotalLiters(rec);
      const milkCost = calculateRecordMilkCost(rec);
      const totalCost = calculateRecordTotalCost(rec);
      const safeNote = (rec.note || rec.extraNote || '').replace(/"/g, '""');
      const statusLabel = rec.status === 'purchased' ? 'Purchased' : 'Absent';
      rows.push(
        `${key},${statusLabel},${rec.morningLiters},${rec.eveningLiters},${totalL},${rec.pricePerLiter},${milkCost},${rec.extraCost || 0},${totalCost},"${safeNote}"`
      );
    }
  }

  return rows.join('\n');
}

export function createInitialSeedData(
  year: number,
  month: number,
  settings: MilkSettings,
  maxDay: number = 11
): Record<string, MilkRecord> {
  const map: Record<string, MilkRecord> = {};
  // Seed up to maxDay of the current month with realistic purchased and absent days
  const samplePattern: Array<{
    day: number;
    status: AttendanceStatus;
    morning: number;
    evening: number;
    extraCost?: number;
    extraNote?: string;
    note?: string;
  }> = [
    { day: 1, status: 'purchased', morning: 1.5, evening: 0.5, note: 'Regular delivery' },
    { day: 2, status: 'purchased', morning: 1.5, evening: 0.5 },
    { day: 3, status: 'purchased', morning: 2.0, evening: 0.5, extraCost: 40, extraNote: 'Fresh Curd 500g', note: 'Guests at home (+0.5L morning)' },
    { day: 4, status: 'absent', morning: 0, evening: 0, note: 'Out of station — skipped milk' },
    { day: 5, status: 'absent', morning: 0, evening: 0, note: 'Out of station — skipped milk' },
    { day: 6, status: 'purchased', morning: 1.5, evening: 0.5 },
    { day: 7, status: 'purchased', morning: 1.5, evening: 0.5 },
    { day: 8, status: 'purchased', morning: 1.5, evening: 0, note: 'Skipped evening slot' },
    { day: 9, status: 'absent', morning: 0, evening: 0, note: 'Vendor holiday / Absent' },
    { day: 10, status: 'purchased', morning: 1.5, evening: 0.5, extraCost: 90, extraNote: 'Paneer 250g' },
    { day: 11, status: 'purchased', morning: 1.5, evening: 0.5, note: 'Morning + evening delivery' },
  ];

  for (const item of samplePattern) {
    if (item.day > maxDay) continue;
    const key = formatDateKey(year, month, item.day);
    map[key] = {
      date: key,
      status: item.status,
      morningLiters: item.status === 'purchased' ? item.morning : 0,
      eveningLiters: item.status === 'purchased' ? item.evening : 0,
      pricePerLiter: settings.defaultPricePerLiter,
      extraCost: item.extraCost || 0,
      extraNote: item.extraNote || '',
      note: item.note || '',
    };
  }

  return map;
}
