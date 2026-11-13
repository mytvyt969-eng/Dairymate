import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MilkSettings,
  MilkRecord,
  formatDateKey,
  getTodayDateInfo,
  getMaxFillDayForMonth,
  calculateRecordTotalLiters,
  calculateRecordMilkCost,
  calculateRecordTotalCost,
  cycleAttendanceStatus,
  calculateMonthlySummary,
  buildCalendarGrid,
  createInitialSeedData,
  generateCSVExport,
} from './milkCalculations';

const mockSettings: MilkSettings = {
  vendorName: 'Sharma Dairy Farm',
  vendorPhone: '+91 98765 43210',
  milkType: 'Farm Fresh A2 Buffalo Milk',
  currencySymbol: '₹',
  defaultPricePerLiter: 64,
  defaultMorningLiters: 1.5,
  defaultEveningLiters: 0.5,
};

test('formatDateKey formats year, 0-indexed month, and day to YYYY-MM-DD', () => {
  assert.equal(formatDateKey(2026, 10, 5), '2026-11-05');
  assert.equal(formatDateKey(2026, 0, 19), '2026-01-19');
});

test('getTodayDateInfo extracts live date parts and formatted label', () => {
  const sampleDate = new Date(2026, 10, 13, 8, 46, 0); // Nov 13, 2026
  const info = getTodayDateInfo(sampleDate);
  assert.equal(info.year, 2026);
  assert.equal(info.month, 10);
  assert.equal(info.day, 13);
  assert.equal(info.dateKey, '2026-11-13');
  assert.equal(info.formattedLabel, 'Nov 13, 2026');
});

test('getMaxFillDayForMonth returns today day for current month, full days for past months, and 0 for future months', () => {
  const today = getTodayDateInfo(new Date(2026, 10, 13)); // Nov 13, 2026
  assert.equal(getMaxFillDayForMonth(2026, 10, today), 13);
  assert.equal(getMaxFillDayForMonth(2026, 9, today), 31); // Oct 2026
  assert.equal(getMaxFillDayForMonth(2026, 11, today), 0); // Dec 2026
  assert.equal(getMaxFillDayForMonth(2027, 0, today), 0); // Jan 2027
});

test('calculateRecordTotalLiters and cost return 0 when status is absent or unmarked', () => {
  const absentRecord: MilkRecord = {
    date: '2026-11-04',
    status: 'absent',
    morningLiters: 1.5,
    eveningLiters: 0.5,
    pricePerLiter: 64,
    extraCost: 50,
    extraNote: '',
    note: 'Out of town',
  };

  assert.equal(calculateRecordTotalLiters(absentRecord), 0);
  assert.equal(calculateRecordMilkCost(absentRecord), 0);
  assert.equal(calculateRecordTotalCost(absentRecord), 0);
});

test('calculateRecordTotalLiters and cost compute accurate values when purchased', () => {
  const purchasedRecord: MilkRecord = {
    date: '2026-11-03',
    status: 'purchased',
    morningLiters: 2.0,
    eveningLiters: 0.5,
    pricePerLiter: 64,
    extraCost: 40,
    extraNote: 'Curd',
    note: '',
  };

  assert.equal(calculateRecordTotalLiters(purchasedRecord), 2.5);
  assert.equal(calculateRecordMilkCost(purchasedRecord), 160);
  assert.equal(calculateRecordTotalCost(purchasedRecord), 200);
});

test('cycleAttendanceStatus cycles unmarked -> purchased -> absent -> unmarked', () => {
  assert.equal(cycleAttendanceStatus('unmarked'), 'purchased');
  assert.equal(cycleAttendanceStatus('purchased'), 'absent');
  assert.equal(cycleAttendanceStatus('absent'), 'unmarked');
});

test('calculateMonthlySummary aggregates purchased days, absent days, liters, and billing totals', () => {
  const seed = createInitialSeedData(2026, 10, mockSettings); // Nov 2026 has 30 days
  const summary = calculateMonthlySummary(2026, 10, seed, mockSettings);

  assert.equal(summary.totalDaysInMonth, 30);
  assert.equal(summary.purchasedDays, 8);
  assert.equal(summary.absentDays, 3);
  assert.equal(summary.unmarkedDays, 19);

  // 7 days with 1.5 morning + 1 day with 2.0 morning = 12.5L morning
  assert.equal(summary.totalMorningLiters, 12.5);
  // 7 days with 0.5 evening + 1 day with 0 evening = 3.5L evening
  assert.equal(summary.totalEveningLiters, 3.5);
  assert.equal(summary.totalLiters, 16);

  // 16 L * 64 = 1024 milk cost
  assert.equal(summary.totalMilkCost, 1024);
  // Extra cost: 40 + 90 = 130
  assert.equal(summary.totalExtraCost, 130);
  assert.equal(summary.grandTotalCost, 1154);

  // Saved on 3 absent days: 3 * (1.5 + 0.5) * 64 = 384
  assert.equal(summary.savedOnAbsentDaysCost, 384);
});

test('createInitialSeedData respects maxDay cap', () => {
  const seed = createInitialSeedData(2026, 10, mockSettings, 5);
  assert.equal(Object.keys(seed).length, 5);
  assert.ok(seed['2026-11-05']);
  assert.equal(seed['2026-11-06'], undefined);
});

test('buildCalendarGrid builds 35 or 42 cells and marks current month days accurately', () => {
  const seed = createInitialSeedData(2026, 10, mockSettings);
  const grid = buildCalendarGrid(2026, 10, seed, '2026-11-11');
  assert.ok(grid.length === 35 || grid.length === 42);
  const currentMonthCells = grid.filter((c) => c.isCurrentMonth);
  assert.equal(currentMonthCells.length, 30);
  const todayCell = grid.find((c) => c.isToday);
  assert.equal(todayCell?.date, '2026-11-11');
});

test('generateCSVExport creates header row plus one row per day in month', () => {
  const seed = createInitialSeedData(2026, 10, mockSettings);
  const csv = generateCSVExport(2026, 10, seed);
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 31); // 1 header + 30 days in November
  assert.ok(lines[0].startsWith('Date,Status,Morning Liters'));
  assert.ok(lines[1].includes('2026-11-01,Purchased,1.5,0.5,2,64,128'));
  assert.ok(lines[4].includes('2026-11-04,Absent,0,0,0,64,0,0,0'));
});
