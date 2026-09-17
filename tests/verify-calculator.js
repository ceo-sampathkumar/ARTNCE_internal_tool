import {
  buildBreakdown,
  calculatePricing,
  toFeet,
  DEFAULT_SETTINGS,
  DEFAULT_PRICING,
  calculatePaintingCost,
  calculateBatchSummary,
  calculateSubscriptionEconomics,
  calculateCompanyOperatingCosts,
  calculateCuratorFee,
  calculatePlanEconomics,
  calculatePortfolioSustainability,
  DEFAULT_COMPANY_COSTS,
  DEFAULT_PLANS,
  DEFAULT_PORTFOLIO_MIX,
  createDefaultBatch,
  createDefaultCustomPlan,
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

// 13. Batch Empty Starter Rows Test
const defaultBatch = createDefaultBatch();
assert(defaultBatch.length === 5, 'Starter batch has 5 slots');
const defaultBatchSummary = calculateBatchSummary(defaultBatch, DEFAULT_SETTINGS);
assert(defaultBatchSummary.count === 5, 'Starter batch count is 5 slots');
assert(defaultBatchSummary.validCount === 0, 'Starter batch has 0 valid/calculated paintings');
assert(defaultBatchSummary.totalProductionCost === 0, 'Empty starter batch total production cost is ₹0');

// 14. Company Operating Costs & Employee Pool Test
const defaultCompanyCosts = calculateCompanyOperatingCosts(DEFAULT_COMPANY_COSTS);
assert(defaultCompanyCosts.employeeCount === 3, 'Employee count is 3');
assertClose(defaultCompanyCosts.totalEmployeeSalary, 300000, 0.01, '3 employees combined = ₹3,00,000 TOTAL per month (not per employee)');

// Add, edit, remove employee test
const customEmployees = [
  ...DEFAULT_COMPANY_COSTS.employees,
  { id: 'emp_4', name: 'Apprentice', role: 'Support', monthlySalary: 50000 },
];
const updatedCompanyCosts = calculateCompanyOperatingCosts({
  ...DEFAULT_COMPANY_COSTS,
  employees: customEmployees,
});
assert(updatedCompanyCosts.employeeCount === 4, 'Can add employee to pool');
assertClose(updatedCompanyCosts.totalEmployeeSalary, 350000, 0.01, 'Employee pool sum updates when employee is added');

// 15. Bike Reimbursement Test
assertClose(defaultCompanyCosts.bikeRate, 3, 0.01, 'Bike reimbursement rate is ₹3 per km');
assertClose(defaultCompanyCosts.bikeKm, 2000, 0.01, 'Default company purpose km is 2,000 km');
assertClose(defaultCompanyCosts.monthlyBikeReimbursement, 6000, 0.01, 'Bike reimbursement: 2,000 km × ₹3 = ₹6,000/month');

// 16. Employee Allocation Test
const profEconomics = calculatePlanEconomics(
  DEFAULT_PLANS.professional,
  DEFAULT_COMPANY_COSTS,
  curatedSummary,
  DEFAULT_SETTINGS
);
assertClose(profEconomics.companyEmployeePool, 300000, 0.01, 'Professional plan accesses ₹3,00,000 company employee pool');
assertClose(profEconomics.allocatedEmployeeSalary, 60000, 0.01, '20% allocation of ₹3,00,000 = ₹60,000/month (not 100%)');
assert(profEconomics.allocatedEmployeeSalary < profEconomics.companyEmployeePool, 'Does not charge 100% of employee pool to single plan');

// 17. Curator Project/Cycle Cost Test (NOT monthly salary)
const singleCycleCurator = calculateCuratorFee({ feePerCycle: 2000, cycles: 1 });
assertClose(singleCycleCurator.totalCuratorCost, 2000, 0.01, 'Curator fee: 1 visit at ₹2,000 = ₹2,000 total');
const twoCycleCurator = calculateCuratorFee({ feePerCycle: 2000, cycles: 2 });
assertClose(twoCycleCurator.totalCuratorCost, 4000, 0.01, 'Curator fee across 2 recycle cycles at ₹2,000 = ₹4,000 total');

// 18. Distinct Cost Categories Test
assert(profEconomics.curator.totalCuratorCost === 2000, 'Curator project fee is categorized under project costs');
assert(profEconomics.installation.total === 1500, 'Installation is categorized separately');
assert(profEconomics.logistics.total === 1200, 'Logistics is categorized separately');
assert(profEconomics.maintenanceMonthly === 500, 'Maintenance is categorized under monthly recurring');
assert(profEconomics.artistRecurringMonthly === 1000, 'Artist recurring payment is categorized under monthly recurring');

// 19. All Four Plans Calculate Independently
const essentialEcon = calculatePlanEconomics(DEFAULT_PLANS.essential, DEFAULT_COMPANY_COSTS);
const enterpriseEcon = calculatePlanEconomics(DEFAULT_PLANS.enterprise, DEFAULT_COMPANY_COSTS);
const signatureEcon = calculatePlanEconomics(DEFAULT_PLANS.signature, DEFAULT_COMPANY_COSTS);

assert(essentialEcon.monthlySubscription === 6500, 'Essential monthly subscription is independent');
assert(enterpriseEcon.monthlySubscription === 25000, 'Enterprise monthly subscription is independent');
assert(signatureEcon.monthlySubscription === 18000, 'Signature monthly subscription is independent');
assert(essentialEcon.allocatedEmployeeSalary !== enterpriseEcon.allocatedEmployeeSalary, 'Employee allocations differ between plans');

// Signature supports custom inputs
const customSignaturePlan = {
  ...DEFAULT_PLANS.signature,
  spaceSqFt: 4200,
  artworkCount: 10,
  customInitialInvestment: 65000,
  monthlySubscription: 22000,
};
const customSignatureEcon = calculatePlanEconomics(customSignaturePlan, DEFAULT_COMPANY_COSTS);
assert(customSignatureEcon.initialInvestment === 65000, 'Signature allows custom initial artwork investment');
assert(customSignatureEcon.monthlySubscription === 22000, 'Signature allows custom monthly subscription price');

// 20. Empty Initial Investment Handling Test
const zeroInvestmentEcon = calculateSubscriptionEconomics({
  initialInvestment: 0,
  monthlySubscription: 10000,
  operatingCosts: 4000,
});
assert(zeroInvestmentEcon.simpleRecoveryMonths === null, 'Simple recovery is null when initial investment is 0');
assert(zeroInvestmentEcon.estimatedRecoveryMonths === null, 'Estimated recovery is null when initial investment is 0');
assert(zeroInvestmentEcon.isRecoveryAchievable === false, 'Recovery achievable is false when initial investment is 0');
assert(zeroInvestmentEcon.unachievableReason.includes('No curated artworks selected'), 'Shows "No curated artworks selected" message');
assert(zeroInvestmentEcon.scenarios[0].isRecovered === false, 'Does not display Recovered: Yes when investment is 0');

// 21. Specification Section 19 Exact Benchmark Test
const sec19 = calculateSubscriptionEconomics({
  initialInvestment: 30000,
  monthlySubscription: 10000,
  monthlyOperatingCosts: 4000,
});
assertClose(sec19.monthlyContribution, 6000, 0.01, 'Section 19: Monthly Contribution is ₹6,000');
assertClose(sec19.simpleRecoveryMonths, 3, 0.01, 'Section 19: Simple Artwork Recovery is 3 months');
assertClose(sec19.estimatedRecoveryMonths, 5, 0.01, 'Section 19: Estimated Investment Recovery is 5 months');

const sec19_3 = sec19.scenarios.find((s) => s.months === 3);
assertClose(sec19_3.totalRevenue, 30000, 0.01, 'Section 19: 3 mo revenue is ₹30,000');
assertClose(sec19_3.operatingCostsTotal, 12000, 0.01, 'Section 19: 3 mo operating costs is ₹12,000');
assertClose(sec19_3.totalContribution, 18000, 0.01, 'Section 19: 3 mo contribution is ₹18,000');
assertClose(sec19_3.contributionAfterInvestment, -12000, 0.01, 'Section 19: 3 mo contribution after investment is -₹12,000');

const sec19_6 = sec19.scenarios.find((s) => s.months === 6);
assertClose(sec19_6.totalRevenue, 60000, 0.01, 'Section 19: 6 mo revenue is ₹60,000');
assertClose(sec19_6.operatingCostsTotal, 24000, 0.01, 'Section 19: 6 mo operating costs is ₹24,000');
assertClose(sec19_6.totalContribution, 36000, 0.01, 'Section 19: 6 mo contribution is ₹36,000');
assertClose(sec19_6.contributionAfterInvestment, 6000, 0.01, 'Section 19: 6 mo contribution after investment is ₹6,000');

const sec19_12 = sec19.scenarios.find((s) => s.months === 12);
assertClose(sec19_12.totalRevenue, 120000, 0.01, 'Section 19: 12 mo revenue is ₹1,20,000');
assertClose(sec19_12.operatingCostsTotal, 48000, 0.01, 'Section 19: 12 mo operating costs is ₹48,000');
assertClose(sec19_12.totalContribution, 72000, 0.01, 'Section 19: 12 mo contribution is ₹72,000');
assertClose(sec19_12.contributionAfterInvestment, 42000, 0.01, 'Section 19: 12 mo contribution after investment is ₹42,000');

const sec19_24 = sec19.scenarios.find((s) => s.months === 24);
assertClose(sec19_24.totalRevenue, 240000, 0.01, 'Section 19: 24 mo revenue is ₹2,40,000');
assertClose(sec19_24.operatingCostsTotal, 96000, 0.01, 'Section 19: 24 mo operating costs is ₹96,000');
assertClose(sec19_24.totalContribution, 144000, 0.01, 'Section 19: 24 mo contribution is ₹1,44,000');
assertClose(sec19_24.contributionAfterInvestment, 114000, 0.01, 'Section 19: 24 mo contribution after investment is ₹1,14,000');

console.log('\n--- Testing Full Customization of Artwork Scope and Space Size per Plan ---');

// Setup a pool of 10 test paintings with varying sizes and costs
const testPool = [
  { id: 'p1', width: '3', height: '4', unit: 'ft', title: 'Executive Canvas #1' }, // 12 sq ft, ₹5,508
  { id: 'p2', width: '2', height: '3', unit: 'ft', title: 'Corridor Piece #2' },   // 6 sq ft
  { id: 'p3', width: '4', height: '5', unit: 'ft', title: 'Lobby Centerpiece #3' },// 20 sq ft
  { id: 'p4', width: '2.5', height: '3.5', unit: 'ft', title: 'Meeting Room #4' }, // 8.75 sq ft
  { id: 'p5', width: '3', height: '3', unit: 'ft', title: 'Reception Focus #5' },   // 9 sq ft
  { id: 'p6', width: '2', height: '2', unit: 'ft', title: 'Accent #6' },           // 4 sq ft
  { id: 'p7', width: '3.5', height: '4.5', unit: 'ft', title: 'Boardroom West #7' },// 15.75 sq ft
  { id: 'p8', width: '4', height: '6', unit: 'ft', title: 'Atrium Large #8' },    // 24 sq ft
  { id: 'p9', width: '1.5', height: '2', unit: 'ft', title: 'Nook #9' },           // 3 sq ft
  { id: 'p10', width: '5', height: '5', unit: 'ft', title: 'Grand Suite #10' },   // 25 sq ft
];
const poolSummary = calculateBatchSummary(testPool, DEFAULT_SETTINGS);

// Test 22: Essential artwork scope can be changed (e.g. 2 artworks or 6 artworks)
const essentialClientA = {
  ...DEFAULT_PLANS.essential,
  spaceSqFt: 1200,
  selectedPaintingIds: ['p1', 'p2'],
};
const essentialEconA = calculatePlanEconomics(essentialClientA, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(essentialEconA.planId === 'essential', 'Essential Client A remains Essential plan');
assert(essentialEconA.artworkCount === 2, 'Essential artwork count can be changed to 2');
assert(essentialEconA.spaceSqFt === 1200, 'Essential space can be customized to 1,200 sq ft');
assert(essentialEconA.initialInvestment > 0, 'Essential initial investment calculated from actual 2 artworks');

const essentialClientB = {
  ...DEFAULT_PLANS.essential,
  spaceSqFt: 2200,
  selectedPaintingIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
};
const essentialEconB = calculatePlanEconomics(essentialClientB, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(essentialEconB.planId === 'essential', 'Essential Client B remains Essential plan despite 6 artworks');
assert(essentialEconB.artworkCount === 6, 'Essential artwork count can be changed to 6');
assert(essentialEconB.spaceSqFt === 2200, 'Essential space can be customized to 2,200 sq ft');
assert(essentialEconB.initialInvestment > essentialEconA.initialInvestment, 'Essential investment scales with more artworks');

// Test 23: Professional artwork scope can be changed (Client A: 4 artworks / 1,800 sq ft vs Client B: 8 artworks / 3,500 sq ft)
const profClientA = {
  ...DEFAULT_PLANS.professional,
  spaceSqFt: 1800,
  selectedPaintingIds: ['p1', 'p2', 'p3', 'p4'],
};
const profEconA = calculatePlanEconomics(profClientA, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(profEconA.planId === 'professional', 'Professional Client A is still Professional');
assert(profEconA.artworkCount === 4, 'Professional Client A has 4 artworks');
assert(profEconA.spaceSqFt === 1800, 'Professional Client A space is 1,800 sq ft');

const profClientB = {
  ...DEFAULT_PLANS.professional,
  spaceSqFt: 3500,
  selectedPaintingIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
};
const profEconB = calculatePlanEconomics(profClientB, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(profEconB.planId === 'professional', 'Professional Client B is still Professional');
assert(profEconB.artworkCount === 8, 'Professional Client B has 8 artworks');
assert(profEconB.spaceSqFt === 3500, 'Professional Client B space is 3,500 sq ft');
assert(profEconB.initialInvestment > profEconA.initialInvestment, 'Professional investment updates automatically with collection size');
assert(profEconA.monthlySubscription === 10000 && profEconB.monthlySubscription === 10000, 'Professional subscription price is commercial framework and independent');

// Test 24: Enterprise artwork scope can be changed (e.g. 4 artworks or 10 artworks)
const enterpriseClientA = {
  ...DEFAULT_PLANS.enterprise,
  spaceSqFt: 4500,
  selectedPaintingIds: ['p1', 'p3', 'p5', 'p7'],
};
const enterpriseEconA = calculatePlanEconomics(enterpriseClientA, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(enterpriseEconA.planId === 'enterprise', 'Enterprise Client A is still Enterprise');
assert(enterpriseEconA.artworkCount === 4, 'Enterprise artwork count can be changed to 4');
assert(enterpriseEconA.spaceSqFt === 4500, 'Enterprise space can be changed to 4,500 sq ft');

// Test 25: Signature artwork scope can be changed
const sigClient = {
  ...DEFAULT_PLANS.signature,
  spaceSqFt: 7500,
  selectedPaintingIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
};
const sigEcon = calculatePlanEconomics(sigClient, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(sigEcon.planId === 'signature', 'Signature plan identity preserved');
assert(sigEcon.artworkCount === 10, 'Signature artwork count matches 10 selected paintings');
assert(sigEcon.spaceSqFt === 7500, 'Signature space is 7,500 sq ft');

// Test 26: Actual curated artwork selection drives investment
const sumP1P2P3 = calculateBatchSummary([testPool[0], testPool[1], testPool[2]], DEFAULT_SETTINGS);
const planCuratedSelected = {
  ...DEFAULT_PLANS.professional,
  selectedPaintingIds: ['p1', 'p2', 'p3'],
};
const planCuratedEcon = calculatePlanEconomics(planCuratedSelected, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assertClose(planCuratedEcon.initialInvestment, sumP1P2P3.totalProductionCost, 0.01, 'Actual curated artwork selection drives initial investment');
assertClose(planCuratedEcon.totalArea, sumP1P2P3.totalArea, 0.01, 'Actual curated artwork selection drives total area');
assert(planCuratedEcon.artworkCount === 3, 'Actual curated artwork count is 3');

// Test 27: Removing artwork updates investment immediately
const planAfterRemove = {
  ...planCuratedSelected,
  selectedPaintingIds: ['p1', 'p3'],
};
const econAfterRemove = calculatePlanEconomics(planAfterRemove, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(econAfterRemove.artworkCount === 2, 'Removing artwork decreases count to 2');
assert(econAfterRemove.initialInvestment < planCuratedEcon.initialInvestment, 'Removing artwork decreases initial investment');
const sumP1P3 = calculateBatchSummary([testPool[0], testPool[2]], DEFAULT_SETTINGS);
assertClose(econAfterRemove.initialInvestment, sumP1P3.totalProductionCost, 0.01, 'Initial investment equals exactly remaining paintings');

// Test 28: Adding artwork updates investment immediately
const planAfterAdd = {
  ...planAfterRemove,
  selectedPaintingIds: ['p1', 'p3', 'p4'],
};
const econAfterAdd = calculatePlanEconomics(planAfterAdd, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(econAfterAdd.artworkCount === 3, 'Adding artwork increases count to 3');
assert(econAfterAdd.initialInvestment > econAfterRemove.initialInvestment, 'Adding artwork increases initial investment');
const sumP1P3P4 = calculateBatchSummary([testPool[0], testPool[2], testPool[3]], DEFAULT_SETTINGS);
assertClose(econAfterAdd.initialInvestment, sumP1P3P4.totalProductionCost, 0.01, 'Initial investment equals exactly updated set');

// Test 29: Changing space size updates project scope and curator workload
const spaceSmall = { ...DEFAULT_PLANS.professional, spaceSqFt: 1500, selectedPaintingIds: ['p1', 'p2'] };
const spaceLarge = { ...DEFAULT_PLANS.professional, spaceSqFt: 4500, selectedPaintingIds: ['p1', 'p2'] };
const econSpaceSmall = calculatePlanEconomics(spaceSmall, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
const econSpaceLarge = calculatePlanEconomics(spaceLarge, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(econSpaceSmall.spaceSqFt === 1500, 'Small space evaluates to 1,500 sq ft');
assert(econSpaceLarge.spaceSqFt === 4500, 'Large space evaluates to 4,500 sq ft');
assert(econSpaceSmall.curator.spaceSqFt === 1500, 'Curator workload basis reflects 1,500 sq ft');
assert(econSpaceLarge.curator.spaceSqFt === 4500, 'Curator workload basis reflects 4,500 sq ft');
assert(econSpaceSmall.planId === econSpaceLarge.planId, 'Changing space size does NOT change plan identity');

// Test 30: Plan defaults are not treated as fixed limits
assert(typeof DEFAULT_PLANS.essential.exampleScenarioLabel === 'string', 'Essential has exampleScenarioLabel');
assert(typeof DEFAULT_PLANS.professional.exampleScenarioLabel === 'string', 'Professional has exampleScenarioLabel');
assert(typeof DEFAULT_PLANS.enterprise.exampleScenarioLabel === 'string', 'Enterprise has exampleScenarioLabel');
assert(DEFAULT_PLANS.essential.exampleScenarioLabel.includes('Example Planning Scenario'), 'Default is clearly labeled as Example Planning Scenario');

// Test 31: Subscription price remains independent from artwork production cost
const planFixedCostA = { ...DEFAULT_PLANS.professional, selectedPaintingIds: ['p1'], monthlySubscription: 8000 };
const planFixedCostB = { ...DEFAULT_PLANS.professional, selectedPaintingIds: ['p1'], monthlySubscription: 14000 };
const econFixedCostA = calculatePlanEconomics(planFixedCostA, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
const econFixedCostB = calculatePlanEconomics(planFixedCostB, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assertClose(econFixedCostA.initialInvestment, econFixedCostB.initialInvestment, 0.0001, 'Artwork production cost is identical regardless of subscription price');
assert(econFixedCostB.monthlyContribution > econFixedCostA.monthlyContribution, 'Higher subscription price yields higher contribution');
assert(econFixedCostB.simpleRecoveryMonths < econFixedCostA.simpleRecoveryMonths, 'Higher subscription price yields faster simple recovery');

// =========================================================================
// TEST 32: Plan values NEVER cross-contaminate (Complete Independence)
// =========================================================================
console.log('\n--- Test 32: Plan values NEVER cross-contaminate ---');
const isolatedPlans = {
  essential: { ...DEFAULT_PLANS.essential },
  professional: { ...DEFAULT_PLANS.professional },
  enterprise: { ...DEFAULT_PLANS.enterprise },
  signature: { ...DEFAULT_PLANS.signature },
};

// 1. Changing Professional subscription from 10,000 to 15,000
isolatedPlans.professional = { ...isolatedPlans.professional, monthlySubscription: 15000 };
assert(isolatedPlans.professional.monthlySubscription === 15000, 'Professional subscription updated to 15,000');
assert(isolatedPlans.enterprise.monthlySubscription === 25000, 'Enterprise subscription remains untouched at 25,000');
assert(isolatedPlans.essential.monthlySubscription === 6500, 'Essential subscription remains untouched at 6,500');
assert(isolatedPlans.signature.monthlySubscription === 18000, 'Signature subscription remains untouched at 18,000');

// 2. Changing Professional artwork count from 5 to 8
isolatedPlans.professional = { ...isolatedPlans.professional, customArtworkCount: 8 };
assert(isolatedPlans.professional.customArtworkCount === 8, 'Professional artwork count changed to 8');
assert(isolatedPlans.essential.customArtworkCount === 3, 'Essential artwork count remains untouched at 3');
assert(isolatedPlans.enterprise.customArtworkCount === 12, 'Enterprise artwork count remains untouched at 12');

// 3. Changing Enterprise maintenance from 1,500 to 3,000
isolatedPlans.enterprise = { ...isolatedPlans.enterprise, maintenanceMonthly: 3000 };
assert(isolatedPlans.enterprise.maintenanceMonthly === 3000, 'Enterprise maintenance changed to 3,000');
assert(isolatedPlans.professional.maintenanceMonthly === 500, 'Professional maintenance remains untouched at 500');
assert(isolatedPlans.essential.maintenanceMonthly === 300, 'Essential maintenance remains untouched at 300');

// 4. Changing Essential employee allocation from 5% to 15%
isolatedPlans.essential = { ...isolatedPlans.essential, employeeAllocationPercent: 15 };
assert(isolatedPlans.essential.employeeAllocationPercent === 15, 'Essential employee allocation updated to 15%');
assert(isolatedPlans.professional.employeeAllocationPercent === 20, 'Professional employee allocation remains untouched at 20%');
assert(isolatedPlans.enterprise.employeeAllocationPercent === 35, 'Enterprise employee allocation remains untouched at 35%');

// 5. Changing Professional rotation cycles from 1 to 3
isolatedPlans.professional = {
  ...isolatedPlans.professional,
  rotation: { ...isolatedPlans.professional.rotation, cycles: 3 },
};
assert(isolatedPlans.professional.rotation.cycles === 3, 'Professional rotation cycles changed to 3');
assert(isolatedPlans.essential.rotation.cycles === 1, 'Essential rotation cycles remains untouched at 1');
assert(isolatedPlans.enterprise.rotation.cycles === 4, 'Enterprise rotation cycles remains untouched at 4');

// 6. Changing Enterprise packaging from 1,200 to 2,000
isolatedPlans.enterprise = {
  ...isolatedPlans.enterprise,
  packaging: { ...isolatedPlans.enterprise.packaging, feePerCycle: 2000 },
};
assert(isolatedPlans.enterprise.packaging.feePerCycle === 2000, 'Enterprise packaging fee changed to 2,000');
assert(isolatedPlans.professional.packaging.feePerCycle === 600, 'Professional packaging fee remains untouched at 600');
assert(isolatedPlans.essential.packaging.feePerCycle === 400, 'Essential packaging fee remains untouched at 400');

// Verify output economic models evaluate completely independently
const econEss = calculatePlanEconomics(isolatedPlans.essential, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
const econProf = calculatePlanEconomics(isolatedPlans.professional, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
const econEnt = calculatePlanEconomics(isolatedPlans.enterprise, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
const econSig = calculatePlanEconomics(isolatedPlans.signature, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);

assert(econProf.monthlySubscription === 15000, 'Evaluated Professional subscription is 15,000');
assert(econEnt.monthlySubscription === 25000, 'Evaluated Enterprise subscription is 25,000');
assert(econEss.monthlySubscription === 6500, 'Evaluated Essential subscription is 6,500');
assert(econSig.monthlySubscription === 18000, 'Evaluated Signature subscription is 18,000');

// =========================================================================
// TEST 33: Whiteboard Model for Every Plan (2-Tier Waterfall)
// =========================================================================
console.log('\n--- Test 33: Whiteboard Model 2-Tier Contribution Waterfall ---');
[econEss, econProf, econEnt, econSig].forEach((econ) => {
  // Level 1: Client Contribution Before Company Overhead
  const expectedLevel1 = econ.monthlySubscription - econ.totalMonthlyClientDeliveryCost;
  assertClose(
    econ.monthlyContributionBeforeOverhead,
    expectedLevel1,
    0.001,
    `[${econ.planName}] Level 1 Client Contribution = Subscription (${econ.monthlySubscription}) - Direct Delivery (${econ.totalMonthlyClientDeliveryCost})`
  );

  // Level 2: Contribution After Company Overhead Allocation
  const expectedLevel2 = econ.monthlyContributionBeforeOverhead - econ.totalCompanyOverheadAllocation;
  assertClose(
    econ.monthlyContribution,
    expectedLevel2,
    0.001,
    `[${econ.planName}] Level 2 Contribution After Overhead = Client Contribution (${econ.monthlyContributionBeforeOverhead}) - Allocated Overhead (${econ.totalCompanyOverheadAllocation})`
  );
});

// =========================================================================
// TEST 34: Rotation and Packaging are Independent Project Cycles
// =========================================================================
console.log('\n--- Test 34: Rotation and Packaging independent per plan ---');
assert(econEss.rotation.total === 1000, 'Essential rotation is 1 cycle @ ₹1,000 = ₹1,000');
assert(econProf.rotation.total === 4500, 'Professional rotation is 3 cycles @ ₹1,500 = ₹4,500');
assert(econEnt.rotation.total === 12000, 'Enterprise rotation is 4 cycles @ ₹3,000 = ₹12,000');
assert(econEss.packaging.total === 400, 'Essential packaging is 1 cycle @ ₹400 = ₹400');
assert(econEnt.packaging.total === 8000, 'Enterprise packaging is 4 cycles @ ₹2,000 = ₹8,000');

// Project costs must NOT be included in monthly direct delivery costs
assert(
  econEss.totalMonthlyClientDeliveryCost ===
    econEss.maintenanceMonthly +
    econEss.artistRecurringMonthly +
    econEss.manpowerMonthly +
    econEss.travelMonthlyAllocation +
    econEss.packagingMonthly,
  'Monthly client delivery cost contains only direct monthly items, not project cycles'
);

// =========================================================================
// TEST 35: Custom Plan Creation & Independence
// =========================================================================
console.log('\n--- Test 35: Custom Plan Creation & Independence ---');
const customPlan = createDefaultCustomPlan('custom_vip_99', 'VIP Flagship Plan');
assert(customPlan.id === 'custom_vip_99', 'Custom plan ID initialized correctly');
assert(customPlan.name === 'VIP Flagship Plan', 'Custom plan name initialized correctly');
assert(customPlan.isCustom === true, 'Custom plan flagged as isCustom');
assert(typeof customPlan.monthlySubscription === 'number', 'Custom plan has independent monthlySubscription');
assert(typeof customPlan.curator === 'object', 'Custom plan has independent curator configuration');
assert(typeof customPlan.rotation === 'object', 'Custom plan has independent rotation configuration');
assert(typeof customPlan.packaging === 'object', 'Custom plan has independent packaging configuration');

const customEcon = calculatePlanEconomics(customPlan, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings);
assert(customEcon.planId === 'custom_vip_99', 'Custom plan economics evaluates correctly');
assert(customEcon.monthlyContributionBeforeOverhead > 0, 'Custom plan computes Level 1 Client Contribution');
assert(typeof customEcon.monthlyContribution === 'number', 'Custom plan computes Level 2 Contribution After Overhead');

// Modifying custom plan does not alter DEFAULT_PLANS
customPlan.monthlySubscription = 45000;
assert(DEFAULT_PLANS.professional.monthlySubscription === 10000, 'Standard plans untouched when custom plan modified');

// =========================================================================
// TEST 36: Company Sustainability & Portfolio Mix Model
// =========================================================================
console.log('\n--- Test 36: Company Sustainability & Portfolio Mix ---');
const allPlansDict = {
  essential: DEFAULT_PLANS.essential,
  professional: DEFAULT_PLANS.professional,
  enterprise: DEFAULT_PLANS.enterprise,
  signature: DEFAULT_PLANS.signature,
};

const allEconsDict = {
  essential: calculatePlanEconomics(DEFAULT_PLANS.essential, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings),
  professional: calculatePlanEconomics(DEFAULT_PLANS.professional, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings),
  enterprise: calculatePlanEconomics(DEFAULT_PLANS.enterprise, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings),
  signature: calculatePlanEconomics(DEFAULT_PLANS.signature, DEFAULT_COMPANY_COSTS, null, DEFAULT_SETTINGS, poolSummary.calculatedPaintings),
};

// Portfolio A: 20 Essential, 10 Professional, 5 Enterprise, 2 Signature
const portfolioMixA = { essential: 20, professional: 10, enterprise: 5, signature: 2 };
const sustainA = calculatePortfolioSustainability(allPlansDict, portfolioMixA, DEFAULT_COMPANY_COSTS, allEconsDict);

assert(sustainA.totalActiveClients === 37, 'Portfolio A has 20+10+5+2 = 37 active clients');
const expectedRevA = 20 * 6500 + 10 * 10000 + 5 * 25000 + 2 * 18000; // 130000 + 100000 + 125000 + 36000 = 391000
assert(sustainA.totalMonthlySubscriptionRevenue === expectedRevA, `Portfolio A total revenue is ₹${expectedRevA}`);
assert(sustainA.companyRecurringCost === 306000, 'Company recurring cost pool is ₹3,06,000 (₹3,00,000 staff + ₹6,000 bike)');
assert(
  sustainA.portfolioContributionAfterCompanyRecurringCosts ===
    sustainA.totalMonthlyClientContributionBeforeOverhead - sustainA.companyRecurringCost,
  'Portfolio net contribution correctly subtracts ₹3,06,000 company pool from client contribution'
);
assert(sustainA.portfolioBreakevenClients > 0, 'Portfolio breakeven active clients is calculated');
assert(typeof sustainA.isSustainable === 'boolean', 'Portfolio sustainability boolean flag computed');

// Portfolio B: Alternate mix (5 Essential, 15 Professional, 10 Enterprise, 3 Signature)
const portfolioMixB = { essential: 5, professional: 15, enterprise: 10, signature: 3 };
const sustainB = calculatePortfolioSustainability(allPlansDict, portfolioMixB, DEFAULT_COMPANY_COSTS, allEconsDict);

assert(sustainB.totalActiveClients === 33, 'Portfolio B has 5+15+10+3 = 33 active clients');
const expectedRevB = 5 * 6500 + 15 * 10000 + 10 * 25000 + 3 * 18000; // 32500 + 150000 + 250000 + 54000 = 486500
assert(sustainB.totalMonthlySubscriptionRevenue === expectedRevB, `Portfolio B total revenue is ₹${expectedRevB}`);
assert(sustainB.totalMonthlySubscriptionRevenue !== sustainA.totalMonthlySubscriptionRevenue, 'Portfolio B calculates independently from Portfolio A');

console.log('\n========================================');
console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}
