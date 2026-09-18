import assert from 'node:assert';
import {
  calculatePeriodCost,
  calculateClientEconomics,
  calculateSimplePlanCosts,
  calculateSimplePlanResult,
  calculateCompanyTargetPerformance,
} from '../lib/calculator.js';
import {
  DEFAULT_CURATED_CLIENTS,
  DEFAULT_ACTIVE_CLIENTS,
  DEFAULT_SIMPLE_PLANS,
  DEFAULT_COMPANY_MONTHLY_EXPENSES,
  SUPPORTED_COST_FREQUENCIES,
} from '../lib/defaults.js';

let passCount = 0;
let failCount = 0;

function runTest(description, fn) {
  try {
    fn();
    passCount++;
    console.log(`✅ PASS: ${description}`);
  } catch (err) {
    failCount++;
    console.error(`❌ FAIL: ${description}`);
    console.error(err);
  }
}

console.log('\n--- Testing Client-Specific Curated Economics & Frequency Calculations ---\n');

// Test 1: Frequency occurrences over 12 months
runTest('Rotation ₹1,000 every 3 months = 4 charges in 12 months = ₹4,000 total', () => {
  const total = calculatePeriodCost(1000, 'every_3_months', 12);
  assert.strictEqual(total, 4000);
});

runTest('Installation ₹700 One Time = exactly ₹700 total over 12 months', () => {
  const total = calculatePeriodCost(700, 'one_time', 12);
  assert.strictEqual(total, 700);
});

runTest('Maintenance ₹500 every month = ₹6,000 total over 12 months', () => {
  const total = calculatePeriodCost(500, 'monthly', 12);
  assert.strictEqual(total, 6000);
});

runTest('Every 6 Months ₹1,000 = 2 charges in 12 months = ₹2,000 total', () => {
  const total = calculatePeriodCost(1000, 'every_6_months', 12);
  assert.strictEqual(total, 2000);
});

// Test 2: Two clients on the SAME plan (Essential) with different curated values have DIFFERENT economics
runTest('Client A and Client B on Essential plan have distinct Total Spend, Avg Monthly Spend, and Contribution', () => {
  // Client A: Asiapaints curated with 5 artworks, 1995 sq ft, curator project fee ₹2,000
  const clientACosts = [
    { id: 'c1', name: 'Maintenance', amount: 500, frequency: 'monthly' },
    { id: 'c2', name: 'Artist', amount: 500, frequency: 'monthly' },
    { id: 'c3', name: 'Manpower', amount: 300, frequency: 'monthly' },
    { id: 'c4', name: 'Travel', amount: 200, frequency: 'monthly' },
    { id: 'c5', name: 'Curator Fee', amount: 2000, frequency: 'every_3_months' }, // from 03 CURATE
    { id: 'c6', name: 'Rotation', amount: 1000, frequency: 'every_3_months' },
    { id: 'c7', name: 'Installation', amount: 700, frequency: 'one_time' },
  ];
  // Client A Total Spend:
  // 500*12 (6000) + 500*12 (6000) + 300*12 (3600) + 200*12 (2400) + 2000*4 (8000) + 1000*4 (4000) + 700 (700) = 30,700
  const econA = calculateClientEconomics({
    costs: clientACosts,
    monthlyFee: 12500,
    periodMonths: 12,
  });
  assert.strictEqual(econA.totalSpend, 30700);
  assert.strictEqual(Math.round(econA.avgMonthlySpend), Math.round(30700 / 12)); // 2558
  assert.strictEqual(Math.round(econA.monthlyContribution), Math.round(12500 - 30700 / 12)); // 9942

  // Client B: Apex Towers curated with 3 artworks, 2000 sq ft, curator project fee ₹1,500
  const clientBCosts = [
    { id: 'c1', name: 'Maintenance', amount: 350, frequency: 'monthly' },
    { id: 'c2', name: 'Artist', amount: 400, frequency: 'monthly' },
    { id: 'c3', name: 'Manpower', amount: 250, frequency: 'monthly' },
    { id: 'c4', name: 'Curator Fee', amount: 1500, frequency: 'every_6_months' }, // from 03 CURATE
    { id: 'c5', name: 'Rotation', amount: 800, frequency: 'every_6_months' },
    { id: 'c6', name: 'Installation', amount: 600, frequency: 'one_time' },
  ];
  // Client B Total Spend:
  // 350*12 (4200) + 400*12 (4800) + 250*12 (3000) + 1500*2 (3000) + 800*2 (1600) + 600 (600) = 17,200
  const econB = calculateClientEconomics({
    costs: clientBCosts,
    monthlyFee: 12500,
    periodMonths: 12,
  });
  assert.strictEqual(econB.totalSpend, 17200);
  assert.strictEqual(Math.round(econB.avgMonthlySpend), Math.round(17200 / 12)); // 1433
  assert.strictEqual(Math.round(econB.monthlyContribution), Math.round(12500 - 17200 / 12)); // 11067

  // Verify they are completely different
  assert.notStrictEqual(econA.totalSpend, econB.totalSpend);
  assert.notStrictEqual(econA.avgMonthlySpend, econB.avgMonthlySpend);
  assert.notStrictEqual(econA.monthlyContribution, econB.monthlyContribution);
  // Neither client is forced to the old shared ₹1,892!
  assert.notStrictEqual(Math.round(econA.avgMonthlySpend), 1892);
  assert.notStrictEqual(Math.round(econB.avgMonthlySpend), 1892);
});

// Test 3: Curated client records in DEFAULT_CURATED_CLIENTS
runTest('Curated clients have individual curatorProjectFee from 03 CURATE', () => {
  const asiapaints = DEFAULT_CURATED_CLIENTS.find(c => c.clientName === 'Asiapaints');
  const apex = DEFAULT_CURATED_CLIENTS.find(c => c.clientName === 'Apex Towers');
  const nexus = DEFAULT_CURATED_CLIENTS.find(c => c.clientName === 'Nexus Suites');

  assert(asiapaints && asiapaints.curatorProjectFee === 2000, 'Asiapaints curator fee is ₹2,000');
  assert(apex && apex.curatorProjectFee === 1500, 'Apex Towers curator fee is ₹1,500');
  assert(nexus && nexus.curatorProjectFee === 3500, 'Nexus Suites curator fee is ₹3,500');
});

// Test 4: SUPPORTED_COST_FREQUENCIES has user-friendly labels
runTest('SUPPORTED_COST_FREQUENCIES has "Every Month" as label for monthly', () => {
  const monthlyFreq = SUPPORTED_COST_FREQUENCIES.find(f => f.id === 'monthly');
  assert.strictEqual(monthlyFreq.label, 'Every Month');
});

// Test 5: Company performance aggregates each client\'s avgMonthlySpend and contribution
runTest('Company performance aggregates active clients with independent avgMonthlySpend', () => {
  const activeClients = [
    { id: '1', clientName: 'Client A', monthlyFee: 15000, totalSpend: 36000, avgMonthlySpend: 3000, monthlyContribution: 12000 },
    { id: '2', clientName: 'Client B', monthlyFee: 25000, totalSpend: 60000, avgMonthlySpend: 5000, monthlyContribution: 20000 },
  ];
  const perf = calculateCompanyTargetPerformance({
    companyExpenses: DEFAULT_COMPANY_MONTHLY_EXPENSES,
    activeClients,
    selectedPlanContribution: 10000,
  });

  assert.strictEqual(perf.totalActiveClients, 2);
  assert.strictEqual(perf.totalMonthlySubscriptionRevenue, 40000);
  assert.strictEqual(perf.totalMonthlyCost, 8000);
  assert.strictEqual(perf.totalMonthlyContribution, 32000);
});

console.log('\n========================================');
console.log(`Summary: Passed: ${passCount} | Failed: ${failCount}`);
console.log('========================================\n');

if (failCount > 0) {
  process.exit(1);
}
