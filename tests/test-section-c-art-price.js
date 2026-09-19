/**
 * Automated test suite for Section C (Plan Result) with Art Price & Delivery Cost deductions
 *
 * Formula:
 * Monthly Net Contribution = Client Monthly Pay - Monthly Delivery Cost - (Art Price / 12)
 * 12-Month Net Contribution = (Client Monthly Pay * 12) - Total 12-Month Delivery Cost - Art Price
 * Art Price Payback (Months) = Art Price / (Client Monthly Pay - Monthly Delivery Cost)
 */

import assert from 'node:assert';
import {
  calculateClientEconomics,
  calculateSimplePlanResult,
  calculatePeriodCost,
} from '../lib/calculator.js';

let passCount = 0;
let failCount = 0;

function runTest(desc, fn) {
  try {
    fn();
    passCount++;
    console.log(`✅ PASS: ${desc}`);
  } catch (err) {
    failCount++;
    console.error(`❌ FAIL: ${desc}`);
    console.error(err);
  }
}

console.log('\n--- Running Section C: Art Price & Delivery Cost Deductions Tests ---\n');

// Test 1: Monthly and 12-Month deductions with Art Price
runTest('Section C calculates Monthly Net Contribution: Client Pay - Delivery Cost - (Art Price / 12)', () => {
  const costs = [
    { id: 'c1', name: 'Maintenance', amount: 500, frequency: 'monthly' },
    { id: 'c2', name: 'Artist', amount: 500, frequency: 'monthly' },
    { id: 'c3', name: 'Manpower', amount: 300, frequency: 'monthly' },
    { id: 'c4', name: 'Travel', amount: 200, frequency: 'monthly' },
    { id: 'c5', name: 'Rotation', amount: 1000, frequency: 'every_3_months' }, // 4000/yr
    { id: 'c6', name: 'Installation', amount: 700, frequency: 'one_time' }, // 700/yr
  ];
  // Total delivery spend over 12 mo = (500+500+300+200)*12 + 4000 + 700 = 18000 + 4000 + 700 = 22,700
  // Avg monthly delivery spend = 22,700 / 12 = 1,891.67 / mo
  const monthlyFee = 12500;
  const artPrice = 15120; // 3 artworks @ 4200 + 20% commission

  const econ = calculateClientEconomics({
    costs,
    monthlyFee,
    periodMonths: 12,
    artPrice,
  });

  // 1. Delivery Cost verification
  assert.strictEqual(econ.totalSpend, 22700, 'Total delivery spend over 12 mo is 22,700');
  assert.strictEqual(econ.deliveryCost, 22700, 'deliveryCost alias matches totalSpend');
  assert.strictEqual(Math.round(econ.avgMonthlySpend), 1892, 'Avg monthly delivery spend is 1,892/mo');
  assert.strictEqual(Math.round(econ.monthlyDeliveryCost), 1892, 'monthlyDeliveryCost alias matches avgMonthlySpend');

  // 2. Art Price verification
  assert.strictEqual(econ.artPrice, 15120, 'Art price is 15,120');
  assert.strictEqual(econ.artworkInvestment, 15120, 'artworkInvestment alias is 15,120');
  assert.strictEqual(econ.monthlyArtCost, 15120 / 12, 'Monthly art cost is 1,260/mo (15120 / 12)');

  // 3. Operating Contribution before Art Price (Level 1: Client Pay - Delivery Cost)
  const expectedOperatingContrib = 12500 - (22700 / 12); // 10,608.33
  assert.strictEqual(Math.round(econ.monthlyContributionBeforeArt), Math.round(expectedOperatingContrib));

  // 4. Monthly Net Contribution (Client Pay - Delivery Cost - Art Price/12)
  const expectedMonthlyNet = expectedOperatingContrib - 1260; // 9,348.33
  assert.strictEqual(Math.round(econ.monthlyContribution), Math.round(expectedMonthlyNet), 'Monthly net contribution = 12500 - 1891.67 - 1260 = 9348');

  // 5. 12-Month Net Contribution: Total Client Pay - Total Delivery Spend - Art Price
  const totalClientPay = 12500 * 12; // 150,000
  const expected12MNet = totalClientPay - 22700 - 15120; // 112,180
  assert.strictEqual(econ.totalClientPay, 150000, 'Total client pay over 12 mo is 150,000');
  assert.strictEqual(econ.totalNetContribution, 112180, '12-month net contribution = 150000 - 22700 - 15120 = 112,180');

  // 6. Art Price Payback (Recovery Months) = 15120 / 10608.33 = 1.4 months
  assert.strictEqual(econ.recoveryMonths, 1.4, 'Art price payback is 1.4 months');
});

// Test 2: Backward compatibility when artPrice is 0 or omitted
runTest('Backward compatibility: when artPrice is 0 or omitted, monthlyContribution equals Fee - Delivery', () => {
  const costs = [{ id: 'c1', name: 'Maintenance', amount: 500, frequency: 'monthly' }];
  const econ = calculateClientEconomics({
    costs,
    monthlyFee: 10000,
    periodMonths: 12,
  });

  assert.strictEqual(econ.artPrice, 0, 'artPrice defaults to 0');
  assert.strictEqual(econ.monthlyArtCost, 0, 'monthlyArtCost is 0');
  assert.strictEqual(econ.monthlyContribution, 9500, 'monthlyContribution is 10000 - 500 = 9500');
  assert.strictEqual(econ.recoveryMonths, 0, 'recoveryMonths is 0 when art price is 0');
});

// Test 3: calculateSimplePlanResult with artPrice
runTest('calculateSimplePlanResult correctly deducts artPrice from monthly operating cost', () => {
  const costs = [
    { id: 'c1', name: 'Maintenance', amount: 500, frequency: 'monthly' },
    { id: 'c2', name: 'Rotation', amount: 1200, frequency: 'every_3_months' }, // 400/mo
  ];
  // monthlyOperatingCost = 900
  const res = calculateSimplePlanResult({
    monthlySubscription: 10000,
    costs,
    artPrice: 12000,
    options: { termMonths: 12 },
  });

  assert.strictEqual(res.monthlyOperatingCost, 900, 'Monthly operating delivery cost is 900');
  assert.strictEqual(res.artPrice, 12000, 'Art price is 12000');
  assert.strictEqual(res.monthlyArtCost, 1000, 'Monthly art cost is 12000/12 = 1000');
  assert.strictEqual(res.monthlyContributionBeforeArt, 9100, 'Contribution before art is 10000 - 900 = 9100');
  assert.strictEqual(res.monthlyContribution, 8100, 'Net contribution is 10000 - 900 - 1000 = 8100');
  assert.strictEqual(res.contributionPercent, 81, 'Contribution percent is 81%');
});

// Test 4: Custom client with high art investment and curator fee
runTest('High art investment client evaluates exact Net Contribution & Recovery period', () => {
  const costs = [
    { id: 'c1', name: 'Maintenance', amount: 1000, frequency: 'monthly' },
    { id: 'c2', name: 'Curator Fee', amount: 3000, frequency: 'every_3_months' }, // 12,000/yr (1000/mo)
  ];
  // Delivery cost = 1000*12 + 12000 = 24,000 (2,000/mo)
  const monthlyFee = 20000;
  const artPrice = 60000; // 60,000 art price

  const econ = calculateClientEconomics({
    costs,
    monthlyFee,
    periodMonths: 12,
    artPrice,
  });

  assert.strictEqual(econ.totalSpend, 24000);
  assert.strictEqual(econ.avgMonthlySpend, 2000);
  assert.strictEqual(econ.monthlyArtCost, 5000); // 60000 / 12
  assert.strictEqual(econ.monthlyContributionBeforeArt, 18000); // 20000 - 2000
  assert.strictEqual(econ.monthlyContribution, 13000); // 20000 - 2000 - 5000
  assert.strictEqual(econ.totalNetContribution, (20000 * 12) - 24000 - 60000); // 240000 - 84000 = 156000
  // Recovery: 60000 / 18000 = 3.33 -> 3.3 months
  assert.strictEqual(econ.recoveryMonths, 3.3);
});

console.log(`\n========================================`);
console.log(`Section C Tests: ${passCount + failCount} | Passed: ${passCount} | Failed: ${failCount}`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
}
