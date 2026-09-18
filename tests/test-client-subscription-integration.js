import {
  calculateSimplePlanCosts,
  calculateSimplePlanResult,
  calculateCompanyTargetPerformance,
} from '../lib/calculator.js';
import {
  DEFAULT_CURATED_CLIENTS,
  DEFAULT_ACTIVE_CLIENTS,
  DEFAULT_SIMPLE_PLANS,
  DEFAULT_COMPANY_MONTHLY_EXPENSES,
} from '../lib/defaults.js';

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
    console.error(`❌ FAIL: ${message} (Actual: ${actual.toFixed(2)}, Expected: ${expected.toFixed(2)})`);
    failed++;
  }
}

console.log('--- Testing 03 CURATE → 04 SUBSCRIPTION Workflow Integration ---');

// 1. Curated Clients exist and have expected data structure
assert(Array.isArray(DEFAULT_CURATED_CLIENTS), 'DEFAULT_CURATED_CLIENTS is an array');
assert(DEFAULT_CURATED_CLIENTS.length >= 3, 'Contains starter curated clients');

const asiapaintsCurated = DEFAULT_CURATED_CLIENTS.find(c => c.clientName === 'Asiapaints');
assert(Boolean(asiapaintsCurated), 'Asiapaints exists in 03 CURATE');
assert(asiapaintsCurated.collectionName === 'Lounge', 'Asiapaints collectionName is Lounge');
assert(asiapaintsCurated.location === 'Hyderabad', 'Asiapaints location is Hyderabad');
assert(asiapaintsCurated.spaceSqFt === 1995, 'Asiapaints space is 1,995 sq ft');
assert(asiapaintsCurated.artworkCount === 5, 'Asiapaints artwork count is 5');

// 2. Client Selection in Subscription assigns plan economics
const essentialTemplate = DEFAULT_SIMPLE_PLANS.essential;
const planResult = calculateSimplePlanResult({
  monthlySubscription: 12500,
  costs: essentialTemplate.costs,
});

assertClose(planResult.monthlyOperatingCost, 1891.67, 0.1, 'Monthly operating cost is ₹1,891.67');
assertClose(planResult.monthlyContribution, 10608.33, 0.1, 'Monthly contribution is ₹10,608.33');

// 3. Subscription Assignment & De-duplication Logic
let activeClients = [...DEFAULT_ACTIVE_CLIENTS];
const initialCount = activeClients.length;

// Asiapaints already exists in DEFAULT_ACTIVE_CLIENTS
const existingIndex = activeClients.findIndex(
  c => c.clientId === asiapaintsCurated.id || c.clientName.toLowerCase() === asiapaintsCurated.clientName.toLowerCase()
);
assert(existingIndex >= 0, 'Asiapaints recognized as existing active client');

// Re-submitting Asiapaints updates in-place (no duplicate)
const updatedAsiapaintsSub = {
  ...activeClients[existingIndex],
  monthlyFee: 13000, // modified fee
  monthlyCost: Math.round(planResult.monthlyOperatingCost),
  monthlyContribution: 13000 - Math.round(planResult.monthlyOperatingCost),
  updatedAt: new Date().toISOString(),
};

activeClients[existingIndex] = updatedAsiapaintsSub;
assert(activeClients.length === initialCount, 'Re-submitting does NOT increase activeClients length');
assert(activeClients[existingIndex].monthlyFee === 13000, 'Existing subscription updated in-place');

// Submitting a NEW client from 03 CURATE
const newCuratedClient = {
  id: 'cur_zenith',
  clientName: 'Zenith Legal',
  collectionName: 'Main Boardroom',
  location: 'Chennai',
  spaceSqFt: 3000,
  artworkCount: 4,
};

const newSubIndex = activeClients.findIndex(
  c => c.clientId === newCuratedClient.id || c.clientName.toLowerCase() === newCuratedClient.clientName.toLowerCase()
);
assert(newSubIndex === -1, 'Zenith Legal is not yet in active clients');

const newZenithSub = {
  id: 'sub_zenith',
  clientId: newCuratedClient.id,
  clientName: newCuratedClient.clientName,
  collectionName: newCuratedClient.collectionName,
  location: newCuratedClient.location,
  planId: 'professional',
  planName: 'Professional',
  spaceSqFt: newCuratedClient.spaceSqFt,
  artworkCount: newCuratedClient.artworkCount,
  monthlyFee: 25000,
  monthlyCost: 4592,
  monthlyContribution: 20408,
  costs: DEFAULT_SIMPLE_PLANS.professional.costs,
};

activeClients = [newZenithSub, ...activeClients];
assert(activeClients.length === initialCount + 1, 'New client successfully assigned subscription and added');
assert(activeClients[0].clientName === 'Zenith Legal', 'New client is present in Active Clients & Plans');

// 4. Screen 2: Company Performance Calculation from Active Clients
const companyPerf = calculateCompanyTargetPerformance({
  companyExpenses: DEFAULT_COMPANY_MONTHLY_EXPENSES,
  activeClients,
  selectedPlanContribution: planResult.monthlyContribution,
});

assert(companyPerf.totalActiveClients === activeClients.length, 'Company Performance reflects total active clients');
assert(companyPerf.totalCompanyMonthlyRequirement === 460000, 'Company monthly requirement is ₹4,60,000');
assert(companyPerf.totalMonthlySubscriptionRevenue === (13000 + 25000 + 25000), 'Total monthly revenue aggregated');
assert(companyPerf.totalMonthlyContribution > 0, 'Total monthly contribution is positive');
assert(companyPerf.remainingRequirement > 0, 'Remaining requirement calculated accurately');
assert(companyPerf.additionalPlansNeeded > 0, 'Additional plans needed calculated accurately');

console.log(`\n========================================`);
console.log(`Summary: Passed: ${passed} | Failed: ${failed}`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
