import {
  buildBreakdown,
  calculatePricing,
  toFeet,
  DEFAULT_SETTINGS,
  DEFAULT_PRICING,
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
const expectedMarginPrice = 5508 / 0.7; // ~7868.57
assertClose(pMargin.sellingPrice, expectedMarginPrice, 0.01, '30% Gross margin gives cost / (1 - 0.3) = ₹7,868.57');
assertClose(pMargin.marginPct, 30, 0.01, 'Gross margin percentage is 30%');

console.log(`\n========================================`);
console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
