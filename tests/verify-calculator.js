import {
  buildBreakdown,
  calculatePricing,
  toFeet,
  DEFAULT_SETTINGS,
  DEFAULT_PRICING,
  calculatePaintingCost,
  calculateBatchSummary,
  calculateSubscriptionEconomics,
} from '../lib/calculator.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

function assertClose(actual, expected, tolerance = 0.01, message) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`✅ PASS: ${message} (Actual: ${actual.toFixed(3)}, Expected: ${expected.toFixed(3)})`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message} (Actual: ${actual.toFixed(3)}, Expected: ${expected.toFixed(3)}, Diff: ${diff.toFixed(4)})`);
    failed++;
  }
}

console.log('--- Testing ARTNCE Painting Cost Calculation Engine ---');

// 1. Benchmark 3x4 ft test
const b3x4 = buildBreakdown(3, 4, DEFAULT_SETTINGS);
assertClose(b3x4.area, 12, 0.001, 'Area for 3×4 ft is 12 sq ft');
assertClose(b3x4.perimeter, 14, 0.001, 'Perimeter for 3×4 ft is 14 ft');

const canvasRow = b3x4.rows.find((r) => r.id === 'canvas');
assertClose(canvasRow.cost, 1800, 0.001, 'Canvas cost is ₹1,800');

const stretchRow = b3x4.rows.find((r) => r.id === 'stretch');
assertClose(stretchRow.cost, 1200, 0.1, 'Stretching + Support cost is ~₹1,200 (14 * 85.714)');

const frameRow = b3x4.rows.find((r) => r.id === 'frame');
assertClose(frameRow.cost, 2400, 0.1, 'Frame cost is ~₹2,400 (14 * 171.429)');

assertClose(b3x4.subtotal, 5400, 0.2, 'Subtotal is ~₹5,400');
assertClose(b3x4.transportCost, 108, 0.1, 'Transportation (2% of subtotal) is ~₹108');
assertClose(b3x4.total, 5508, 0.3, 'Total production cost is ~₹5,508');
assertClose(b3x4.total / b3x4.area, 459, 0.1, 'Cost per sq ft is ~₹459');

// 2. Unit conversion test (36 in x 48 in == 3 ft x 4 ft)
const wFtFromInches = toFeet(36, 'in');
const hFtFromInches = toFeet(48, 'in');
const bInches = buildBreakdown(wFtFromInches, hFtFromInches, DEFAULT_SETTINGS);
assertClose(bInches.total, b3x4.total, 0.0001, '36×48 inches produces identical cost to 3×4 ft');

// 3. Transportation test: confirm transportation is subtotal * 2%, NOT total * 2%
const expectedTransport = b3x4.subtotal * 0.02;
assertClose(b3x4.transportCost, expectedTransport, 0.0001, 'Transportation is calculated on subtotal');

// 4. Pricing Markup Test (40% markup on ₹5,508)
const pMarkup = calculatePricing(5508, { method: 'markup', markupPercent: 40 });
assertClose(pMarkup.sellingPrice, 5508 * 1.4, 0.01, 'Markup 40% gives 5508 * 1.4 = ₹7,711.20');
assertClose(pMarkup.profit, 7711.2 - 5508, 0.01, 'Profit for 40% markup is ₹2,203.20');

// 5. Pricing Gross Margin Test (30% margin on ₹5,508)
const pMargin = calculatePricing(5508, { method: 'margin', marginPercent: 30 });
assertClose(pMargin.sellingPrice, 5508 / 0.7, 0.01, '30% Gross margin gives cost / (1 - 0.3) = ₹7,868.57');
assertClose(pMargin.marginPct, 30, 0.001, 'Gross margin percentage is 30%');

// 6. calculatePaintingCost central engine test
const pCost = calculatePaintingCost({ width: '3', height: '4', unit: 'ft' }, DEFAULT_SETTINGS);
assert(pCost.isValid, 'Painting cost result is valid');
assertClose(pCost.areaSqFt, 12, 0.001, 'calculatePaintingCost area is 12 sq ft');
assertClose(pCost.perimeterRunningFt, 14, 0.001, 'calculatePaintingCost perimeter is 14 ft');
assertClose(pCost.canvasPrintCost, 1800, 0.001, 'canvasPrintCost is 1800');
assertClose(pCost.totalProductionCost, 5508, 0.3, 'calculatePaintingCost totalProductionCost is ₹5,508');

// 7. Batch calculation test
const sampleBatch = [
  { id: '1', width: '3', height: '4', unit: 'ft' },
  { id: '2', width: '2', height: '3', unit: 'ft' },
  { id: '3', width: '2', height: '2.5', unit: 'ft' },
  { id: '4', width: '18', height: '12', unit: 'in' },
  { id: '5', width: '16', height: '20', unit: 'in' },
];
const batchSummary = calculateBatchSummary(sampleBatch, DEFAULT_SETTINGS);
assert(batchSummary.count === 5, 'Batch count is 5');
assert(batchSummary.validCount === 5, 'Batch valid count is 5');

const manualSum = sampleBatch.reduce(
  (sum, p) => sum + calculatePaintingCost(p, DEFAULT_SETTINGS).totalProductionCost,
  0
);
assertClose(batchSummary.totalProductionCost, manualSum, 0.01, 'Batch total equals sum of individual painting costs');
assert(batchSummary.avgCostPerArtwork === batchSummary.totalProductionCost / 5, 'Average cost per artwork is accurate');

// 8. Curated subset selection test (8 total, 5 selected)
const extendedBatch = [
  ...sampleBatch,
  { id: '6', width: '4', height: '5', unit: 'ft' },
  { id: '7', width: '2', height: '2', unit: 'ft' },
  { id: '8', width: '30', height: '40', unit: 'in' },
];
const selectedIds = ['1', '2', '3', '4', '5'];
const curatedList = extendedBatch.filter((p) => selectedIds.includes(p.id));
const curatedSummary = calculateBatchSummary(curatedList, DEFAULT_SETTINGS);
assert(curatedSummary.validCount === 5, 'Curated count is exactly 5');
assertClose(curatedSummary.totalProductionCost, batchSummary.totalProductionCost, 0.01, 'Curated total matches selected subset');

// 9. Subscription economics test (₹30,000 investment, ₹10,000 sub, ₹4,000 op costs)
const subEconomics = calculateSubscriptionEconomics({
  initialInvestment: 30000,
  monthlySubscription: 10000,
  operatingCosts: { curator: 2000, logistics: 1000, operations: 1000 },
});
assertClose(subEconomics.monthlyOperatingCosts, 4000, 0.01, 'Monthly operating costs is ₹4,000');
assertClose(subEconomics.monthlyContribution, 6000, 0.01, 'Monthly contribution is ₹6,000');
assertClose(subEconomics.simpleRecoveryMonths, 3, 0.01, 'Simple recovery is 3.0 months (30000 / 10000)');
assertClose(subEconomics.estimatedRecoveryMonths, 5, 0.01, 'Estimated recovery with operating costs is 5.0 months (30000 / 6000)');
assert(subEconomics.isRecoveryAchievable === true, 'Recovery is achievable');

// Check scenarios (3, 6, 12, 24 mo)
const sc3 = subEconomics.scenarios.find((s) => s.months === 3);
assertClose(sc3.totalRevenue, 30000, 0.01, '3 mo revenue is ₹30,000');
assertClose(sc3.operatingCostsTotal, 12000, 0.01, '3 mo operating costs is ₹12,000');
assertClose(sc3.totalContribution, 18000, 0.01, '3 mo total contribution is ₹18,000');
assertClose(sc3.contributionAfterInvestment, -12000, 0.01, '3 mo contribution after investment is -₹12,000');
assert(sc3.isRecovered === false, '3 mo is not fully recovered');

const sc12 = subEconomics.scenarios.find((s) => s.months === 12);
assertClose(sc12.totalRevenue, 120000, 0.01, '12 mo revenue is ₹1,20,000');
assertClose(sc12.totalContribution, 72000, 0.01, '12 mo contribution is ₹72,000');
assertClose(sc12.contributionAfterInvestment, 42000, 0.01, '12 mo contribution after investment is ₹42,000 (not labeled profit)');
assert(sc12.isRecovered === true, '12 mo is recovered');

// 10. Safeguard: Negative / Zero Contribution Test
const deficitEconomics = calculateSubscriptionEconomics({
  initialInvestment: 30000,
  monthlySubscription: 5000,
  operatingCosts: { curator: 4000, logistics: 3000 }, // Total = ₹7,000 > ₹5,000
});
assert(deficitEconomics.monthlyContribution === -2000, 'Monthly contribution is -₹2,000');
assert(deficitEconomics.isRecoveryAchievable === false, 'Recovery is not achievable when contribution <= 0');
assert(deficitEconomics.estimatedRecoveryMonths === null, 'Estimated recovery months is null, never negative or Infinity');
assert(typeof deficitEconomics.unachievableReason === 'string', 'Unachievable reason is clearly provided');

// 11. Pricing Independence Test
const testPainting = { width: '3', height: '4', unit: 'ft' };
const costBefore = calculatePaintingCost(testPainting, DEFAULT_SETTINGS).totalProductionCost;

// Vary subscription price ₹10,000 -> ₹12,000 -> ₹15,000
const sub10 = calculateSubscriptionEconomics({ initialInvestment: costBefore, monthlySubscription: 10000 });
const sub12 = calculateSubscriptionEconomics({ initialInvestment: costBefore, monthlySubscription: 12000 });
const sub15 = calculateSubscriptionEconomics({ initialInvestment: costBefore, monthlySubscription: 15000 });

const costAfter = calculatePaintingCost(testPainting, DEFAULT_SETTINGS).totalProductionCost;
assertClose(costBefore, costAfter, 0.0001, 'Pricing independence: changing subscription price leaves production cost unchanged');
assertClose(costAfter, 5508, 0.3, 'Production cost remains benchmark ₹5,508');

// 12. Settings Propagation Test
const modifiedSettings = { ...DEFAULT_SETTINGS, frameRate: 200 }; // Frame rate changed from 171.429 to 200
const singleNewCost = calculatePaintingCost(testPainting, modifiedSettings).totalProductionCost;
assert(singleNewCost > costBefore, 'Single painting cost increases when frame rate increases');

const batchNewSummary = calculateBatchSummary(sampleBatch, modifiedSettings);
assert(batchNewSummary.totalProductionCost > batchSummary.totalProductionCost, 'Batch total cost updates with new settings');

const curatedNewSummary = calculateBatchSummary(curatedList, modifiedSettings);
assert(curatedNewSummary.totalProductionCost > curatedSummary.totalProductionCost, 'Curated collection cost updates with new settings');

const subPropagated = calculateSubscriptionEconomics({
  initialInvestment: curatedNewSummary.totalProductionCost,
  monthlySubscription: 10000,
});
assert(subPropagated.initialInvestment === curatedNewSummary.totalProductionCost, 'Subscription initial investment updates with new settings');
assert(subPropagated.monthlySubscription === 10000, 'Subscription monthly price does NOT change automatically');

console.log('\n========================================');
console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
