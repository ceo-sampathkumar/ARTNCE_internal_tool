/**
 * Unit & Integration Tests: Size-Based Artwork Pricing & Cost Frequency Display
 */

import assert from 'assert';
import {
  findMatchingArtworkPrice,
  calculateCuratedArtworksPricing,
  parseDimensionsToInches,
  normalizeCostFrequency,
  calculateCompanyTargetPerformance,
} from '../lib/calculator.js';
import {
  DEFAULT_ARTWORK_PRICING,
  DEFAULT_COMPANY_MONTHLY_EXPENSES,
} from '../lib/defaults.js';

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${desc}`);
    console.error(err);
    failCount++;
  }
}

console.log('--- Testing Size-Based Artwork Pricing & Commission ---');

// 1. Standard Size Matching (Inches)
it('Matches 12 × 18 standard size accurately', () => {
  const painting = { width: 12, height: 18, unit: 'in' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, true);
  assert.strictEqual(res.basePrice, 2500);
  assert.strictEqual(res.commissionPercent, 20);
  assert.strictEqual(res.commissionAmount, 500);
  assert.strictEqual(res.finalPrice, 3000);
});

it('Matches 18 × 24 standard size accurately', () => {
  const painting = { width: 18, height: 24, unit: 'in' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, true);
  assert.strictEqual(res.basePrice, 4200);
  assert.strictEqual(res.commissionPercent, 20);
  assert.strictEqual(res.commissionAmount, 840);
  assert.strictEqual(res.finalPrice, 5040);
});

it('Matches 24 × 36 standard size accurately', () => {
  const painting = { width: 24, height: 36, unit: 'in' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, true);
  assert.strictEqual(res.basePrice, 6500);
  assert.strictEqual(res.commissionPercent, 20);
  assert.strictEqual(res.commissionAmount, 1300);
  assert.strictEqual(res.finalPrice, 7800);
});

// 2. Orientation Independence
it('Matches rotated dimensions (18 × 12 matches 12 × 18)', () => {
  const painting = { width: 18, height: 12, unit: 'in' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, true);
  assert.strictEqual(res.basePrice, 2500);
  assert.strictEqual(res.finalPrice, 3000);
});

it('Matches rotated dimensions (36 × 24 matches 24 × 36)', () => {
  const painting = { width: 36, height: 24, unit: 'in' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, true);
  assert.strictEqual(res.basePrice, 6500);
  assert.strictEqual(res.finalPrice, 7800);
});

// 3. Unit Conversion (Feet to Inches)
it('Matches dimensions specified in feet (1.5 ft × 2 ft matches 18 × 24 in)', () => {
  const painting = { width: 1.5, height: 2, unit: 'ft' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, true);
  assert.strictEqual(res.basePrice, 4200);
  assert.strictEqual(res.finalPrice, 5040);
});

it('Matches dimensions specified in feet (2 ft × 3 ft matches 24 × 36 in)', () => {
  const painting = { width: 2, height: 3, unit: 'ft' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, true);
  assert.strictEqual(res.basePrice, 6500);
  assert.strictEqual(res.finalPrice, 7800);
});

// 4. Custom Size Calculation
it('Calculates custom non-standard size using area and custom rate', () => {
  const painting = { width: 20, height: 28, unit: 'in' };
  const res = findMatchingArtworkPrice(painting, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(res.isStandard, false);
  assert.strictEqual(res.sizeId, 'custom');
  assert.ok(res.basePrice > 0);
  assert.strictEqual(res.commissionAmount, Math.round(res.basePrice * 0.2));
  assert.strictEqual(res.finalPrice, res.basePrice + res.commissionAmount);
});

// 5. Individual Artwork Accumulation (No Averaging)
it('Calculates each artwork individually and accumulates Total Artwork Investment', () => {
  const paintings = [
    { id: 'p1', title: 'Small Piece', width: 12, height: 18, unit: 'in' },  // Base: 2500, Comm: 500, Final: 3000
    { id: 'p2', title: 'Medium Piece', width: 18, height: 24, unit: 'in' }, // Base: 4200, Comm: 840, Final: 5040
    { id: 'p3', title: 'Large Piece', width: 24, height: 36, unit: 'in' },  // Base: 6500, Comm: 1300, Final: 7800
  ];

  const summary = calculateCuratedArtworksPricing(paintings, DEFAULT_ARTWORK_PRICING);
  assert.strictEqual(summary.count, 3);
  assert.strictEqual(summary.totalBasePrice, 2500 + 4200 + 6500); // 13,200
  assert.strictEqual(summary.totalCommission, 500 + 840 + 1300);  // 2,640
  assert.strictEqual(summary.totalArtworkInvestment, 3000 + 5040 + 7800); // 15,840

  // Verify: Total = Base + Commission
  assert.strictEqual(
    summary.totalArtworkInvestment,
    summary.totalBasePrice + summary.totalCommission
  );
});

// 6. Dynamic Price Settings Modification
it('Respects modified base prices and commission percentages from Price Settings', () => {
  const customPricing = {
    ...DEFAULT_ARTWORK_PRICING,
    sizes: DEFAULT_ARTWORK_PRICING.sizes.map((s) =>
      s.id === 'sz_12x18'
        ? { ...s, basePrice: 3000, commissionPercent: 25 } // Updated from 2500 @ 20%
        : s
    ),
  };

  const painting = { width: 12, height: 18, unit: 'in' };
  const res = findMatchingArtworkPrice(painting, customPricing);
  assert.strictEqual(res.basePrice, 3000);
  assert.strictEqual(res.commissionPercent, 25);
  assert.strictEqual(res.commissionAmount, 750);
  assert.strictEqual(res.finalPrice, 3750);
});

// 7. Cost Frequency Logic Distinction
it('Normalizes periodic costs internally while keeping actual costs intact', () => {
  const monthlyCost = normalizeCostFrequency(500, 'monthly');
  assert.strictEqual(monthlyCost, 500);

  const rotQuarterly = normalizeCostFrequency(1000, 'every_3_months');
  assert.strictEqual(Math.round(rotQuarterly * 100) / 100, 333.33);

  const oneTime = normalizeCostFrequency(700, 'one_time');
  assert.strictEqual(Math.round(oneTime * 100) / 100, 58.33);
});

// 8. One-Screen Performance Metric Computations
it('Calculates one-screen performance metrics correctly', () => {
  const activeClients = [
    { monthlyFee: 12500, monthlyCost: 1892, monthlyContribution: 10608 },
    { monthlyFee: 25000, monthlyCost: 4592, monthlyContribution: 20408 },
    { monthlyFee: 12500, monthlyCost: 1892, monthlyContribution: 10608 },
  ];
  const perf = calculateCompanyTargetPerformance({
    companyExpenses: DEFAULT_COMPANY_MONTHLY_EXPENSES,
    activeClients,
    selectedPlanContribution: 10608,
  });

  assert.strictEqual(perf.totalActiveClients, 3);
  assert.strictEqual(perf.totalMonthlySubscriptionRevenue, 50000);
  assert.strictEqual(perf.totalMonthlyContribution, 41624);
  assert.strictEqual(perf.totalCompanyMonthlyRequirement, 460000);
  assert.strictEqual(perf.remainingRequirement, 460000 - 41624); // 418,376
  assert.strictEqual(perf.additionalPlansNeeded, Math.ceil(418376 / 10608)); // 40
  assert.strictEqual(perf.isTargetReached, false);
});

console.log('\n========================================');
console.log(`Summary: Passed: ${passCount} | Failed: ${failCount}`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
