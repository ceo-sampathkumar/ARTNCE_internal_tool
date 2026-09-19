import assert from 'assert';
import { calculateCompanyTargetPerformance } from '../lib/calculator.js';
import { DEFAULT_COMPANY_MONTHLY_EXPENSES } from '../lib/defaults.js';

console.log('🧪 Running Test: Editable Company Performance & Target Engine...');

// 1. Verify default baseline requirement equals ₹4,60,000
const baseline = calculateCompanyTargetPerformance({
  companyExpenses: DEFAULT_COMPANY_MONTHLY_EXPENSES,
  activeClients: [
    { id: 'sub_1', clientName: 'Apex Law Chambers', monthlyFee: 12500, avgMonthlySpend: 4900, monthlyContribution: 7600 },
  ],
  selectedPlanContribution: 10608,
});

assert.strictEqual(baseline.totalCompanyMonthlyRequirement, 460000, 'Baseline requirement is 4,60,000');
assert.strictEqual(baseline.totalActiveClients, 1, '1 active client');
assert.strictEqual(baseline.totalMonthlySubscriptionRevenue, 12500, '12,500 revenue');
assert.strictEqual(baseline.totalMonthlyContribution, 7600, '7,600 contribution');
assert.strictEqual(baseline.remainingRequirement, 452400, 'Remaining requirement is 4,52,400');
assert.strictEqual(baseline.additionalPlansNeeded, 43, 'Ceil(452,400 / 10,608) = 43 plans');
assert.strictEqual(baseline.isTargetReached, false, 'Target not reached');
console.log('✅ PASS: Baseline matches user prompt exact figures');

// 2. Verify editing Salary, Rent, Marketing, Other
const editedExpenses = {
  employeeSalaries: 200000, // reduced by 100k
  officeRent: 40000,        // reduced by 10k
  petrolTravel: 10000,      // reduced by 5k
  technologySoftware: 15000,// reduced by 5k
  marketing: 25000,         // reduced by 10k
  otherInvestments: 0,
  otherExpenses: 30000,     // other set to 30k
};

const editedPerf = calculateCompanyTargetPerformance({
  companyExpenses: editedExpenses,
  activeClients: [
    { id: 'sub_1', clientName: 'Apex Law Chambers', monthlyFee: 12500, avgMonthlySpend: 4900, monthlyContribution: 7600 },
  ],
  selectedPlanContribution: 10608,
});

// Total: 200k + 40k + 10k + 15k + 25k + 30k = 320,000
assert.strictEqual(editedPerf.totalCompanyMonthlyRequirement, 320000, 'Edited total requirement is 3,20,000');
assert.strictEqual(editedPerf.remainingRequirement, 320000 - 7600, 'Remaining is 312,400');
assert.strictEqual(editedPerf.additionalPlansNeeded, Math.ceil(312400 / 10608), '30 plans needed');
console.log('✅ PASS: Editing expense values accurately updates requirement & plans needed');

// 3. Verify adding custom overhead items
const withCustomExpenses = {
  ...editedExpenses,
  customItems: [
    { id: 'cust_1', name: 'Legal & Accounting', amount: 15000 },
    { id: 'cust_2', name: 'Utilities', amount: 5000 },
  ],
};

const customPerf = calculateCompanyTargetPerformance({
  companyExpenses: withCustomExpenses,
  activeClients: [
    { id: 'sub_1', clientName: 'Apex Law Chambers', monthlyFee: 12500, avgMonthlySpend: 4900, monthlyContribution: 7600 },
  ],
  selectedPlanContribution: 10608,
});

// 320k + 15k + 5k = 340,000
assert.strictEqual(customPerf.totalCompanyMonthlyRequirement, 340000, 'Includes custom overhead items');
console.log('✅ PASS: Custom overhead items are integrated into total requirement');

// 4. Verify scenario contribution override
const scenarioPerf = calculateCompanyTargetPerformance({
  companyExpenses: withCustomExpenses,
  activeClients: [
    { id: 'sub_1', clientName: 'Apex Law Chambers', monthlyFee: 12500, avgMonthlySpend: 4900, monthlyContribution: 7600 },
  ],
  selectedPlanContribution: 15000, // user overridden scenario contribution
});

// Remaining: 340,000 - 7,600 = 332,400. 332,400 / 15,000 = 22.16 -> 23 plans
assert.strictEqual(scenarioPerf.additionalPlansNeeded, Math.ceil(332400 / 15000), '23 plans needed with custom scenario contribution');
console.log('✅ PASS: Scenario plan contribution override dynamically recalculates plans needed');

// 5. Verify Target Reached state when contribution exceeds requirement
const targetReached = calculateCompanyTargetPerformance({
  companyExpenses: {
    employeeSalaries: 50000,
  },
  activeClients: [
    { id: 'c1', clientName: 'Big Corp', monthlyFee: 100000, avgMonthlySpend: 20000, monthlyContribution: 80000 },
  ],
  selectedPlanContribution: 10608,
});

assert.strictEqual(targetReached.isTargetReached, true, 'Target is reached');
assert.strictEqual(targetReached.remainingRequirement, 0, 'No deficit remaining');
assert.strictEqual(targetReached.additionalPlansNeeded, 0, '0 additional plans needed');
assert.strictEqual(targetReached.surplus, 30000, 'Surplus of ₹30,000');
console.log('✅ PASS: Target Reached state correctly shows 0 remaining requirement and 0 plans needed');

// 6. Verify One-Time Technology Investment (CapEx excluded from monthly recurring requirement)
const oneTimeTechExpenses = {
  employeeSalaries: 50000,
  officeRent: 30000,
  petrolTravel: 5000,
  technologySoftware: 500000,
  technologyIsOneTime: true,
  marketing: 0,
  otherExpenses: 25000,
};

const oneTimePerf = calculateCompanyTargetPerformance({
  companyExpenses: oneTimeTechExpenses,
  activeClients: [
    { id: 'sub_1', clientName: 'Asiapaints', monthlyFee: 12500, avgMonthlySpend: 4900, monthlyContribution: 7600 },
  ],
  selectedPlanContribution: 10608,
});

// Total recurring requirement: 50k + 30k + 5k + 0 + 25k = 110,000 (Technology 500,000 is excluded from monthly requirement)
assert.strictEqual(oneTimePerf.totalCompanyMonthlyRequirement, 110000, 'Monthly recurring requirement is ₹1,10,000');
assert.strictEqual(oneTimePerf.totalOneTimeInvestment, 500000, 'One-time investment is ₹5,00,000');
assert.strictEqual(oneTimePerf.isTechnologyOneTime, true, 'Technology is flagged as one-time');
assert.strictEqual(oneTimePerf.remainingRequirement, 110000 - 7600, 'Remaining deficit is ₹1,02,400');
assert.strictEqual(oneTimePerf.additionalPlansNeeded, Math.ceil((110000 - 7600) / 10608), '10 Essential plans needed');
console.log('✅ PASS: One-time technology investment is properly separated from recurring monthly expenses');

console.log('\n🎉 ALL EDITABLE COMPANY PERFORMANCE TESTS PASSED!');
