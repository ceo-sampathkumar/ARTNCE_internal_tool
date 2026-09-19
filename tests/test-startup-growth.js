import assert from 'node:assert';
import {
  calculateStartupGrowthProjection,
  calculateSinglePlanProjection,
  calculateFourPlanComparison,
  calculateFinancialJourneyMilestones,
  calculatePlanRequirements,
  calculateCustomMixBreakEven,
  getCleanPlanEconomics,
  calculateWeightedPlanMetrics,
  calculateTargetTimeline,
  formatCalendarDate,
  DEFAULT_GROWTH_SCENARIOS,
  DEFAULT_STARTUP_ASSUMPTIONS,
} from '../lib/startup-growth.js';

import {
  DEFAULT_SIMPLE_PLANS,
  DEFAULT_COMPANY_MONTHLY_EXPENSES,
} from '../lib/defaults.js';

console.log('--- RUNNING STARTUP GROWTH & FINANCIAL TARGET ENGINE TESTS ---');

// TEST 1: Clean Plan Economics (₹12,500 Plan Economics Test)
console.log('Test 1: Plan Economics calculations (Revenue, Direct Cost, Contribution, Margin)');
{
  const essentialEcon = getCleanPlanEconomics('essential', DEFAULT_SIMPLE_PLANS.essential);
  assert.strictEqual(essentialEcon.monthlyFee, 12500, 'Essential fee must be ₹12,500');
  assert(essentialEcon.directCost > 0, 'Direct cost must be positive');
  assert(essentialEcon.monthlyContribution > 0, 'Contribution must be positive');
  assert(essentialEcon.contributionMargin > 80, 'Contribution margin must exceed 80%');

  // Verify approximately ₹10,608 contribution
  assert(
    Math.abs(essentialEcon.monthlyContribution - 10608.33) < 1,
    `Essential contribution should be ~₹10,608.33, received ${essentialEcon.monthlyContribution}`
  );
  console.log(`  ✅ Passed: Essential Plan: Revenue ₹${essentialEcon.monthlyFee}, Direct Cost ₹${essentialEcon.directCost}, Contribution ₹${essentialEcon.monthlyContribution} (${essentialEcon.contributionMargin}% margin).`);
}

// TEST 2: Single-Plan Break-Even Requirements (Essential-only, etc.)
console.log('Test 2: Plans required to reach company break-even');
{
  const companyRequirement = 460000;
  const currentContribution = 10608;
  const currentClients = 1;

  const result = calculatePlanRequirements({
    companyRequirement,
    currentContribution,
    currentActiveClients: currentClients,
    plans: DEFAULT_SIMPLE_PLANS,
  });

  assert.strictEqual(result.requiredAdditionalContribution, companyRequirement - currentContribution);
  const essentialReq = result.plans.essential;
  assert(essentialReq.additionalPlansRequired > 0, 'Must require positive additional plans');
  assert.strictEqual(
    essentialReq.totalClientsAtBreakEven,
    currentClients + essentialReq.additionalPlansRequired,
    'Total clients at break-even must equal current + additional'
  );

  // Professional requires fewer plans because contribution is higher
  const profReq = result.plans.professional;
  assert(
    profReq.additionalPlansRequired < essentialReq.additionalPlansRequired,
    'Professional should require fewer plans than Essential'
  );
  console.log(`  ✅ Passed: Essential needs ${essentialReq.additionalPlansRequired} plans, Professional needs ${profReq.additionalPlansRequired} plans.`);
}

// TEST 3: Mixed Plan Target Modeler
console.log('Test 3: Mixed Plan Break-Even Modeler');
{
  const companyRequirement = 460000;
  // Mix: 20 Essential, 10 Professional, 5 Enterprise, 2 Signature
  const mix = {
    essential: 20,
    professional: 10,
    enterprise: 5,
    signature: 2,
  };

  const evalMix = calculateCustomMixBreakEven({
    mixCounts: mix,
    plans: DEFAULT_SIMPLE_PLANS,
    companyRequirement,
  });

  assert.strictEqual(evalMix.totalClients, 37);
  assert(evalMix.totalRevenue > 0);
  assert(evalMix.totalContribution > 0);
  assert(evalMix.contributionMargin > 0);
  assert(['TARGET NOT REACHED', 'BREAK-EVEN REACHED', 'PROFITABLE'].includes(evalMix.targetStatus));
  console.log(`  ✅ Passed: Mix evaluates ${evalMix.totalClients} clients to ₹${evalMix.totalRevenue} revenue, ₹${evalMix.totalContribution} contribution, status: ${evalMix.targetStatus}.`);
}

// TEST 4: Month-by-Month Startup Growth Simulation
console.log('Test 4: Month-by-Month Startup Growth Simulation & Break-Even Month');
{
  const projection = calculateStartupGrowthProjection({
    startingActiveClients: 5,
    startingNewClientsMonth1: 2,
    monthlyIncreaseRate: 1,
    accelerationFrequencyMonths: 3,
    monthlyChurnPercent: 2,
    projectionMonths: 36,
    initialInvestment: 500000,
    plans: DEFAULT_SIMPLE_PLANS,
    companyExpenses: {
      employeeSalaries: 300000,
      officeRent: 50000,
      petrolTravel: 15000,
      technologySoftware: 20000,
      marketing: 35000,
      otherExpenses: 40000,
    },
    startDate: '2026-10-01',
  });

  assert.strictEqual(projection.months.length, 36, 'Projection must have 36 months');
  assert.strictEqual(projection.months[0].openingClients, 5, 'Month 1 opening clients must be 5');

  // Verify client progression
  const m1 = projection.months[0];
  assert.strictEqual(m1.newClients, 2, 'Month 1 new clients must be 2');
  assert.strictEqual(m1.churnedClients, 0, 'Month 1 churn with 5 clients @ 2% is 0');
  assert.strictEqual(m1.closingClients, 7, 'Month 1 closing clients must be 7 (5+2-0)');

  // Verify break-even month detection
  assert(projection.breakEvenMonthIndex !== null, 'Break-even must be reached within 36 months');
  assert(projection.breakEvenMonthIndex >= 1 && projection.breakEvenMonthIndex <= 36);
  assert(projection.breakEvenDate !== null, 'Break-even date must be formatted');
  console.log(`  ✅ Passed: Break-even reached at Month ${projection.breakEvenMonthIndex} (${projection.breakEvenDate}) with profit at target: ₹${projection.profitAtTarget}.`);

  // Verify ROI recovery detection
  assert(projection.roiRecoveryMonthIndex !== null, 'ROI must be recovered within 36 months');
  assert(projection.roiRecoveryMonthIndex >= projection.breakEvenMonthIndex, 'ROI recovery month must be at or after break-even');
  console.log(`  ✅ Passed: ROI Recovery reached at Month ${projection.roiRecoveryMonthIndex} (${projection.roiRecoveryDate}).`);
}

// TEST 5: Date formatting
console.log('Test 5: Calendar date projection formatting');
{
  const dateM1 = formatCalendarDate('2026-10-01', 0);
  assert.strictEqual(dateM1, 'October 2026');

  const dateM11 = formatCalendarDate('2026-10-01', 10);
  assert.strictEqual(dateM11, 'August 2027');

  const dateM17 = formatCalendarDate('2026-10-01', 16);
  assert.strictEqual(dateM17, 'February 2028');
  console.log('  ✅ Passed: Calendar dates format correctly (Oct 2026, Aug 2027, Feb 2028).');
}

// TEST 6: Unreachable Break-Even Detection
console.log('Test 6: Handling unachievable growth scenarios');
{
  const unreachable = calculateStartupGrowthProjection({
    startingActiveClients: 1,
    startingNewClientsMonth1: 0,
    monthlyIncreaseRate: 0,
    accelerationFrequencyMonths: 12,
    monthlyChurnPercent: 10,
    projectionMonths: 12,
    companyExpenses: { employeeSalaries: 500000 },
  });

  assert.strictEqual(unreachable.isBreakEvenReached, false, 'Break-even must not be reached');
  assert.strictEqual(unreachable.breakEvenMonthIndex, null);
  assert.strictEqual(unreachable.breakEvenDate, null);
  console.log('  ✅ Passed: Accurately identifies when break-even is not reached within projection window.');
}

// TEST 7: Target Milestone Timeline Generation
console.log('Test 7: Target Milestone Timeline Generation');
{
  const projection = calculateStartupGrowthProjection({
    startingActiveClients: 5,
    startingNewClientsMonth1: 2,
    monthlyIncreaseRate: 1,
    accelerationFrequencyMonths: 3,
    projectionMonths: 36,
  });

  const timeline = calculateTargetTimeline(projection, {
    activeClients: 5,
    monthlyRevenue: 90000,
    monthlyContribution: 65300,
  });

  assert.strictEqual(timeline.length, 6, 'Must generate 6 strategic milestones');
  assert.strictEqual(timeline[0].id, 'today');
  assert.strictEqual(timeline[1].id, 'startup');
  assert.strictEqual(timeline[2].id, 'first_profitable');
  assert.strictEqual(timeline[3].id, 'break_even');
  assert.strictEqual(timeline[4].id, 'roi_recovery');
  assert.strictEqual(timeline[5].id, 'sustainable_profit');
  console.log('  ✅ Passed: Target timeline generates all 6 milestones with dates and financial metrics.');
}

// TEST 8: Multi-Scenario Switching (Conservative vs Base vs Aggressive)
console.log('Test 8: Multi-Scenario comparisons');
{
  const cons = calculateStartupGrowthProjection({
    ...DEFAULT_STARTUP_ASSUMPTIONS,
    startingNewClientsMonth1: DEFAULT_GROWTH_SCENARIOS.conservative.startingNewClients,
    monthlyIncreaseRate: DEFAULT_GROWTH_SCENARIOS.conservative.monthlyIncreaseRate,
    accelerationFrequencyMonths: DEFAULT_GROWTH_SCENARIOS.conservative.accelerationFrequencyMonths,
    monthlyChurnPercent: DEFAULT_GROWTH_SCENARIOS.conservative.monthlyChurnPercent,
  });

  const aggr = calculateStartupGrowthProjection({
    ...DEFAULT_STARTUP_ASSUMPTIONS,
    startingNewClientsMonth1: DEFAULT_GROWTH_SCENARIOS.aggressive.startingNewClients,
    monthlyIncreaseRate: DEFAULT_GROWTH_SCENARIOS.aggressive.monthlyIncreaseRate,
    accelerationFrequencyMonths: DEFAULT_GROWTH_SCENARIOS.aggressive.accelerationFrequencyMonths,
    monthlyChurnPercent: DEFAULT_GROWTH_SCENARIOS.aggressive.monthlyChurnPercent,
  });

  assert(
    aggr.finalMonth.closingClients > cons.finalMonth.closingClients,
    'Aggressive scenario must yield higher client count than Conservative'
  );
  if (cons.breakEvenMonthIndex !== null && aggr.breakEvenMonthIndex !== null) {
    assert(
      aggr.breakEvenMonthIndex <= cons.breakEvenMonthIndex,
      'Aggressive scenario must reach break-even earlier than or equal to Conservative'
    );
  }
  console.log(`  ✅ Passed: Conservative ending clients = ${cons.finalMonth.closingClients}, Aggressive ending clients = ${aggr.finalMonth.closingClients}.`);
}

// TEST 9: Single-Plan Deterministic Projection (Essential-Only)
console.log('Test 9: Deterministic Single-Plan Projection (Essential-only)');
{
  const proj = calculateSinglePlanProjection({
    selectedPlanId: 'essential',
    purePlanComparison: false,
    startingActiveClients: 5,
    startingNewClientsMonth1: 2,
    monthlyIncreaseRate: 1,
    accelerationFrequencyMonths: 3,
    monthlyChurnPercent: 2,
    projectionMonths: 36,
    initialInvestment: 500000,
    plans: DEFAULT_SIMPLE_PLANS,
    companyExpenses: {
      employeeSalaries: 300000,
      officeRent: 50000,
      petrolTravel: 15000,
      technologySoftware: 20000,
      marketing: 35000,
      otherExpenses: 40000,
    },
    activeClients: [
      { id: '1', clientName: 'Client 1', monthlyFee: 12500, monthlyContribution: 10608 },
      { id: '2', clientName: 'Client 2', monthlyFee: 12500, monthlyContribution: 10608 },
      { id: '3', clientName: 'Client 3', monthlyFee: 22500, monthlyContribution: 18000 },
      { id: '4', clientName: 'Client 4', monthlyFee: 22500, monthlyContribution: 18000 },
      { id: '5', clientName: 'Client 5', monthlyFee: 20000, monthlyContribution: 15000 },
    ],
    startDate: '2026-10-01',
  });

  // Verify plan economics
  assert.strictEqual(proj.selectedPlanEconomics.id, 'essential');
  assert.strictEqual(proj.selectedPlanEconomics.monthlyFee, 12500);

  // Verify monthly break-even vs operating loss recovery vs investment recovery
  assert(proj.monthlyBreakEvenMonthIndex !== null, 'Monthly operational break-even must be reached');
  console.log(`  ✅ Passed: Monthly Operational Break-Even reached at Month ${proj.monthlyBreakEvenMonthIndex} (${proj.monthlyBreakEven.calendarDate}) with ${proj.monthlyBreakEven.closingClients} clients.`);

  if (proj.operatingLossRecoveryMonthIndex !== null) {
    assert(
      proj.operatingLossRecoveryMonthIndex >= proj.monthlyBreakEvenMonthIndex,
      'Operating loss recovery (cumulative >= 0) must occur at or after monthly break-even'
    );
    console.log(`  ✅ Passed: Operating Loss Recovery reached at Month ${proj.operatingLossRecoveryMonthIndex} (${proj.operatingLossRecovery.calendarDate}).`);
  }

  if (proj.investmentRecoveryMonthIndex !== null) {
    assert(
      proj.investmentRecoveryMonthIndex >= proj.operatingLossRecoveryMonthIndex,
      'Investment payback must occur at or after operating loss recovery'
    );
    console.log(`  ✅ Passed: Investment Recovery / Payback reached at Month ${proj.investmentRecoveryMonthIndex} (${proj.investmentRecovery.calendarDate}).`);
  }

  // Verify ROI calculation
  const m1 = proj.months[0];
  assert(m1.roiPercent < 0, 'Early month ROI should be negative when cumulative operating profit is negative');
  console.log(`  ✅ Passed: Early month ROI correctly computes negative (${m1.roiPercent}%).`);
}

// TEST 10: Pure Plan Comparison vs Current Business Mode
console.log('Test 10: Pure Plan Projection vs Current Business Mode');
{
  const commonArgs = {
    selectedPlanId: 'signature',
    startingActiveClients: 5,
    startingNewClientsMonth1: 2,
    monthlyIncreaseRate: 0,
    accelerationFrequencyMonths: 3,
    monthlyChurnPercent: 0,
    projectionMonths: 12,
    initialInvestment: 500000,
    plans: DEFAULT_SIMPLE_PLANS,
    companyExpenses: { employeeSalaries: 300000 },
    activeClients: [
      { id: '1', clientName: 'C1', monthlyFee: 10000, monthlyContribution: 8000 },
      { id: '2', clientName: 'C2', monthlyFee: 10000, monthlyContribution: 8000 },
      { id: '3', clientName: 'C3', monthlyFee: 10000, monthlyContribution: 8000 },
      { id: '4', clientName: 'C4', monthlyFee: 10000, monthlyContribution: 8000 },
      { id: '5', clientName: 'C5', monthlyFee: 10000, monthlyContribution: 8000 },
    ],
  };

  const currentBusiness = calculateSinglePlanProjection({
    ...commonArgs,
    purePlanComparison: false,
  });

  const purePlan = calculateSinglePlanProjection({
    ...commonArgs,
    purePlanComparison: true,
  });

  const sigFee = DEFAULT_SIMPLE_PLANS.signature.monthlySubscription;
  // Month 1 closing clients = 5 + 2 = 7
  // Pure plan month 1 revenue = 7 * sigFee
  assert.strictEqual(purePlan.months[0].monthlyRevenue, 7 * sigFee);
  // Current business month 1 revenue = 5 * 10000 + 2 * sigFee
  assert.strictEqual(currentBusiness.months[0].monthlyRevenue, (5 * 10000) + (2 * sigFee));

  console.log(`  ✅ Passed: Pure plan Month 1 rev = ₹${purePlan.months[0].monthlyRevenue}, Current Business Month 1 rev = ₹${currentBusiness.months[0].monthlyRevenue}.`);
}

// TEST 11: Zero Initial Investment Handling (ROI & Payback N/A)
console.log('Test 11: Zero Initial Investment displays N/A');
{
  const projZeroInv = calculateSinglePlanProjection({
    selectedPlanId: 'professional',
    initialInvestment: 0,
    projectionMonths: 12,
    plans: DEFAULT_SIMPLE_PLANS,
  });

  assert.strictEqual(projZeroInv.months[0].roiPercent, null, 'ROI % should be null/NA when initial investment is 0');
  assert.strictEqual(projZeroInv.investmentRecoveryMonthIndex, null);
  console.log('  ✅ Passed: Zero investment accurately yields null/NA for ROI and payback.');
}

// TEST 12: Four Plan Comparison Table Generation
console.log('Test 12: Four-Plan Comparison generation');
{
  const comparison = calculateFourPlanComparison({
    startingActiveClients: 5,
    startingNewClientsMonth1: 2,
    monthlyIncreaseRate: 1,
    projectionMonths: 36,
    initialInvestment: 500000,
    plans: DEFAULT_SIMPLE_PLANS,
    companyExpenses: { employeeSalaries: 460000 },
  });

  assert(comparison.essential !== undefined);
  assert(comparison.professional !== undefined);
  assert(comparison.enterprise !== undefined);
  assert(comparison.signature !== undefined);

  assert(comparison.essential.clientsRequiredForBreakEven > comparison.signature.clientsRequiredForBreakEven);
  console.log(`  ✅ Passed: Essential needs ${comparison.essential.clientsRequiredForBreakEven} clients, Signature needs ${comparison.signature.clientsRequiredForBreakEven} clients.`);
}

// TEST 13: 12M / 24M / 36M / 60M Year-End Snapshots
console.log('Test 13: Year-end multi-horizon snapshots');
{
  const proj = calculateSinglePlanProjection({
    selectedPlanId: 'professional',
    projectionMonths: 60,
    plans: DEFAULT_SIMPLE_PLANS,
  });

  assert(proj.snapshots.m12 !== null);
  assert(proj.snapshots.m24 !== null);
  assert(proj.snapshots.m36 !== null);
  assert(proj.snapshots.m60 !== null);

  assert(proj.snapshots.m60.clients > proj.snapshots.m12.clients);
  console.log(`  ✅ Passed: Snapshots generated: 12M (${proj.snapshots.m12.clients} clients), 24M (${proj.snapshots.m24.clients} clients), 36M (${proj.snapshots.m36.clients} clients), 60M (${proj.snapshots.m60.clients} clients).`);
}

console.log('\n🎉 ALL STARTUP GROWTH ENGINE TESTS PASSED!');

