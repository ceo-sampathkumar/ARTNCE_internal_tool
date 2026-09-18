import {
  normalizeCostFrequency,
  calculatePeriodCost,
  calculateSimplePlanCosts,
  calculateSimplePlanResult,
  calculateCompanyTargetPerformance,
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
    console.log(`✅ PASS: ${message} (Actual: ${actual.toFixed(2)}, Expected: ${expected.toFixed(2)})`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message} (Actual: ${actual.toFixed(2)}, Expected: ${expected.toFixed(2)}, Diff: ${diff.toFixed(4)})`);
    failed++;
  }
}

console.log('--- Testing Redesigned Subscription Calculation Engine ---');

// 1. Critical Calculation Rule: Rotation ₹1,000 Every 3 Months
// For 3-month period: ₹1,000 * 1 rotation = ₹1,000
const rot3m = calculatePeriodCost(1000, 'every_3_months', 3);
assertClose(rot3m, 1000, 0.001, 'Rotation Every 3 Months over 3 months is ₹1,000 (1 rotation)');

// For 6-month period: ₹1,000 * 2 rotations = ₹2,000
const rot6m = calculatePeriodCost(1000, 'every_3_months', 6);
assertClose(rot6m, 2000, 0.001, 'Rotation Every 3 Months over 6 months is ₹2,000 (2 rotations)');

// For 12-month period: ₹1,000 * 4 rotations = ₹4,000 (NOT ₹12,000)
const rot12m = calculatePeriodCost(1000, 'every_3_months', 12);
assertClose(rot12m, 4000, 0.001, 'Rotation Every 3 Months over 12 months is ₹4,000 (NOT ₹12,000)');

// 2. Critical Calculation Rule: One-Time ₹700
const inst3m = calculatePeriodCost(700, 'one_time', 3);
assertClose(inst3m, 700, 0.001, 'One Time ₹700 over 3 months is ₹700 only once');
const inst12m = calculatePeriodCost(700, 'one_time', 12);
assertClose(inst12m, 700, 0.001, 'One Time ₹700 over 12 months is ₹700 only once');

// 3. Critical Calculation Rule: Monthly ₹500 over 12 months = ₹6,000
const monthly12m = calculatePeriodCost(500, 'monthly', 12);
assertClose(monthly12m, 6000, 0.001, 'Monthly ₹500 over 12 months is ₹6,000');

// 4. Critical Calculation Rule: Every 6 Months ₹1,000 over 12 months = ₹2,000
const every6m12 = calculatePeriodCost(1000, 'every_6_months', 12);
assertClose(every6m12, 2000, 0.001, 'Every 6 Months ₹1,000 over 12 months is ₹2,000');

// 5. Monthly cost normalizations
assertClose(normalizeCostFrequency(500, 'monthly'), 500, 0.001, 'Monthly ₹500 normalized is ₹500/mo');
assertClose(normalizeCostFrequency(1000, 'every_3_months'), 1000 / 3, 0.01, 'Every 3 Months ₹1,000 normalized is ₹333.33/mo');
assertClose(normalizeCostFrequency(1000, 'every_6_months'), 1000 / 6, 0.01, 'Every 6 Months ₹1,000 normalized is ₹166.67/mo');
assertClose(normalizeCostFrequency(1200, 'every_12_months'), 100, 0.01, 'Every 12 Months ₹1,200 normalized is ₹100/mo');
assertClose(normalizeCostFrequency(700, 'one_time', { termMonths: 12 }), 700 / 12, 0.01, 'One Time ₹700 normalized is ₹58.33/mo');

// 6. Plan Result Calculation: Client Pays minus Plan Cost equals Contribution
const sampleCosts = [
  { id: '1', name: 'Maintenance', amount: 500, frequency: 'monthly' },
  { id: '2', name: 'Artist', amount: 500, frequency: 'monthly' },
  { id: '3', name: 'Manpower', amount: 300, frequency: 'monthly' },
  { id: '4', name: 'Travel', amount: 200, frequency: 'monthly' },
  { id: '5', name: 'Rotation', amount: 1000, frequency: 'every_3_months' }, // 333.33/mo
  { id: '6', name: 'Installation', amount: 700, frequency: 'one_time' }, // 58.33/mo
];

const planResult = calculateSimplePlanResult({
  monthlySubscription: 12500,
  costs: sampleCosts,
});

// Total monthly cost: 500 + 500 + 300 + 200 + 333.33 + 58.33 = 1891.67
assertClose(planResult.monthlyOperatingCost, 1891.67, 0.1, 'Monthly operating cost calculated accurately');
assertClose(planResult.monthlyContribution, 12500 - 1891.67, 0.1, 'Monthly contribution = Subscription - Operating Cost');
assertClose(planResult.contributionPercent, ((12500 - 1891.67) / 12500) * 100, 0.1, 'Contribution percentage is accurate');

// 7. Company Target Engine & Plans Needed (Example from prompt):
// Remaining requirement = ₹80,000, Selected plan contribution = ₹11,200
// ₹80,000 / ₹11,200 = 7.14 -> 8 additional plans needed
const companyPerfPromptExample = calculateCompanyTargetPerformance({
  companyExpenses: {
    employeeSalaries: 80000,
    officeRent: 0,
    petrolTravel: 0,
    technologySoftware: 0,
    marketing: 0,
    otherInvestments: 0,
    otherExpenses: 0,
  },
  activeClients: [], // 0 clients -> 0 contribution -> 80,000 remaining
  selectedPlanContribution: 11200,
});

assertClose(companyPerfPromptExample.totalCompanyMonthlyRequirement, 80000, 0.01, 'Total requirement is ₹80,000');
assertClose(companyPerfPromptExample.totalMonthlyContribution, 0, 0.01, 'Total contribution is ₹0');
assertClose(companyPerfPromptExample.remainingRequirement, 80000, 0.01, 'Remaining requirement is ₹80,000');
assert(!companyPerfPromptExample.isTargetReached, 'Target is NOT reached');
assert(companyPerfPromptExample.additionalPlansNeeded === 8, `Additional plans needed is 8 (ceil(80,000 / 11,200) = 8). Got ${companyPerfPromptExample.additionalPlansNeeded}`);

// 8. Company Target Engine with Active Clients
const activeClientsSample = [
  { id: 'c1', clientName: 'Client A', planId: 'essential', monthlyFee: 12500, monthlyCost: 5700, monthlyContribution: 6800 },
  { id: 'c2', clientName: 'Client B', planId: 'professional', monthlyFee: 25000, monthlyCost: 10000, monthlyContribution: 15000 },
];

const companyPerfWithClients = calculateCompanyTargetPerformance({
  companyExpenses: {
    employeeSalaries: 300000,
    officeRent: 50000,
    petrolTravel: 15000,
    technologySoftware: 20000,
    marketing: 35000,
    otherInvestments: 25000,
    otherExpenses: 15000,
  },
  activeClients: activeClientsSample,
  selectedPlanContribution: 6800, // Essential contribution
});

assert(companyPerfWithClients.totalActiveClients === 2, 'Total active clients is 2');
assertClose(companyPerfWithClients.totalMonthlySubscriptionRevenue, 37500, 0.01, 'Total monthly revenue is ₹37,500');
assertClose(companyPerfWithClients.totalMonthlyContribution, 21800, 0.01, 'Total monthly contribution is ₹21,800');
assertClose(companyPerfWithClients.totalCompanyMonthlyRequirement, 460000, 0.01, 'Total requirement is ₹4,60,000');
assertClose(companyPerfWithClients.remainingRequirement, 460000 - 21800, 0.01, 'Remaining requirement is ₹4,38,200');
assert(!companyPerfWithClients.isTargetReached, 'Target is NOT reached');
// Ceil(438,200 / 6,800) = 65 plans
assert(companyPerfWithClients.additionalPlansNeeded === Math.ceil(438200 / 6800), `Additional plans needed is ${Math.ceil(438200 / 6800)}`);

// 9. Target Reached Scenario
const targetReachedCompany = calculateCompanyTargetPerformance({
  companyExpenses: {
    employeeSalaries: 20000,
    officeRent: 0,
    petrolTravel: 0,
    technologySoftware: 0,
    marketing: 0,
    otherInvestments: 0,
    otherExpenses: 0,
  },
  activeClients: activeClientsSample, // Contribution is 21,800 >= 20,000
  selectedPlanContribution: 6800,
});

assert(targetReachedCompany.isTargetReached, 'Target IS reached when contribution >= requirement');
assert(targetReachedCompany.remainingRequirement === 0, 'Remaining requirement is 0 when target reached');
assert(targetReachedCompany.surplus === 1800, 'Surplus is ₹1,800');
assert(targetReachedCompany.additionalPlansNeeded === 0, 'Additional plans needed is 0 when target reached');

console.log(`\n========================================`);
console.log(`Summary: Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
