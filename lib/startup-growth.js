/**
 * ARTNCE Startup Growth & Financial Target Calculation Engine
 *
 * Dedicated calculation functions for:
 * 1. Startup growth month-by-month projection
 * 2. Break-even analysis (Single plan & mixed plan)
 * 3. ROI & capital recovery modeling
 * 4. Multi-scenario growth modeling (Conservative, Base, Aggressive, Custom)
 * 5. Dynamic target timeline generation
 * 6. Sensitivity & What-If evaluation
 */

import {
  calculateClientEconomics,
  calculateSimplePlanResult,
  calculateCompanyTargetPerformance,
} from './calculator.js';

import {
  DEFAULT_SIMPLE_PLANS,
  DEFAULT_COMPANY_MONTHLY_EXPENSES,
} from './defaults.js';

export const STARTUP_GROWTH_STORAGE_KEY = 'artnce_startup_growth_v1';

export const DEFAULT_GROWTH_SCENARIOS = {
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    description: 'Slow client acquisition with steady retention',
    startingNewClients: 1,
    monthlyIncreaseRate: 0,
    accelerationFrequencyMonths: 3,
    monthlyChurnPercent: 3,
  },
  base: {
    id: 'base',
    name: 'Base',
    description: 'Moderate startup adoption scaling by +1 client every quarter',
    startingNewClients: 2,
    monthlyIncreaseRate: 1,
    accelerationFrequencyMonths: 3,
    monthlyChurnPercent: 2,
  },
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Rapid client expansion scaling by +1 client every 2 months',
    startingNewClients: 4,
    monthlyIncreaseRate: 1,
    accelerationFrequencyMonths: 2,
    monthlyChurnPercent: 1,
  },
};

export const DEFAULT_STARTUP_ASSUMPTIONS = {
  selectedScenarioId: 'base',
  selectedPlanId: 'essential',
  purePlanComparison: false,
  startingActiveClients: 5,
  startingNewClientsMonth1: 2,
  monthlyIncreaseRate: 1,
  accelerationFrequencyMonths: 3,
  monthlyChurnPercent: 2,
  projectionMonths: 36,
  initialInvestment: 500000,
  additionalInvestment: 0,
  planMix: {
    essential: 50,
    professional: 30,
    enterprise: 15,
    signature: 5,
  },
  customMixClients: {
    essential: 20,
    professional: 10,
    enterprise: 3,
    signature: 1,
  },
  priceSensitivity: {
    essentialDelta: 0,
    professionalDelta: 0,
    enterpriseDelta: 0,
    signatureDelta: 0,
  },
  acquisitionDelta: 0,
  startDate: '2026-10-01',
};

/**
 * Helper to get clean plan economics (Price, Direct Cost, Contribution, Margin %)
 */
export function getCleanPlanEconomics(planId, planTemplate) {
  const tpl = planTemplate || DEFAULT_SIMPLE_PLANS[planId] || DEFAULT_SIMPLE_PLANS.essential;
  const monthlyFee = Math.max(0, Number(tpl.monthlySubscription) || 0);
  const costs = Array.isArray(tpl.costs) ? tpl.costs : [];

  const econ = calculateClientEconomics({
    costs,
    monthlyFee,
    periodMonths: 12,
  });

  const directCost = Math.round(econ.avgMonthlySpend * 100) / 100;
  const monthlyContribution = Math.round(econ.monthlyContribution * 100) / 100;
  const contributionMargin = monthlyFee > 0 ? (monthlyContribution / monthlyFee) * 100 : 0;

  return {
    id: planId,
    name: tpl.name || planId,
    monthlyFee,
    directCost,
    monthlyContribution,
    contributionMargin: Math.round(contributionMargin * 100) / 100,
    costs,
  };
}

/**
 * Format dynamic calendar month and year from a start date and month offset (0-indexed)
 */
export function formatCalendarDate(startDateStr = '2026-10-01', monthOffset = 0) {
  const [yearStr, monthStr] = startDateStr.split('-');
  const baseYear = Number(yearStr) || 2026;
  const baseMonth = (Number(monthStr) || 10) - 1;

  const targetDate = new Date(baseYear, baseMonth + monthOffset, 1);
  return targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Calculates weighted average economics from a given plan mix distribution
 */
export function calculateWeightedPlanMetrics(plans = {}, planMix = {}, priceDeltas = {}) {
  const planIds = ['essential', 'professional', 'enterprise', 'signature'];
  let totalWeight = 0;
  const planMetrics = {};

  // If planMix is empty or all zero, fallback to default mix
  const effectiveMix = (planMix && Object.values(planMix).some((v) => Number(v) > 0))
    ? planMix
    : DEFAULT_STARTUP_ASSUMPTIONS.planMix;

  for (const pid of planIds) {
    const rawEcon = getCleanPlanEconomics(pid, plans[pid]);
    const delta = Number(priceDeltas[pid + 'Delta']) || 0;
    const effectiveFee = Math.max(0, rawEcon.monthlyFee + delta);
    const effectiveContrib = Math.max(0, effectiveFee - rawEcon.directCost);
    const effectiveMargin = effectiveFee > 0 ? (effectiveContrib / effectiveFee) * 100 : 0;

    const weight = Math.max(0, Number(effectiveMix[pid]) || 0);
    totalWeight += weight;

    planMetrics[pid] = {
      ...rawEcon,
      monthlyFee: effectiveFee,
      monthlyContribution: effectiveContrib,
      contributionMargin: effectiveMargin,
      weight,
    };
  }

  const normalizedWeightTotal = totalWeight > 0 ? totalWeight : 1;
  let weightedFee = 0;
  let weightedCost = 0;
  let weightedContribution = 0;

  for (const pid of planIds) {
    const m = planMetrics[pid];
    const frac = m.weight / normalizedWeightTotal;
    weightedFee += m.monthlyFee * frac;
    weightedCost += m.directCost * frac;
    weightedContribution += m.monthlyContribution * frac;
  }

  const weightedMargin = weightedFee > 0 ? (weightedContribution / weightedFee) * 100 : 0;

  return {
    planMetrics,
    weightedFee: Math.round(weightedFee * 100) / 100,
    weightedCost: Math.round(weightedCost * 100) / 100,
    weightedContribution: Math.round(weightedContribution * 100) / 100,
    weightedMargin: Math.round(weightedMargin * 100) / 100,
  };
}

/**
 * Calculates single-plan requirements to cover the company monthly requirement
 */
export function calculatePlanRequirements({
  companyRequirement = 0,
  currentContribution = 0,
  currentActiveClients = 0,
  plans = {},
}) {
  const requiredAdditionalContribution = Math.max(0, companyRequirement - currentContribution);
  const planIds = ['essential', 'professional', 'enterprise', 'signature'];

  const results = {};
  for (const pid of planIds) {
    const econ = getCleanPlanEconomics(pid, plans[pid]);
    const contrib = Math.max(0.01, econ.monthlyContribution);
    const additionalPlansRequired = requiredAdditionalContribution > 0
      ? Math.ceil(requiredAdditionalContribution / contrib)
      : 0;
    const totalClientsAtBreakEven = currentActiveClients + additionalPlansRequired;

    results[pid] = {
      planId: pid,
      planName: econ.name,
      monthlyFee: econ.monthlyFee,
      directCost: econ.directCost,
      monthlyContribution: econ.monthlyContribution,
      contributionMargin: econ.contributionMargin,
      additionalPlansRequired,
      totalClientsAtBreakEven,
      totalRevenueAtTarget: totalClientsAtBreakEven * econ.monthlyFee,
      totalContributionAtTarget: totalClientsAtBreakEven * econ.monthlyContribution,
    };
  }

  return {
    requiredAdditionalContribution,
    plans: results,
  };
}

/**
 * Calculates economics for a mixed client scenario
 */
export function calculateCustomMixBreakEven({
  mixCounts = {},
  plans = {},
  companyRequirement = 0,
}) {
  const planIds = ['essential', 'professional', 'enterprise', 'signature'];

  let totalClients = 0;
  let totalRevenue = 0;
  let totalDirectCost = 0;
  let totalContribution = 0;
  const breakdown = {};

  for (const pid of planIds) {
    const count = Math.max(0, Number(mixCounts[pid]) || 0);
    const econ = getCleanPlanEconomics(pid, plans[pid]);
    const planRev = count * econ.monthlyFee;
    const planCost = count * econ.directCost;
    const planContrib = count * econ.monthlyContribution;

    totalClients += count;
    totalRevenue += planRev;
    totalDirectCost += planCost;
    totalContribution += planContrib;

    breakdown[pid] = {
      count,
      monthlyFee: econ.monthlyFee,
      directCost: econ.directCost,
      monthlyContribution: econ.monthlyContribution,
      totalRevenue: planRev,
      totalContribution: planContrib,
    };
  }

  const operatingProfit = totalContribution - companyRequirement;
  const contributionMargin = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0;

  let targetStatus = 'TARGET NOT REACHED';
  if (totalContribution >= companyRequirement && companyRequirement > 0) {
    targetStatus = operatingProfit > 0 ? 'PROFITABLE' : 'BREAK-EVEN REACHED';
  }

  return {
    totalClients,
    totalRevenue,
    totalDirectCost,
    totalContribution,
    companyRequirement,
    operatingProfit,
    contributionMargin: Math.round(contributionMargin * 100) / 100,
    targetStatus,
    breakdown,
  };
}

/**
 * Simulates month-by-month startup growth projection
 */
export function calculateStartupGrowthProjection({
  startingActiveClients = 5,
  startingNewClientsMonth1 = 2,
  monthlyIncreaseRate = 1,
  accelerationFrequencyMonths = 3,
  monthlyChurnPercent = 2,
  projectionMonths = 36,
  initialInvestment = 500000,
  additionalInvestment = 0,
  planMix = {},
  priceDeltas = {},
  acquisitionDelta = 0,
  plans = {},
  companyExpenses = {},
  startDate = '2026-10-01',
}) {
  const targetPerf = calculateCompanyTargetPerformance({ companyExpenses });
  const companyMonthlyRequirement = targetPerf.totalCompanyMonthlyRequirement || 460000;

  const totalInvestedCapital = Math.max(0, Number(initialInvestment) || 0) + Math.max(0, Number(additionalInvestment) || 0);
  const weighted = calculateWeightedPlanMetrics(plans, planMix, priceDeltas);

  const pMonths = Math.min(60, Math.max(6, Number(projectionMonths) || 36));
  const churnRate = Math.min(0.99, Math.max(0, (Number(monthlyChurnPercent) || 0) / 100));
  const baseNew = Math.max(0, (Number(startingNewClientsMonth1) || 0) + (Number(acquisitionDelta) || 0));
  const accelFreq = Math.max(1, Number(accelerationFrequencyMonths) || 3);
  const increaseRate = Math.max(0, Number(monthlyIncreaseRate) || 0);

  const months = [];
  let currentClients = Math.max(0, Number(startingActiveClients) || 0);
  let cumulativeOperatingProfit = 0;
  let breakEvenMonthIndex = null;
  let roiRecoveryMonthIndex = null;

  for (let m = 1; m <= pMonths; m++) {
    const openingClients = currentClients;

    // Acceleration calculation
    const stepCount = Math.floor((m - 1) / accelFreq);
    const newClients = Math.max(0, baseNew + (stepCount * increaseRate));

    // Churn calculation (minimum 0)
    const churnedClients = Math.max(0, Math.round(openingClients * churnRate));
    const closingClients = Math.max(0, openingClients + newClients - churnedClients);

    // Financials
    const monthlyRevenue = Math.round(closingClients * weighted.weightedFee);
    const monthlyDirectCost = Math.round(closingClients * weighted.weightedCost);
    const monthlyContribution = Math.round(closingClients * weighted.weightedContribution);
    const operatingProfit = monthlyContribution - companyMonthlyRequirement;

    cumulativeOperatingProfit += operatingProfit;

    const gapToBreakEven = Math.max(0, companyMonthlyRequirement - monthlyContribution);
    const isBreakEven = monthlyContribution >= companyMonthlyRequirement;
    if (isBreakEven && breakEvenMonthIndex === null) {
      breakEvenMonthIndex = m;
    }

    const isRoiRecovered = totalInvestedCapital > 0 && cumulativeOperatingProfit >= totalInvestedCapital;
    if (isRoiRecovered && roiRecoveryMonthIndex === null) {
      roiRecoveryMonthIndex = m;
    }

    // ROI % relative to initial capital
    const roiPercent = totalInvestedCapital > 0
      ? ((cumulativeOperatingProfit - totalInvestedCapital) / totalInvestedCapital) * 100
      : 0;

    const calendarDate = formatCalendarDate(startDate, m - 1);

    months.push({
      monthIndex: m,
      calendarDate,
      openingClients,
      newClients,
      churnedClients,
      closingClients,
      monthlyRevenue,
      monthlyDirectCost,
      monthlyContribution,
      companyMonthlyRequirement,
      operatingProfit,
      cumulativeOperatingProfit,
      remainingInvestmentToRecover: Math.max(0, totalInvestedCapital - cumulativeOperatingProfit),
      cumulativeInvestmentRecovered: Math.min(totalInvestedCapital, Math.max(0, cumulativeOperatingProfit)),
      gapToBreakEven,
      roiPercent: Math.round(roiPercent * 10) / 10,
      isBreakEven,
      isBreakEvenMonth: breakEvenMonthIndex === m,
      isRoiRecovered,
      isRoiMonth: roiRecoveryMonthIndex === m,
      breakEvenStatus: isBreakEven
        ? (operatingProfit > 0 ? 'Profitable' : 'Break-Even')
        : 'Deficit',
    });

    currentClients = closingClients;
  }

  // Summary indicators
  const breakEvenMonth = breakEvenMonthIndex !== null ? months[breakEvenMonthIndex - 1] : null;
  const roiMonth = roiRecoveryMonthIndex !== null ? months[roiRecoveryMonthIndex - 1] : null;

  // Monthly profit at target
  const profitAtTarget = breakEvenMonth ? breakEvenMonth.operatingProfit : 0;
  const targetSurplus = breakEvenMonth ? Math.max(0, breakEvenMonth.monthlyContribution - companyMonthlyRequirement) : 0;

  return {
    months,
    totalInvestedCapital,
    companyMonthlyRequirement,
    weightedEconomics: weighted,
    breakEvenMonthIndex,
    breakEvenMonth,
    breakEvenDate: breakEvenMonth ? breakEvenMonth.calendarDate : null,
    isBreakEvenReached: breakEvenMonthIndex !== null,
    roiRecoveryMonthIndex,
    roiMonth,
    roiRecoveryDate: roiMonth ? roiMonth.calendarDate : null,
    isRoiRecovered: roiRecoveryMonthIndex !== null,
    profitAtTarget,
    targetSurplus,
    finalMonth: months[months.length - 1],
  };
}

/**
 * Generates structured milestone data for the Target Timeline visualizer
 */
export function calculateTargetTimeline(projectionResult, currentSituation = {}) {
  const months = projectionResult.months || [];
  const startClientCount = currentSituation.activeClients || 5;
  const startRev = currentSituation.monthlyRevenue || 0;
  const startContrib = currentSituation.monthlyContribution || 0;
  const startProfit = startContrib - projectionResult.companyMonthlyRequirement;

  // Milestone 1: TODAY
  const todayMilestone = {
    id: 'today',
    title: 'TODAY',
    subtitle: 'Current Baseline',
    monthLabel: 'Month 0',
    dateLabel: formatCalendarDate(projectionResult.startDate || '2026-10-01', 0),
    clients: startClientCount,
    revenue: startRev,
    contribution: startContrib,
    operatingProfit: startProfit,
    status: startProfit >= 0 ? 'achieved' : 'active',
  };

  // Milestone 2: STARTUP EARLY GROWTH (Month 3)
  const m3 = months[2] || months[0];
  const startupMilestone = {
    id: 'startup',
    title: 'STARTUP GROWTH',
    subtitle: 'Early expansion',
    monthLabel: `Month ${m3 ? m3.monthIndex : 3}`,
    dateLabel: m3 ? m3.calendarDate : '—',
    clients: m3 ? m3.closingClients : 0,
    revenue: m3 ? m3.monthlyRevenue : 0,
    contribution: m3 ? m3.monthlyContribution : 0,
    operatingProfit: m3 ? m3.operatingProfit : 0,
    status: m3 && m3.operatingProfit >= 0 ? 'achieved' : 'upcoming',
  };

  // Milestone 3: FIRST PROFITABLE MONTH
  const firstProfitable = months.find((m) => m.operatingProfit > 0);
  const firstProfitMilestone = {
    id: 'first_profitable',
    title: 'FIRST PROFITABLE MONTH',
    subtitle: 'Contribution > Expenses',
    monthLabel: firstProfitable ? `Month ${firstProfitable.monthIndex}` : 'Not reached',
    dateLabel: firstProfitable ? firstProfitable.calendarDate : 'Exceeds projection',
    clients: firstProfitable ? firstProfitable.closingClients : '—',
    revenue: firstProfitable ? firstProfitable.monthlyRevenue : '—',
    contribution: firstProfitable ? firstProfitable.monthlyContribution : '—',
    operatingProfit: firstProfitable ? firstProfitable.operatingProfit : '—',
    status: firstProfitable ? 'achieved_soon' : 'unreachable',
  };

  // Milestone 4: BREAK-EVEN
  const beMonth = projectionResult.breakEvenMonth;
  const breakEvenMilestone = {
    id: 'break_even',
    title: 'BREAK-EVEN',
    subtitle: 'Full cost parity',
    monthLabel: beMonth ? `Month ${beMonth.monthIndex}` : 'Not reached',
    dateLabel: beMonth ? beMonth.calendarDate : `> ${months.length} Months`,
    clients: beMonth ? beMonth.closingClients : '—',
    revenue: beMonth ? beMonth.monthlyRevenue : '—',
    contribution: beMonth ? beMonth.monthlyContribution : '—',
    operatingProfit: beMonth ? beMonth.operatingProfit : '—',
    status: beMonth ? 'projected' : 'unreachable',
  };

  // Milestone 5: ROI RECOVERY
  const roiM = projectionResult.roiMonth;
  const roiMilestone = {
    id: 'roi_recovery',
    title: 'ROI RECOVERY',
    subtitle: '100% Capital Repaid',
    monthLabel: roiM ? `Month ${roiM.monthIndex}` : 'Not reached',
    dateLabel: roiM ? roiM.calendarDate : `> ${months.length} Months`,
    clients: roiM ? roiM.closingClients : '—',
    revenue: roiM ? roiM.monthlyRevenue : '—',
    contribution: roiM ? roiM.monthlyContribution : '—',
    operatingProfit: roiM ? roiM.operatingProfit : '—',
    status: roiM ? 'projected' : 'unreachable',
  };

  // Milestone 6: SUSTAINABLE PROFIT (Horizon Month 36 or final)
  const finalM = projectionResult.finalMonth;
  const sustainableMilestone = {
    id: 'sustainable_profit',
    title: 'SUSTAINABLE PROFIT',
    subtitle: 'Ongoing Monthly Surplus',
    monthLabel: `Month ${finalM ? finalM.monthIndex : 36}`,
    dateLabel: finalM ? finalM.calendarDate : '—',
    clients: finalM ? finalM.closingClients : 0,
    revenue: finalM ? finalM.monthlyRevenue : 0,
    contribution: finalM ? finalM.monthlyContribution : 0,
    operatingProfit: finalM ? finalM.operatingProfit : 0,
    status: finalM && finalM.operatingProfit > 0 ? 'achieved' : 'projected',
  };

  return [
    todayMilestone,
    startupMilestone,
    firstProfitMilestone,
    breakEvenMilestone,
    roiMilestone,
    sustainableMilestone,
  ];
}

/**
 * Deterministic Single-Plan Financial Projection Engine
 * Simulates month-by-month trajectory when ARTNCE sells ONE chosen plan.
 *
 * Core Questions Answered:
 * 1. When do I reach MONTHLY OPERATIONAL BREAK-EVEN? (Monthly Contribution >= Monthly Company Requirement)
 * 2. When do I recover ALL EARLY OPERATING LOSSES? (Cumulative Operating Profit >= 0, "Operating Loss Recovery")
 * 3. When do I recover my INITIAL INVESTMENT? (Cumulative Operating Profit >= Initial Investment, "Investment Recovery / Payback")
 * 4. What is my CUMULATIVE ROI? (Cumulative Operating Profit / Initial Investment * 100)
 * 5. What is my profit/revenue/contribution at 12, 24, 36, and 60 months?
 */
export function calculateSinglePlanProjection({
  selectedPlanId = 'essential',
  purePlanComparison = false,
  startingActiveClients = 5,
  startingNewClientsMonth1 = 2,
  monthlyIncreaseRate = 1,
  accelerationFrequencyMonths = 3,
  monthlyChurnPercent = 2,
  projectionMonths = 36,
  initialInvestment = 500000,
  plans = {},
  companyExpenses = {},
  activeClients = [],
  startDate = '2026-10-01',
}) {
  const targetPerf = calculateCompanyTargetPerformance({ companyExpenses, activeClients });
  const companyMonthlyRequirement = targetPerf.totalCompanyMonthlyRequirement || 460000;

  const planEcon = getCleanPlanEconomics(selectedPlanId, plans[selectedPlanId]);
  const investedCapital = Math.max(0, Number(initialInvestment) || 0);

  const startClients = Math.max(0, Number(startingActiveClients) || 0);

  // Baseline portfolio metrics from activeClients
  const clientList = Array.isArray(activeClients) ? activeClients : [];
  let existingRevenue = 0;
  let existingCost = 0;
  let existingContribution = 0;
  for (const c of clientList) {
    const fee = Math.max(0, Number(c.monthlyFee) || 0);
    const spend = c.avgMonthlySpend !== undefined ? Number(c.avgMonthlySpend) : (Number(c.monthlyCost) || 0);
    const contrib = c.monthlyContribution !== undefined ? Number(c.monthlyContribution) : (fee - spend);
    existingRevenue += fee;
    existingCost += spend;
    existingContribution += contrib;
  }

  // If startClients exceeds specific activeClients records (e.g. activeClients is empty or partial),
  // unassigned starting clients use the selected plan's economics in Current Business mode.
  if (startClients > clientList.length) {
    const unassignedCount = startClients - clientList.length;
    existingRevenue += Math.round(unassignedCount * planEcon.monthlyFee);
    existingCost += Math.round(unassignedCount * planEcon.directCost);
    existingContribution += Math.round(unassignedCount * planEcon.monthlyContribution);
  }

  // Operating gap at current position
  const currentContribution = existingContribution;
  const currentOperatingGap = Math.max(0, companyMonthlyRequirement - currentContribution);

  const pMonths = Math.min(60, Math.max(12, Number(projectionMonths) || 36));
  const churnRate = Math.min(0.99, Math.max(0, (Number(monthlyChurnPercent) || 0) / 100));
  const baseNew = Math.max(0, Number(startingNewClientsMonth1) || 0);
  const accelFreq = Math.max(1, Number(accelerationFrequencyMonths) || 3);
  const increaseRate = Math.max(0, Number(monthlyIncreaseRate) || 0);

  const months = [];
  let currentClients = startClients;
  let cumulativeOperatingProfit = 0;

  let monthlyBreakEvenMonthIndex = null;
  let operatingLossRecoveryMonthIndex = null;
  let investmentRecoveryMonthIndex = null;
  let roi100MonthIndex = null;
  let roi200MonthIndex = null;

  for (let m = 1; m <= pMonths; m++) {
    const openingClients = currentClients;

    // Acceleration cadence
    const stepCount = Math.floor((m - 1) / accelFreq);
    const newClients = Math.max(0, baseNew + (stepCount * increaseRate));

    // Churn calculation
    const churnedClients = Math.max(0, Math.round(openingClients * churnRate));
    const closingClients = Math.max(0, openingClients + newClients - churnedClients);

    // Revenue & Contribution calculation
    let monthlyRevenue = 0;
    let monthlyDirectCost = 0;
    let monthlyContribution = 0;

    if (purePlanComparison) {
      // Pure Plan Mode: All closing clients use the selected plan
      monthlyRevenue = Math.round(closingClients * planEcon.monthlyFee);
      monthlyDirectCost = Math.round(closingClients * planEcon.directCost);
      monthlyContribution = Math.round(closingClients * planEcon.monthlyContribution);
    } else {
      // Current Business Mode:
      // Existing clients keep their actual portfolio revenue & contribution.
      // Newly acquired clients above baseline are 100% on the selected plan.
      const retainedBaseCount = startClients > 0
        ? Math.min(startClients, closingClients)
        : 0;
      const baseRatio = startClients > 0 ? (retainedBaseCount / startClients) : 0;
      const baseRev = Math.round(existingRevenue * baseRatio);
      const baseCost = Math.round(existingCost * baseRatio);
      const baseContrib = Math.round(existingContribution * baseRatio);

      const newPlanClients = Math.max(0, closingClients - startClients);
      const newRev = Math.round(newPlanClients * planEcon.monthlyFee);
      const newCost = Math.round(newPlanClients * planEcon.directCost);
      const newContrib = Math.round(newPlanClients * planEcon.monthlyContribution);

      monthlyRevenue = baseRev + newRev;
      monthlyDirectCost = baseCost + newCost;
      monthlyContribution = baseContrib + newContrib;
    }

    const operatingProfit = monthlyContribution - companyMonthlyRequirement;
    cumulativeOperatingProfit += operatingProfit;

    // Capital tracking
    const capitalRecovered = investedCapital > 0
      ? Math.min(investedCapital, Math.max(0, cumulativeOperatingProfit))
      : 0;
    const capitalRemaining = investedCapital > 0
      ? Math.max(0, investedCapital - cumulativeOperatingProfit)
      : 0;

    const roiPercent = investedCapital > 0
      ? Math.round(((cumulativeOperatingProfit) / investedCapital) * 1000) / 10
      : null;

    // Milestone 1: Monthly Operational Break-Even (Monthly Contribution >= Company Requirement)
    const isMonthlyBreakEven = monthlyContribution >= companyMonthlyRequirement;
    if (isMonthlyBreakEven && monthlyBreakEvenMonthIndex === null) {
      monthlyBreakEvenMonthIndex = m;
    }

    // Milestone 2: Operating Loss Recovery (Cumulative Operating Profit >= 0)
    const isOperatingLossRecovered = cumulativeOperatingProfit >= 0;
    if (isOperatingLossRecovered && operatingLossRecoveryMonthIndex === null) {
      operatingLossRecoveryMonthIndex = m;
    }

    // Milestone 3: Investment Recovery / Payback (Cumulative Operating Profit >= Initial Investment)
    const isInvestmentRecovered = investedCapital > 0 && cumulativeOperatingProfit >= investedCapital;
    if (isInvestmentRecovered && investmentRecoveryMonthIndex === null) {
      investmentRecoveryMonthIndex = m;
    }

    if (roiPercent !== null && roiPercent >= 100 && roi100MonthIndex === null) {
      roi100MonthIndex = m;
    }
    if (roiPercent !== null && roiPercent >= 200 && roi200MonthIndex === null) {
      roi200MonthIndex = m;
    }

    const calendarDate = formatCalendarDate(startDate, m - 1);

    months.push({
      monthIndex: m,
      calendarDate,
      openingClients,
      newClients,
      churnedClients,
      closingClients,
      planName: planEcon.name,
      monthlyRevenue,
      monthlyDirectCost,
      monthlyContribution,
      companyMonthlyRequirement,
      operatingProfit,
      cumulativeOperatingProfit,
      initialInvestment: investedCapital,
      capitalRecovered,
      capitalRemaining,
      roiPercent,
      isMonthlyBreakEven,
      isMonthlyBreakEvenMonth: monthlyBreakEvenMonthIndex === m,
      isOperatingLossRecovered,
      isOperatingLossRecoveryMonth: operatingLossRecoveryMonthIndex === m,
      isInvestmentRecovered,
      isInvestmentRecoveryMonth: investmentRecoveryMonthIndex === m,
      status: isMonthlyBreakEven
        ? (operatingProfit > 0 ? 'Operating Profit' : 'Monthly Break-Even')
        : 'Operating Deficit',
    });

    currentClients = closingClients;
  }

  // Milestones
  const monthlyBreakEven = monthlyBreakEvenMonthIndex !== null ? months[monthlyBreakEvenMonthIndex - 1] : null;
  const operatingLossRecovery = operatingLossRecoveryMonthIndex !== null ? months[operatingLossRecoveryMonthIndex - 1] : null;
  const investmentRecovery = investmentRecoveryMonthIndex !== null ? months[investmentRecoveryMonthIndex - 1] : null;

  // Snapshots for 12M, 24M, 36M, 60M
  const getSnapshot = (targetM) => {
    const row = months[targetM - 1] || null;
    if (!row) return null;
    return {
      monthIndex: targetM,
      calendarDate: row.calendarDate,
      clients: row.closingClients,
      revenue: row.monthlyRevenue,
      contribution: row.monthlyContribution,
      operatingProfit: row.operatingProfit,
      cumulativeOperatingProfit: row.cumulativeOperatingProfit,
      roiPercent: row.roiPercent,
    };
  };

  const snapshots = {
    m12: getSnapshot(12),
    m24: getSnapshot(24),
    m36: getSnapshot(36),
    m60: getSnapshot(60),
  };

  return {
    selectedPlanId,
    selectedPlanEconomics: planEcon,
    purePlanComparison,
    companyMonthlyRequirement,
    currentPosition: {
      totalActiveClients: startClients,
      monthlyRevenue: existingRevenue,
      monthlyContribution: currentContribution,
      companyMonthlyRequirement,
      operatingGap: currentOperatingGap,
    },
    initialInvestment: investedCapital,
    months,
    monthlyBreakEvenMonthIndex,
    monthlyBreakEven,
    operatingLossRecoveryMonthIndex,
    operatingLossRecovery,
    investmentRecoveryMonthIndex,
    investmentRecovery,
    roi100MonthIndex,
    roi200MonthIndex,
    finalMonth: months[months.length - 1],
    snapshots,
  };
}

/**
 * Evaluates all four plans side-by-side under identical growth & investment inputs
 */
export function calculateFourPlanComparison({
  purePlanComparison = false,
  startingActiveClients = 5,
  startingNewClientsMonth1 = 2,
  monthlyIncreaseRate = 1,
  accelerationFrequencyMonths = 3,
  monthlyChurnPercent = 2,
  projectionMonths = 36,
  initialInvestment = 500000,
  plans = {},
  companyExpenses = {},
  activeClients = [],
  startDate = '2026-10-01',
}) {
  const planIds = ['essential', 'professional', 'enterprise', 'signature'];
  const comparison = {};

  for (const pid of planIds) {
    const proj = calculateSinglePlanProjection({
      selectedPlanId: pid,
      purePlanComparison,
      startingActiveClients,
      startingNewClientsMonth1,
      monthlyIncreaseRate,
      accelerationFrequencyMonths,
      monthlyChurnPercent,
      projectionMonths,
      initialInvestment,
      plans,
      companyExpenses,
      activeClients,
      startDate,
    });

    const econ = proj.selectedPlanEconomics;
    const reqClients = econ.monthlyContribution > 0
      ? Math.ceil(proj.companyMonthlyRequirement / econ.monthlyContribution)
      : 0;

    comparison[pid] = {
      planId: pid,
      planName: econ.name,
      monthlyFee: econ.monthlyFee,
      directCost: econ.directCost,
      monthlyContribution: econ.monthlyContribution,
      contributionMargin: econ.contributionMargin,
      clientsRequiredForBreakEven: reqClients,
      monthlyBreakEvenMonth: proj.monthlyBreakEvenMonthIndex,
      monthlyBreakEvenDate: proj.monthlyBreakEven ? proj.monthlyBreakEven.calendarDate : null,
      operatingLossRecoveryMonth: proj.operatingLossRecoveryMonthIndex,
      operatingLossRecoveryDate: proj.operatingLossRecovery ? proj.operatingLossRecovery.calendarDate : null,
      investmentRecoveryMonth: proj.investmentRecoveryMonthIndex,
      investmentRecoveryDate: proj.investmentRecovery ? proj.investmentRecovery.calendarDate : null,
      profit12M: proj.snapshots.m12 ? proj.snapshots.m12.cumulativeOperatingProfit : null,
      profit24M: proj.snapshots.m24 ? proj.snapshots.m24.cumulativeOperatingProfit : null,
      profit36M: proj.snapshots.m36 ? proj.snapshots.m36.cumulativeOperatingProfit : null,
      profit60M: proj.snapshots.m60 ? proj.snapshots.m60.cumulativeOperatingProfit : null,
      roi12M: proj.snapshots.m12 ? proj.snapshots.m12.roiPercent : null,
      roi24M: proj.snapshots.m24 ? proj.snapshots.m24.roiPercent : null,
      roi36M: proj.snapshots.m36 ? proj.snapshots.m36.roiPercent : null,
      roi60M: proj.snapshots.m60 ? proj.snapshots.m60.roiPercent : null,
    };
  }

  return comparison;
}

/**
 * Generates the Financial Journey timeline milestones for a single-plan projection
 */
export function calculateFinancialJourneyMilestones(singlePlanProjection) {
  const months = singlePlanProjection.months || [];
  const currentPos = singlePlanProjection.currentPosition || {};
  const investedCapital = singlePlanProjection.initialInvestment;

  // 1. TODAY
  const todayMilestone = {
    id: 'today',
    title: 'TODAY',
    subtitle: 'Current Active Baseline',
    monthLabel: 'Month 0',
    dateLabel: formatCalendarDate(singlePlanProjection.startDate || '2026-10-01', 0),
    clients: currentPos.totalActiveClients || 0,
    revenue: currentPos.monthlyRevenue || 0,
    contribution: currentPos.monthlyContribution || 0,
    operatingProfit: (currentPos.monthlyContribution || 0) - singlePlanProjection.companyMonthlyRequirement,
    cumulativeProfit: 0,
    roiPercent: investedCapital > 0 ? 0 : 'N/A',
    status: 'achieved',
  };

  // 2. FIRST CLIENT GROWTH (Month 1)
  const m1 = months[0] || null;
  const firstGrowthMilestone = {
    id: 'first_growth',
    title: 'FIRST CLIENT GROWTH',
    subtitle: `Onboarded +${m1 ? m1.newClients : 0} clients`,
    monthLabel: 'Month 1',
    dateLabel: m1 ? m1.calendarDate : '—',
    clients: m1 ? m1.closingClients : 0,
    revenue: m1 ? m1.monthlyRevenue : 0,
    contribution: m1 ? m1.monthlyContribution : 0,
    operatingProfit: m1 ? m1.operatingProfit : 0,
    cumulativeProfit: m1 ? m1.cumulativeOperatingProfit : 0,
    roiPercent: m1 ? m1.roiPercent : 'N/A',
    status: m1 ? 'achieved' : 'upcoming',
  };

  // 3. FIRST MONTHLY PROFIT (First month where operatingProfit > 0)
  const firstProfit = months.find((m) => m.operatingProfit > 0);
  const firstProfitMilestone = {
    id: 'first_monthly_profit',
    title: 'FIRST MONTHLY PROFIT',
    subtitle: 'Monthly Contribution > Expenses',
    monthLabel: firstProfit ? `Month ${firstProfit.monthIndex}` : `Not reached within ${months.length}M`,
    dateLabel: firstProfit ? firstProfit.calendarDate : '—',
    clients: firstProfit ? firstProfit.closingClients : '—',
    revenue: firstProfit ? firstProfit.monthlyRevenue : '—',
    contribution: firstProfit ? firstProfit.monthlyContribution : '—',
    operatingProfit: firstProfit ? firstProfit.operatingProfit : '—',
    cumulativeProfit: firstProfit ? firstProfit.cumulativeOperatingProfit : '—',
    roiPercent: firstProfit ? firstProfit.roiPercent : 'N/A',
    status: firstProfit ? 'achieved' : 'not_reached',
  };

  // 4. MONTHLY OPERATIONAL BREAK-EVEN
  const beMonth = singlePlanProjection.monthlyBreakEven;
  const breakEvenMilestone = {
    id: 'monthly_break_even',
    title: 'MONTHLY BREAK-EVEN',
    subtitle: 'Contribution >= Monthly Requirement',
    monthLabel: beMonth ? `Month ${beMonth.monthIndex}` : `NOT REACHED WITHIN ${months.length} MONTHS`,
    dateLabel: beMonth ? beMonth.calendarDate : '—',
    clients: beMonth ? beMonth.closingClients : '—',
    revenue: beMonth ? beMonth.monthlyRevenue : '—',
    contribution: beMonth ? beMonth.monthlyContribution : '—',
    operatingProfit: beMonth ? beMonth.operatingProfit : '—',
    cumulativeProfit: beMonth ? beMonth.cumulativeOperatingProfit : '—',
    roiPercent: beMonth ? beMonth.roiPercent : 'N/A',
    status: beMonth ? 'achieved' : 'not_reached',
  };

  // 5. OPERATING LOSS RECOVERY (Cumulative Operating Profit >= 0)
  const lossRec = singlePlanProjection.operatingLossRecovery;
  const lossRecoveryMilestone = {
    id: 'operating_loss_recovery',
    title: 'OPERATING LOSS RECOVERY',
    subtitle: 'Cumulative Operating Profit >= 0',
    monthLabel: lossRec ? `Month ${lossRec.monthIndex}` : `NOT REACHED WITHIN ${months.length} MONTHS`,
    dateLabel: lossRec ? lossRec.calendarDate : '—',
    clients: lossRec ? lossRec.closingClients : '—',
    revenue: lossRec ? lossRec.monthlyRevenue : '—',
    contribution: lossRec ? lossRec.monthlyContribution : '—',
    operatingProfit: lossRec ? lossRec.operatingProfit : '—',
    cumulativeProfit: lossRec ? lossRec.cumulativeOperatingProfit : '—',
    roiPercent: lossRec ? lossRec.roiPercent : 'N/A',
    status: lossRec ? 'achieved' : 'not_reached',
  };

  // 6. INVESTMENT RECOVERY / PAYBACK (Cumulative Profit >= Initial Investment)
  const invRec = singlePlanProjection.investmentRecovery;
  const isInvNa = investedCapital <= 0;
  const investmentRecoveryMilestone = {
    id: 'investment_recovery',
    title: 'INVESTMENT RECOVERY / PAYBACK',
    subtitle: isInvNa ? 'No Initial Capital Configured' : '100% Upfront Capital Repaid',
    monthLabel: isInvNa ? 'N/A' : invRec ? `Month ${invRec.monthIndex}` : `NOT REACHED WITHIN ${months.length} MONTHS`,
    dateLabel: isInvNa ? 'N/A' : invRec ? invRec.calendarDate : '—',
    clients: isInvNa ? 'N/A' : invRec ? invRec.closingClients : '—',
    revenue: isInvNa ? 'N/A' : invRec ? invRec.monthlyRevenue : '—',
    contribution: isInvNa ? 'N/A' : invRec ? invRec.monthlyContribution : '—',
    operatingProfit: isInvNa ? 'N/A' : invRec ? invRec.operatingProfit : '—',
    cumulativeProfit: isInvNa ? 'N/A' : invRec ? invRec.cumulativeOperatingProfit : '—',
    roiPercent: isInvNa ? 'N/A' : invRec ? invRec.roiPercent : 'N/A',
    status: isInvNa ? 'na' : invRec ? 'achieved' : 'not_reached',
  };

  // 7. 100% ROI
  const m100 = singlePlanProjection.roi100MonthIndex ? months[singlePlanProjection.roi100MonthIndex - 1] : null;
  const roi100Milestone = {
    id: 'roi_100',
    title: '100% ROI',
    subtitle: isInvNa ? 'N/A' : 'Doubled Capital',
    monthLabel: isInvNa ? 'N/A' : m100 ? `Month ${m100.monthIndex}` : `NOT REACHED WITHIN ${months.length} MONTHS`,
    dateLabel: isInvNa ? 'N/A' : m100 ? m100.calendarDate : '—',
    clients: isInvNa ? 'N/A' : m100 ? m100.closingClients : '—',
    revenue: isInvNa ? 'N/A' : m100 ? m100.monthlyRevenue : '—',
    contribution: isInvNa ? 'N/A' : m100 ? m100.monthlyContribution : '—',
    operatingProfit: isInvNa ? 'N/A' : m100 ? m100.operatingProfit : '—',
    cumulativeProfit: isInvNa ? 'N/A' : m100 ? m100.cumulativeOperatingProfit : '—',
    roiPercent: isInvNa ? 'N/A' : m100 ? m100.roiPercent : 'N/A',
    status: isInvNa ? 'na' : m100 ? 'achieved' : 'not_reached',
  };

  // 8. 200% ROI
  const m200 = singlePlanProjection.roi200MonthIndex ? months[singlePlanProjection.roi200MonthIndex - 1] : null;
  const roi200Milestone = {
    id: 'roi_200',
    title: '200% ROI',
    subtitle: isInvNa ? 'N/A' : 'Tripled Capital',
    monthLabel: isInvNa ? 'N/A' : m200 ? `Month ${m200.monthIndex}` : `NOT REACHED WITHIN ${months.length} MONTHS`,
    dateLabel: isInvNa ? 'N/A' : m200 ? m200.calendarDate : '—',
    clients: isInvNa ? 'N/A' : m200 ? m200.closingClients : '—',
    revenue: isInvNa ? 'N/A' : m200 ? m200.monthlyRevenue : '—',
    contribution: isInvNa ? 'N/A' : m200 ? m200.monthlyContribution : '—',
    operatingProfit: isInvNa ? 'N/A' : m200 ? m200.operatingProfit : '—',
    cumulativeProfit: isInvNa ? 'N/A' : m200 ? m200.cumulativeOperatingProfit : '—',
    roiPercent: isInvNa ? 'N/A' : m200 ? m200.roiPercent : 'N/A',
    status: isInvNa ? 'na' : m200 ? 'achieved' : 'not_reached',
  };

  // 9. SUSTAINABLE PROFIT (Closing Month of Horizon)
  const finalM = singlePlanProjection.finalMonth;
  const sustainableMilestone = {
    id: 'sustainable_profit',
    title: 'SUSTAINABLE PROFIT',
    subtitle: `Horizon Exit (${months.length} Months)`,
    monthLabel: `Month ${finalM ? finalM.monthIndex : months.length}`,
    dateLabel: finalM ? finalM.calendarDate : '—',
    clients: finalM ? finalM.closingClients : 0,
    revenue: finalM ? finalM.monthlyRevenue : 0,
    contribution: finalM ? finalM.monthlyContribution : 0,
    operatingProfit: finalM ? finalM.operatingProfit : 0,
    cumulativeProfit: finalM ? finalM.cumulativeOperatingProfit : 0,
    roiPercent: finalM && investedCapital > 0 ? finalM.roiPercent : 'N/A',
    status: finalM && finalM.operatingProfit > 0 ? 'achieved' : 'not_reached',
  };

  return [
    todayMilestone,
    firstGrowthMilestone,
    firstProfitMilestone,
    breakEvenMilestone,
    lossRecoveryMilestone,
    investmentRecoveryMilestone,
    roi100Milestone,
    roi200Milestone,
    sustainableMilestone,
  ];
}
