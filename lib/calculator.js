/**
 * ARTNCE Painting Cost Calculation Engine
 * Pure, UI-agnostic, formula-driven calculation module.
 * 
 * Precision: All internal operations maintain full floating-point precision.
 * Rounding is applied strictly at presentation/formatting time.
 */

// Re-export defaults and tokens for backward compatibility
export {
  DESIGN_TOKENS,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  DEFAULT_WORK_TYPE,
  WORK_TYPES,
  DEFAULT_ARTIST_CONTEXT,
  ARTIST_RENT_FREQUENCIES,
  ARTWORK_SOURCES,
  DEFAULT_SETTINGS,
  DEFAULT_PRICING,
  DEFAULT_CURATOR_PRICING,
  DEFAULT_RECOVERY_SETTINGS,
  DEFAULT_EXPECTED_MONTHLY_REVENUE,
  SUBSCRIPTION_TERMS,
  ROTATION_INTERVALS,
  STORAGE_KEY,
  STORAGE_KEY_BATCH,
  STORAGE_KEY_CURATION,
  STORAGE_KEY_SUBSCRIPTION,
  STORAGE_KEY_QUOTES,
  STORAGE_KEY_COMPANY_COSTS,
  STORAGE_KEY_PLANS,
  STORAGE_KEY_PORTFOLIO,
  STORAGE_KEY_WORK_TYPE,
  STORAGE_KEY_ARTIST,
  STORAGE_KEY_CURATOR_PRICING,
  STORAGE_KEY_COMPANY_PERFORMANCE,
  makeId,
  createEmptyPainting,
  createDefaultBatch,
  DEFAULT_CURATION_CONTEXT,
  DEFAULT_OPERATING_COSTS,
  DEFAULT_SUBSCRIPTION,
  DEFAULT_EMPLOYEES,
  DEFAULT_BIKE_REIMBURSEMENT,
  DEFAULT_COMPANY_COSTS,
  DEFAULT_PLANS,
  DEFAULT_PORTFOLIO_MIX,
  createDefaultCustomPlan,
  SUBSCRIPTION_PRESETS,
  STANDARD_DURATIONS,
} from './defaults.js';

import {
  DEFAULT_CURATOR_PRICING,
  DEFAULT_RECOVERY_SETTINGS,
  DEFAULT_EXPECTED_MONTHLY_REVENUE,
} from './defaults.js';

/**
 * Coerce value to valid finite number or fallback.
 */
export const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Convert dimensional value to feet based on unit ('ft' | 'in').
 */
export const toFeet = (value, unit) => (unit === 'in' ? value / 12 : value);

/**
 * Compute painting area and perimeter.
 */
export function geometry(widthFt, heightFt) {
  return {
    area: widthFt * heightFt,
    perimeter: 2 * (widthFt + heightFt),
  };
}

/**
 * Calculate stretching and structural support cost.
 * - 'combined' (default): Single perimeter rate covers bars + internal support structure.
 *   Configured rate: ₹90/running ft (or custom setting).
 * - 'separate': Independent perimeter stretching + beam threshold rule.
 */
export function stretchAndSupport(widthFt, heightFt, perimeter, s) {
  if (s.stretchMode === 'combined') {
    return {
      stretchCost: perimeter * num(s.combinedRate),
      beamLength: 0,
      beamCost: 0,
      rate: num(s.combinedRate),
    };
  }
  const stretchCost = perimeter * num(s.stretchOnlyRate);
  const larger = Math.max(widthFt, heightFt);
  const smaller = Math.min(widthFt, heightFt);
  let beamLength = 0;
  if (s.beamFormula !== 'none' && larger >= num(s.beamThreshold)) {
    beamLength =
      s.beamFormula === 'shorter' ? smaller :
      s.beamFormula === 'longer' ? larger :
      s.beamFormula === 'width' ? widthFt :
      s.beamFormula === 'height' ? heightFt : 0;
  }
  return {
    stretchCost,
    beamLength,
    beamCost: beamLength * num(s.beamRate),
    rate: num(s.stretchOnlyRate),
  };
}

/**
 * Build complete itemized production cost breakdown for a single painting.
 * Transportation is strictly calculated as a percentage of the subtotal BEFORE transportation.
 * 
 * @param {number} widthFt - Width in decimal feet
 * @param {number} heightFt - Height in decimal feet
 * @param {Object} s - Cost settings
 * @returns {Object} Full breakdown with itemized rows, subtotal, transport, and total
 */
export function buildBreakdown(widthFt, heightFt, s) {
  const { area, perimeter } = geometry(widthFt, heightFt);
  const rows = [];

  // Canvas Print
  if (s.canvasEnabled) {
    const metricStr = `${area.toFixed(2)} sq ft @ ₹${num(s.canvasPrintRate).toFixed(0)}`;
    rows.push({
      id: 'canvas',
      name: 'Canvas Printing',
      metric: metricStr,
      formula: metricStr,
      cost: area * num(s.canvasPrintRate),
      unit: 'sq ft',
      quantity: area,
      rate: num(s.canvasPrintRate),
    });
  }

  // Stretching & Support
  if (s.stretchEnabled) {
    const ss = stretchAndSupport(widthFt, heightFt, perimeter, s);
    const metricStr = `${perimeter.toFixed(2)} ft @ ₹${ss.rate.toFixed(0)}`;
    rows.push({
      id: 'stretch',
      name: s.stretchMode === 'combined' ? 'Stretching & Support (Combined)' : 'Perimeter Stretching',
      metric: metricStr,
      formula: metricStr,
      cost: ss.stretchCost,
      unit: 'running ft',
      quantity: perimeter,
      rate: ss.rate,
    });
    if (s.stretchMode === 'separate' && ss.beamCost > 0) {
      const beamMetric = `${ss.beamLength.toFixed(2)} ft @ ₹${num(s.beamRate).toFixed(0)}`;
      rows.push({
        id: 'beam',
        name: `Support Beam (${s.beamFormula})`,
        metric: beamMetric,
        formula: beamMetric,
        cost: ss.beamCost,
        unit: 'running ft',
        quantity: ss.beamLength,
        rate: num(s.beamRate),
      });
    }
  }

  // External Frame
  if (s.frameEnabled) {
    const frameMetric = `${perimeter.toFixed(2)} ft @ ₹${num(s.frameRate).toFixed(0)}`;
    rows.push({
      id: 'frame',
      name: `External Frame (${s.frameType || 'Default'})`,
      metric: frameMetric,
      formula: frameMetric,
      cost: perimeter * num(s.frameRate),
      unit: 'running ft',
      quantity: perimeter,
      rate: num(s.frameRate),
    });
  }

  // Additional Line Items
  if (Array.isArray(s.extraComponents)) {
    s.extraComponents
      .filter((c) => c && c.enabled !== false)
      .forEach((c) => {
        const qty = num(c.quantity, 1);
        const rate = num(c.rate, 0);
        const extraMetric = `${qty} ${c.unit || 'units'} @ ₹${rate.toFixed(0)}`;
        rows.push({
          id: c.id || makeId('extra'),
          name: c.name || 'Additional Component',
          metric: extraMetric,
          formula: extraMetric,
          cost: qty * rate,
          unit: c.unit || 'unit',
          quantity: qty,
          rate,
        });
      });
  }

  // Pure Subtotal BEFORE transportation
  const subtotal = rows.reduce((sum, r) => sum + r.cost, 0);

  // Transportation applied strictly to subtotal
  const transportCost = subtotal * (num(s.transportPercent) / 100);

  // Final Total Production Cost
  const total = subtotal + transportCost;

  return {
    area,
    perimeter,
    rows,
    subtotal,
    transportCost,
    total,
  };
}

/**
 * Single Painting Cost Calculator.
 * Validates dimensions, applies conversion, and executes buildBreakdown.
 * 
 * @param {Object} painting - { width, height, unit }
 * @param {Object} settings - Cost settings
 * @returns {Object} Evaluated cost item
 */
export function calculatePaintingCost(painting, settings) {
  const wRaw = num(painting.width);
  const hRaw = num(painting.height);
  const unit = painting.unit || 'ft';

  if (!wRaw || !hRaw || wRaw <= 0 || hRaw <= 0) {
    return {
      isValid: false,
      width: painting.width,
      height: painting.height,
      unit,
      areaSqFt: 0,
      perimeterRunningFt: 0,
      canvasPrintCost: 0,
      stretchingSupportCost: 0,
      frameCost: 0,
      additionalComponentsCost: 0,
      subtotalProductionCost: 0,
      subtotal: 0,
      transportationCost: 0,
      totalProductionCost: 0,
      costPerSqFt: 0,
      rows: [],
      breakdownRows: [],
    };
  }

  const wFt = toFeet(wRaw, unit);
  const hFt = toFeet(hRaw, unit);
  const breakdown = buildBreakdown(wFt, hFt, settings);

  const canvasRow = breakdown.rows.find((r) => r.id === 'canvas');
  const stretchRow = breakdown.rows.find((r) => r.id === 'stretch');
  const beamRow = breakdown.rows.find((r) => r.id === 'beam');
  const frameRow = breakdown.rows.find((r) => r.id === 'frame');

  const extraRows = breakdown.rows.filter(
    (r) => !['canvas', 'stretch', 'beam', 'frame'].includes(r.id)
  );
  const extraCost = extraRows.reduce((sum, r) => sum + r.cost, 0);
  const stretchTotal = (stretchRow?.cost || 0) + (beamRow?.cost || 0);

  return {
    isValid: true,
    width: painting.width,
    height: painting.height,
    unit,
    widthFt: wFt,
    heightFt: hFt,
    wFt,
    hFt,
    areaSqFt: breakdown.area,
    perimeterRunningFt: breakdown.perimeter,
    canvasPrintCost: canvasRow?.cost || 0,
    stretchingSupportCost: stretchTotal,
    frameCost: frameRow?.cost || 0,
    additionalComponentsCost: extraCost,
    subtotalProductionCost: breakdown.subtotal,
    subtotal: breakdown.subtotal,
    transportationCost: breakdown.transportCost,
    totalProductionCost: breakdown.total,
    costPerSqFt: breakdown.area > 0 ? breakdown.total / breakdown.area : 0,
    rows: breakdown.rows,
    breakdownRows: breakdown.rows,
  };
}

/**
 * Batch Cost Calculation Engine
 * Aggregates a list of paintings using calculatePaintingCost.
 */
export function calculateBatchSummary(paintings, settings) {
  if (!Array.isArray(paintings) || paintings.length === 0) {
    return {
      count: 0,
      validCount: 0,
      totalArea: 0,
      totalProductionCost: 0,
      avgCostPerArtwork: 0,
      avgCostPerSqFt: 0,
      calculatedPaintings: [],
    };
  }

  const calculatedPaintings = paintings.map((p) => {
    const cost = calculatePaintingCost(p, settings);
    return { ...p, cost };
  });

  const validOnes = calculatedPaintings.filter((p) => p.cost.isValid);
  const count = paintings.length;
  const validCount = validOnes.length;
  const totalArea = validOnes.reduce((sum, p) => sum + p.cost.areaSqFt, 0);
  const totalProductionCost = validOnes.reduce((sum, p) => sum + p.cost.totalProductionCost, 0);

  const avgCostPerArtwork = validCount > 0 ? totalProductionCost / validCount : 0;
  const avgCostPerSqFt = totalArea > 0 ? totalProductionCost / totalArea : 0;

  return {
    count,
    validCount,
    totalArea,
    totalProductionCost,
    avgCostPerArtwork,
    avgCostPerSqFt,
    calculatedPaintings,
  };
}

/**
 * Curator Pricing Lookup Engine
 * Resolves remote vs physical pricing from plan-based or space-based tables.
 * 
 * @param {Object} curatorSettings Central curator pricing configuration
 * @param {Object} params { planId, spaceSqFt, mode, method }
 * @returns {number} Evaluated price for ONE curation work cycle
 */
export function getCuratorPrice(curatorSettings = DEFAULT_CURATOR_PRICING, params = {}) {
  const { planId = null, spaceSqFt = null, mode = 'remote', method = null } = params || {};
  const cfg = curatorSettings || DEFAULT_CURATOR_PRICING;
  const activeMethod = method || (spaceSqFt !== null && !planId ? 'space' : (cfg.method || 'plan'));

  if (activeMethod === 'space' && Array.isArray(cfg.spaceBased)) {
    const targetSqFt = Math.max(0, num(spaceSqFt));
    const tier = cfg.spaceBased.find((t) => targetSqFt <= t.maxSqFt) || cfg.spaceBased[cfg.spaceBased.length - 1];
    if (tier) {
      return mode === 'physical' ? num(tier.physicalPrice) : num(tier.remotePrice);
    }
  }

  // Plan-based lookup
  const targetPlanId = planId || 'essential';
  const planTier = cfg.planBased?.[targetPlanId] || cfg.planBased?.essential;
  if (planTier) {
    return mode === 'physical' ? num(planTier.physicalPrice) : num(planTier.remotePrice);
  }

  return mode === 'physical' ? 2000 : 1000;
}

/**
 * Event & Cycle Counting Engine
 * Calculates actual delivery/curation/installation event counts for a subscription term.
 * 
 * Example: 12-month term + 3-month rotation = 3 rotation events (Month 3, 6, 9)
 * Total curation events = 1 initial + 3 rotation = 4 events.
 * 
 * @param {Object} params { subscriptionMonths, rotationMonths, includeEndOfTerm }
 * @returns {Object} Event counts
 */
export function calculateEventCounts({ subscriptionMonths = 12, rotationMonths = 3, includeEndOfTerm = false }) {
  const subMo = Math.max(1, num(subscriptionMonths, 12));
  const rotMo = Math.max(1, num(rotationMonths, 3));

  // Count rotation events occurring strictly during the term
  let rotationEvents = Math.floor(subMo / rotMo);
  if (!includeEndOfTerm && subMo % rotMo === 0 && rotationEvents > 0) {
    rotationEvents -= 1; // Last cycle is end of contract
  }
  rotationEvents = Math.max(0, rotationEvents);

  const initialCurationEvents = 1;
  const rotationCurationEvents = rotationEvents;
  const totalCurationEvents = initialCurationEvents + rotationCurationEvents;

  const initialInstallationEvents = 1;
  const rotationInstallationEvents = rotationEvents;
  const totalInstallationEvents = initialInstallationEvents + rotationInstallationEvents;

  const totalLogisticsEvents = 1 + rotationEvents;
  const totalPackagingEvents = 1 + rotationEvents;
  const totalTravelEvents = 1 + rotationEvents;

  return {
    subscriptionMonths: subMo,
    rotationMonths: rotMo,
    rotationEvents,
    initialCurationEvents,
    rotationCurationEvents,
    totalCurationEvents,
    initialInstallationEvents,
    rotationInstallationEvents,
    totalInstallationEvents,
    totalLogisticsEvents,
    totalPackagingEvents,
    totalTravelEvents,
  };
}

/**
 * Artwork Investment Recovery & Markup Engine
 * Calculates markup, target recovery value, recovery progress, and break-even cycle.
 * 
 * Formula:
 * Markup Amount = Initial Investment × (Markup % / 100)
 * Target Recovery Value = Initial Investment + Markup Amount
 * Example: ₹17,967 × 60% = ₹10,780.20 → Target = ₹28,747.20
 * 
 * Strictly preserves distinction between Markup % and Gross Margin %.
 * 
 * @param {Object} params
 * @returns {Object} Structured recovery metrics and 24-month trajectory
 */
export function calculateArtworkRecovery({
  initialInvestment = 0,
  markupPercent = 60,
  monthlyContribution = 0,
  monthlySubscription = 0,
  customTarget = null,
}) {
  const investment = Math.max(0, num(initialInvestment));
  const markupPct = Math.max(0, num(markupPercent, 60));
  const markupAmount = investment * (markupPct / 100);
  const targetRecoveryValue = customTarget !== null ? Math.max(0, num(customTarget)) : investment + markupAmount;

  // Gross margin equivalent (mathematically distinct from markup)
  const grossMarginPct = targetRecoveryValue > 0 ? (markupAmount / targetRecoveryValue) * 100 : 0;

  const cont = num(monthlyContribution);
  const sub = num(monthlySubscription);

  // Simple recovery (Initial Investment ÷ Monthly Subscription Revenue)
  const simpleRecoveryMonths = sub > 0 && investment > 0 ? investment / sub : null;

  // Estimated recovery (Initial Investment ÷ Monthly Contribution)
  const estimatedRecoveryMonths = cont > 0 && investment > 0 ? investment / cont : null;

  // Target recovery months with markup (Target Recovery Value ÷ Monthly Contribution)
  const targetRecoveryMonths = cont > 0 && targetRecoveryValue > 0 ? targetRecoveryValue / cont : null;

  const isAchievable = cont > 0 && targetRecoveryValue > 0;

  // 24-Month Trajectory
  const trajectory = [];
  for (let m = 1; m <= 24; m++) {
    const recovered = Math.min(targetRecoveryValue, Math.max(0, cont * m));
    const remaining = Math.max(0, targetRecoveryValue - recovered);
    const progressPct = targetRecoveryValue > 0 ? Math.min(100, (recovered / targetRecoveryValue) * 100) : 0;
    const isTargetReached = recovered >= targetRecoveryValue && targetRecoveryValue > 0;

    trajectory.push({
      month: m,
      monthLabel: `${m} mo`,
      monthlyContribution: cont,
      recovered,
      remaining,
      progressPct,
      isTargetReached,
    });
  }

  return {
    initialInvestment: investment,
    markupPercent: markupPct,
    markupAmount,
    targetRecoveryValue,
    grossMarginPct,
    simpleRecoveryMonths,
    estimatedRecoveryMonths,
    targetRecoveryMonths,
    targetRecoveryMonthCeil: targetRecoveryMonths ? Math.ceil(targetRecoveryMonths) : null,
    targetReachedMonth: targetRecoveryMonths ? Math.ceil(targetRecoveryMonths) : null,
    markupTargetAchievedIn12Mo: targetRecoveryMonths ? targetRecoveryMonths <= 12 : false,
    isAchievable,
    trajectory,
  };
}

/**
 * Company-Level Operating Costs Calculator
 * Computes monthly employee salary pool, bike travel reimbursement,
 * and company-wide operating expenses.
 */
export function calculateCompanyOperatingCosts(companyCosts = {}) {
  const employees = Array.isArray(companyCosts.employees) ? companyCosts.employees : [];
  const totalEmployeeSalary = employees.reduce(
    (sum, e) => sum + Math.max(0, num(e.monthlySalary)),
    0
  );
  const employeeCount = employees.length;

  const bike = companyCosts.bikeReimbursement || {};
  const bikeRate = Math.max(0, num(bike.ratePerKm, 3));
  const bikeKm = Math.max(0, num(bike.monthlyKm, 2000));
  const monthlyBikeReimbursement = bikeRate * bikeKm;

  const otherExpenses = Array.isArray(companyCosts.otherRecurringExpenses)
    ? companyCosts.otherRecurringExpenses
    : [];
  const totalOtherMonthly = otherExpenses.reduce(
    (sum, o) => sum + Math.max(0, num(o.amount)),
    0
  );

  const totalCompanyMonthly =
    totalEmployeeSalary + monthlyBikeReimbursement + totalOtherMonthly;

  return {
    employees,
    employeeCount,
    totalEmployeeSalary,
    bikeRate,
    bikeKm,
    monthlyBikeReimbursement,
    otherExpenses,
    totalOtherMonthly,
    totalCompanyMonthly,
  };
}

/**
 * Curator Project Fee Calculator
 * Strictly project / visit-cycle based.
 * Formula: Total Curator Cost = Curator Fee Per Visit/Cycle × Number of Actual Visits/Cycles
 */
export function calculateCuratorFee(curator = {}) {
  const feePerCycle = Math.max(0, num(curator.feePerCycle, 2000));
  const cycles = Math.max(1, num(curator.cycles, 1));
  const totalCuratorCost = feePerCycle * cycles;

  const spaceSqFt = Math.max(0, num(curator.spaceSqFt, 0));
  const artworkCount = Math.max(0, num(curator.artworkCount, 0));
  const complexity = curator.complexity || 'standard';

  return {
    feePerCycle,
    cycles,
    totalCuratorCost,
    spaceSqFt,
    artworkCount,
    complexity,
    justification:
      curator.justification ||
      `Base fee of ₹${fmtNum(feePerCycle)} across ${cycles} curation cycle(s)`,
  };
}

/**
 * Subscription & Recurring Recovery Calculation Engine
 */
export function calculateSubscriptionEconomics({
  initialInvestment = 0,
  monthlySubscription = 0,
  operatingCosts = {},
  monthlyOperatingCosts: explicitMonthlyOp = null,
  projectCosts = 0,
  durations = [3, 6, 12, 24],
}) {
  const investment = Math.max(0, num(initialInvestment));
  const rev = Math.max(0, num(monthlySubscription));

  let monthlyOperatingCosts = 0;
  if (explicitMonthlyOp !== null && explicitMonthlyOp !== undefined) {
    monthlyOperatingCosts = Math.max(0, num(explicitMonthlyOp));
  } else if (typeof operatingCosts === 'number') {
    monthlyOperatingCosts = Math.max(0, num(operatingCosts));
  } else if (operatingCosts && typeof operatingCosts === 'object') {
    monthlyOperatingCosts = Object.entries(operatingCosts).reduce(
      (sum, [k, v]) => (k === 'otherLabel' ? sum : sum + Math.max(0, num(v))),
      0
    );
  }

  const monthlyContribution = rev - monthlyOperatingCosts;

  const simpleRecoveryMonths =
    rev > 0 && investment > 0 ? investment / rev : null;

  const isRecoveryAchievable = monthlyContribution > 0 && investment > 0;
  const estimatedRecoveryMonths =
    isRecoveryAchievable ? investment / monthlyContribution : null;

  let unachievableReason = null;
  if (investment === 0) {
    unachievableReason = 'No curated artworks selected. Add artworks to calculate investment recovery.';
  } else if (rev <= 0) {
    unachievableReason = 'Enter a monthly subscription price to calculate recovery.';
  } else if (monthlyContribution <= 0) {
    unachievableReason = 'Investment recovery is not achievable at the current subscription price and operating costs.';
  }

  const scenarios = (durations || [3, 6, 12, 24]).map((months) => {
    const totalRevenue = rev * months;
    const operatingCostsTotal = monthlyOperatingCosts * months;
    const totalContribution = totalRevenue - operatingCostsTotal;
    const contributionAfterInvestment = totalContribution - investment;
    const isRecovered = investment > 0 && totalContribution >= investment;

    return {
      months,
      durationLabel: `${months} mo`,
      monthlyRevenue: rev,
      totalRevenue,
      operatingCostsTotal,
      totalContribution,
      initialInvestment: investment,
      contributionAfterInvestment,
      isRecovered,
    };
  });

  return {
    initialInvestment: investment,
    monthlySubscription: rev,
    monthlyOperatingCosts,
    monthlyContribution,
    simpleRecoveryMonths,
    estimatedRecoveryMonths,
    isRecoveryAchievable,
    unachievableReason,
    scenarios,
    projectCosts: Math.max(0, num(projectCosts)),
  };
}

/**
 * Plan Economics Engine (Additive DDC vs COA Build-Up)
 * Evaluates a single subscription plan against company operating model and artwork investment.
 * 
 * Features:
 * - Clear Additive Economics Build-Up:
 *     REVENUE
 *     → DIRECT DELIVERY COST (DDC)
 *     → COMPANY OVERHEAD ALLOCATION (COA)
 *     → TOTAL COST
 *     → CONTRIBUTION REMAINING
 * - Event-based cycles for Curator, Installation, Rotation, Logistics, Packaging, Travel
 * - Separate tracking for Artist Payment and Artist Rent
 * - 60% Markup Recovery Analysis
 * - Multi-Duration Scenarios (3, 6, 12, 24 months)
 * 
 * @param {Object} plan Plan configuration
 * @param {Object} companyCosts Company operating costs model
 * @param {Object} curatedSummary Curated summary
 * @param {Object} settings Settings
 * @param {Array} availablePaintings Available paintings
 * @param {Object} artistContext Artist context
 * @param {Object} curatorPricingSettings Curator central pricing
 * @returns {Object} Evaluated economics model
 */
export function calculatePlanEconomics(
  plan,
  companyCosts = {},
  curatedSummary = { totalProductionCost: 0, validCount: 0, totalArea: 0 },
  settings = {},
  availablePaintings = [],
  artistContext = {},
  curatorPricingSettings = DEFAULT_CURATOR_PRICING
) {
  if (!plan) return null;

  // 1. Client / Project Artwork Scope Determination
  let initialInvestment = 0;
  let artworkCount = 0;
  let totalArea = 0;
  let avgCostPerArtwork = 0;
  let assignedPaintings = [];

  const spaceSqFt = Math.max(0, num(plan.spaceSqFt));

  if (plan.artworkSource === 'custom') {
    artworkCount = Math.max(0, num(plan.customArtworkCount || plan.artworkCount));
    totalArea = Math.max(0, num(plan.customTotalArea));
    initialInvestment = Math.max(0, num(plan.customInitialInvestment));
    avgCostPerArtwork = artworkCount > 0 ? initialInvestment / artworkCount : 0;
    assignedPaintings = [];
  } else {
    if (Array.isArray(plan.selectedPaintingIds)) {
      const selSet = new Set(plan.selectedPaintingIds);
      const matched = (availablePaintings || []).filter(
        (p) => selSet.has(p.id) && (p.cost?.isValid || (p.width && p.height))
      );
      const batchSum = calculateBatchSummary(matched, settings);
      artworkCount = batchSum.validCount;
      totalArea = batchSum.totalArea;
      initialInvestment = batchSum.totalProductionCost;
      avgCostPerArtwork = batchSum.avgCostPerArtwork;
      assignedPaintings = batchSum.calculatedPaintings;
    } else if (curatedSummary && (curatedSummary.validCount > 0 || num(curatedSummary.totalProductionCost) > 0)) {
      artworkCount = num(curatedSummary.validCount);
      totalArea = num(curatedSummary.totalArea);
      initialInvestment = num(curatedSummary.totalProductionCost);
      avgCostPerArtwork = num(curatedSummary.avgCostPerArtwork);
      assignedPaintings = curatedSummary.calculatedPaintings || [];
    } else {
      artworkCount = Math.max(0, num(plan.artworkCount));
      totalArea = Math.max(0, num(plan.customTotalArea || 0));
      initialInvestment = Math.max(0, num(plan.customInitialInvestment));
      avgCostPerArtwork = artworkCount > 0 ? initialInvestment / artworkCount : 0;
      assignedPaintings = [];
    }
  }

  // 2. Subscription Term & Rotation Cycles Event Count
  const subscriptionMonths = Math.max(1, num(plan.subscriptionMonths, 12));
  const rotationMonths = Math.max(1, num(plan.rotationMonths, 3));
  const eventCounts = calculateEventCounts({ subscriptionMonths, rotationMonths });

  // 3. Curator Pricing (Remote vs Physical per cycle)
  const curationMode = plan.curationMode || plan.curator?.mode || 'remote';
  const curationPricePerEvent = num(
    plan.curationFeePerEvent ||
    plan.curator?.feePerCycle ||
    getCuratorPrice(curatorPricingSettings, { planId: plan.id, spaceSqFt, mode: curationMode })
  );
  const curatorCycles = plan.curator?.cycles !== undefined ? num(plan.curator.cycles) : eventCounts.totalCurationEvents;
  const totalCurationCost = curationPricePerEvent * curatorCycles;

  // 4. Project Events (Installation, Rotation, Logistics, Packaging, Travel)
  const installCycles = plan.installation?.cycles !== undefined ? num(plan.installation.cycles) : eventCounts.totalInstallationEvents;
  const installFee = Math.max(0, num(plan.installation?.feePerCycle, 1500));
  const totalInstallationCost = installFee * installCycles;

  const rotationCycles = plan.rotation?.cycles !== undefined ? num(plan.rotation.cycles) : eventCounts.rotationEvents;
  const rotationFee = Math.max(0, num(plan.rotation?.feePerCycle, 1000));
  const totalRotationCost = rotationFee * rotationCycles;

  const logisticsCycles = plan.logistics?.cycles !== undefined ? num(plan.logistics.cycles) : eventCounts.totalLogisticsEvents;
  const logisticsFee = Math.max(0, num(plan.logistics?.feePerCycle, 1200));
  const totalLogisticsCost = logisticsFee * logisticsCycles;

  const packagingCycles = plan.packaging?.cycles !== undefined ? num(plan.packaging.cycles) : eventCounts.totalPackagingEvents;
  const packagingFee = Math.max(0, num(plan.packaging?.feePerCycle, 400));
  const totalPackagingCost = packagingFee * packagingCycles;

  const travelCycles = plan.projectTravel?.cycles !== undefined ? num(plan.projectTravel.cycles) : eventCounts.totalTravelEvents;
  const travelFee = Math.max(0, num(plan.projectTravel?.feePerCycle, 600));
  const totalProjectTravelCost = travelFee * travelCycles;

  const otherProjectCostsTotal = (plan.otherProjectCosts || []).reduce(
    (sum, o) => sum + Math.max(0, num(o.amount)),
    0
  );

  const totalProjectVisitCosts =
    totalCurationCost +
    totalInstallationCost +
    totalRotationCost +
    totalLogisticsCost +
    totalPackagingCost +
    totalProjectTravelCost +
    otherProjectCostsTotal;

  // 5. Monthly Direct Delivery Costs (DDC)
  const maintenanceMonthly = Math.max(0, num(plan.maintenanceMonthly));
  const artistRecurringMonthly = Math.max(0, num(plan.artistRecurringMonthly || artistContext.artistPayment));
  const artistRentMonthly = Math.max(0, num(plan.artistRentMonthly || artistContext.artistRent)); // Separate from payment!
  const manpowerMonthly = Math.max(0, num(plan.manpowerMonthly, 300));
  const travelMonthlyAllocation = Math.max(0, num(plan.travelMonthlyAllocation));
  const packagingMonthly = Math.max(0, num(plan.packagingMonthly));
  const otherMonthly = (plan.otherMonthlyCosts || []).reduce(
    (sum, o) => sum + Math.max(0, num(o.amount)),
    0
  );

  // Pure recurring monthly direct delivery
  const totalMonthlyClientDeliveryCost =
    maintenanceMonthly +
    artistRecurringMonthly +
    artistRentMonthly +
    manpowerMonthly +
    travelMonthlyAllocation +
    packagingMonthly +
    otherMonthly;

  // 6. Company Operating Model & COA (Company Overhead Allocation)
  const companyCalc = calculateCompanyOperatingCosts(companyCosts);

  let allocatedEmployeeSalary = 0;
  if (plan.employeeAllocationType === 'fixed') {
    allocatedEmployeeSalary = Math.max(0, num(plan.fixedEmployeeAllocation));
  } else {
    const pct = Math.max(0, num(plan.employeeAllocationPercent));
    allocatedEmployeeSalary = companyCalc.totalEmployeeSalary * (pct / 100);
  }

  const officeAllocationMonthly = Math.max(0, num(plan.officeAllocationMonthly, 0));
  const technologyAllocationMonthly = Math.max(0, num(plan.technologyAllocationMonthly, 0));
  const companyTravelAllocationMonthly = Math.max(0, num(plan.companyTravelAllocationMonthly, 0));
  const companyOverheadMonthly = Math.max(0, num(plan.companyOverheadMonthly, 0));

  const totalCompanyOverheadAllocation =
    allocatedEmployeeSalary +
    officeAllocationMonthly +
    technologyAllocationMonthly +
    companyTravelAllocationMonthly +
    companyOverheadMonthly;

  // Total monthly operating cost (DDC recurring + COA)
  const totalMonthlyOperatingCosts = totalMonthlyClientDeliveryCost + totalCompanyOverheadAllocation;

  // 7. Revenue & Contributions
  const monthlySubscription = Math.max(0, num(plan.monthlySubscription));

  // Level 1: Client Contribution (Before Company Overhead)
  const monthlyContributionBeforeOverhead = monthlySubscription - totalMonthlyClientDeliveryCost;

  // Level 2: Contribution After Company Overhead Allocation (Not called profit)
  const monthlyContribution = monthlyContributionBeforeOverhead - totalCompanyOverheadAllocation;

  // 8. Artwork Investment Recovery (with 60% default markup)
  const markupPercent = Math.max(0, num(plan.markupPercent, 60));
  const recovery = calculateArtworkRecovery({
    initialInvestment,
    markupPercent,
    monthlyContribution: monthlyContributionBeforeOverhead,
    monthlySubscription,
  });

  // 9. Multi-Duration Scenarios (3, 6, 12, 24 months) with exact event counts
  const scenarioDurations = [3, 6, 12, 24];
  const scenarios = scenarioDurations.map((months) => {
    const termEvents = calculateEventCounts({ subscriptionMonths: months, rotationMonths });
    const termRev = monthlySubscription * months;
    const termRecurringDdc = totalMonthlyClientDeliveryCost * months;
    const termCoa = totalCompanyOverheadAllocation * months;

    const termEventCosts =
      curationPricePerEvent * termEvents.totalCurationEvents +
      installFee * termEvents.totalInstallationEvents +
      rotationFee * termEvents.rotationEvents +
      logisticsFee * termEvents.totalLogisticsEvents +
      packagingFee * termEvents.totalPackagingEvents +
      travelFee * termEvents.totalTravelEvents;

    const termTotalDdc = termRecurringDdc + termEventCosts;
    const termTotalCost = termTotalDdc + termCoa;
    const termContribution = termRev - termTotalCost;
    const termContributionAfterInvestment = termContribution - initialInvestment;
    const isRecovered = initialInvestment > 0 && termContribution >= initialInvestment;

    const markupTarget = recovery.targetRecoveryValue;
    const amountRecovered = Math.min(markupTarget, Math.max(0, termContribution));
    const remainingRecovery = Math.max(0, markupTarget - amountRecovered);
    const isTargetReached = amountRecovered >= markupTarget && markupTarget > 0;

    return {
      months,
      durationLabel: `${months} mo`,
      monthlyRevenue: monthlySubscription,
      totalRevenue: termRev,
      operatingCostsTotal: termTotalCost,
      totalDdc: termTotalDdc,
      totalCoa: termCoa,
      totalContribution: termContribution,
      initialInvestment,
      contributionAfterInvestment: termContributionAfterInvestment,
      markupTarget,
      amountRecovered,
      remainingRecovery,
      isRecovered,
      isTargetReached,
    };
  });

  return {
    planId: plan.id,
    planName: plan.name,
    tagline: plan.tagline,
    exampleScenarioLabel: plan.exampleScenarioLabel,
    isCustom: Boolean(plan.isCustom),
    spaceSqFt,
    artworkCount,
    totalArea,
    avgCostPerArtwork,
    artworkSource: plan.artworkSource || 'curated',
    selectedPaintingIds: plan.selectedPaintingIds,
    assignedPaintings,

    // Timing & Cycles
    subscriptionMonths,
    rotationMonths,
    eventCounts,

    // Initial Artwork Investment
    initialInvestment,
    markupPercent,
    recovery,

    // Additive Direct Delivery Costs (DDC)
    ddc: {
      curationPricePerEvent,
      curationMode,
      totalCurationCost,
      installationFeePerEvent: installFee,
      totalInstallationCost,
      rotationFeePerEvent: rotationFee,
      totalRotationCost,
      logisticsFeePerEvent: logisticsFee,
      totalLogisticsCost,
      packagingFeePerEvent: packagingFee,
      totalPackagingCost,
      travelFeePerEvent: travelFee,
      totalProjectTravelCost,
      maintenanceMonthly,
      artistRecurringMonthly,
      artistRentMonthly,
      manpowerMonthly,
      travelMonthlyAllocation,
      packagingMonthly,
      otherMonthly,
      totalMonthlyClientDeliveryCost,
      totalProjectVisitCosts,
    },

    // Additive Company Overhead Allocation (COA)
    coa: {
      allocatedEmployeeSalary,
      employeeAllocationPercent: num(plan.employeeAllocationPercent),
      officeAllocationMonthly,
      technologyAllocationMonthly,
      companyTravelAllocationMonthly,
      companyOverheadMonthly,
      totalCompanyOverheadAllocation,
      companyEmployeePool: companyCalc.totalEmployeeSalary,
    },

    // Total Costs & Additive Build-up
    totalMonthlyClientDeliveryCost,
    totalCompanyOverheadAllocation,
    totalMonthlyOperatingCosts,
    monthlyOperatingCosts: totalMonthlyOperatingCosts,
    totalProjectVisitCosts,

    // Top-level direct cost access for backward compatibility
    companyEmployeePool: companyCalc.totalEmployeeSalary,
    allocatedEmployeeSalary,
    employeeAllocationPercent: num(plan.employeeAllocationPercent),
    maintenanceMonthly,
    artistRecurringMonthly,
    artistRentMonthly,
    manpowerMonthly,
    travelMonthlyAllocation,
    packagingMonthly,
    otherMonthly,
    officeAllocationMonthly,
    technologyAllocationMonthly,
    companyTravelAllocationMonthly,
    companyOverheadMonthly,

    // Revenue & Contributions
    monthlySubscription,
    monthlyContributionBeforeOverhead, // Level 1: Client Contribution
    monthlyContribution, // Level 2: Contribution After Company Overhead Allocation

    // Legacy compat
    simpleRecoveryMonths: recovery.simpleRecoveryMonths,
    estimatedRecoveryMonths: recovery.estimatedRecoveryMonths,
    isRecoveryAchievable: recovery.isAchievable,
    unachievableReason: !recovery.isAchievable
      ? initialInvestment === 0
        ? 'No artworks in scope'
        : 'Monthly contribution does not cover investment'
      : null,
    scenarios,
    curator: {
      feePerCycle: curationPricePerEvent,
      cycles: curatorCycles,
      totalCuratorCost: totalCurationCost,
      total: totalCurationCost,
      mode: curationMode,
      complexity: plan.curator?.complexity || 'standard',
      spaceSqFt,
    },
    installation: {
      feePerCycle: installFee,
      cycles: installCycles,
      total: totalInstallationCost,
    },
    rotation: {
      feePerCycle: rotationFee,
      cycles: rotationCycles,
      total: totalRotationCost,
    },
    logistics: {
      feePerCycle: logisticsFee,
      cycles: logisticsCycles,
      total: totalLogisticsCost,
    },
    packaging: {
      feePerCycle: packagingFee,
      cycles: packagingCycles,
      total: totalPackagingCost,
    },
    projectTravel: {
      feePerCycle: travelFee,
      cycles: travelCycles,
      total: totalProjectTravelCost,
    },
  };
}

/**
 * Company Performance & Portfolio Sustainability Engine
 * Aggregates portfolio across active clients, analyzes expected monthly revenue target,
 * calculates gap suggestions, and produces data series for 4 interactive SVG graphs.
 * 
 * @param {Object} params
 * @returns {Object} Comprehensive company performance model
 */
export function calculateCompanyPerformance({
  expectedMonthlyRevenue = DEFAULT_EXPECTED_MONTHLY_REVENUE,
  portfolioMix = {},
  plans = {},
  companyCosts = {},
  plansEconomics = {},
}) {
  const targetRev = Math.max(0, num(expectedMonthlyRevenue, DEFAULT_EXPECTED_MONTHLY_REVENUE));
  const companyCalc = calculateCompanyOperatingCosts(companyCosts);
  const companyRecurringCost =
    companyCalc.totalEmployeeSalary +
    companyCalc.monthlyBikeReimbursement +
    (companyCalc.otherExpenses || []).reduce((s, o) => s + Math.max(0, num(o.amount)), 0);

  let totalActiveClients = 0;
  let totalMonthlySubscriptionRevenue = 0;
  let totalMonthlyClientDeliveryCosts = 0;
  let totalMonthlyClientContributionBeforeOverhead = 0;
  let totalAllocatedStaff = 0;
  let totalArtworkInvestment = 0;
  let totalTargetRecoveryValue = 0;
  const breakdown = [];

  for (const [planId, plan] of Object.entries(plans)) {
    const clientCount = Math.max(0, parseInt(portfolioMix[planId], 10) || 0);
    const econ = plansEconomics[planId] || {};

    const sub = num(econ.monthlySubscription || plan.monthlySubscription);
    const delCost = num(econ.totalMonthlyClientDeliveryCost);
    const clientCont = sub - delCost;
    const staffAlloc = num(econ.allocatedEmployeeSalary);
    const artInv = num(econ.initialInvestment);
    const targetRec = num(econ.recovery?.targetRecoveryValue || artInv * 1.6);

    const revenueTotal = sub * clientCount;
    const deliveryCostTotal = delCost * clientCount;
    const contributionBeforeOverheadTotal = clientCont * clientCount;
    const staffAllocTotal = staffAlloc * clientCount;

    totalActiveClients += clientCount;
    totalMonthlySubscriptionRevenue += revenueTotal;
    totalMonthlyClientDeliveryCosts += deliveryCostTotal;
    totalMonthlyClientContributionBeforeOverhead += contributionBeforeOverheadTotal;
    totalAllocatedStaff += staffAllocTotal;
    totalArtworkInvestment += artInv * clientCount;
    totalTargetRecoveryValue += targetRec * clientCount;

    breakdown.push({
      planId,
      planName: plan.name || planId,
      clientCount,
      monthlySubscription: sub,
      totalMonthlyClientDeliveryCost: delCost,
      monthlyContributionBeforeOverhead: clientCont,
      allocatedEmployeeSalary: staffAlloc,
      initialInvestment: artInv,
      targetRecoveryValue: targetRec,
      revenueTotal,
      deliveryCostTotal,
      contributionBeforeOverheadTotal,
      staffAllocTotal,
      singlePlanBreakevenClients: clientCont > 0 ? Math.ceil(companyRecurringCost / clientCont) : null,
      singlePlanTargetGapClients: targetRev > 0 && sub > 0 ? Math.ceil(targetRev / sub) : null,
    });
  }

  // Target Analysis
  const revenueGap = Math.max(0, targetRev - totalMonthlySubscriptionRevenue);
  const revenueSurplus = Math.max(0, totalMonthlySubscriptionRevenue - targetRev);
  const isTargetReached = totalMonthlySubscriptionRevenue >= targetRev;
  const targetProgressPct = targetRev > 0 ? Math.min(100, (totalMonthlySubscriptionRevenue / targetRev) * 100) : 100;

  // Sustainability Analysis
  const portfolioContributionAfterCompanyRecurringCosts =
    totalMonthlyClientContributionBeforeOverhead - companyRecurringCost;
  const isSustainable = portfolioContributionAfterCompanyRecurringCosts >= 0;

  const avgContributionPerClient =
    totalActiveClients > 0 ? totalMonthlyClientContributionBeforeOverhead / totalActiveClients : 0;
  const avgSubscriptionPerClient =
    totalActiveClients > 0 ? totalMonthlySubscriptionRevenue / totalActiveClients : 0;

  // Required Active Clients for Company Breakeven
  const requiredBreakevenClients =
    avgContributionPerClient > 0 ? Math.ceil(companyRecurringCost / avgContributionPerClient) : null;
  const additionalPlansNeeded =
    requiredBreakevenClients ? Math.max(0, requiredBreakevenClients - totalActiveClients) : null;

  // Additional Plans Needed to Hit Revenue Target
  const additionalPlansForTarget =
    revenueGap > 0 && avgSubscriptionPerClient > 0 ? Math.ceil(revenueGap / avgSubscriptionPerClient) : 0;

  // -------------------------------------------------------------------------
  // Graph 1 Data: Investment Recovery Trajectory (24 Months)
  // -------------------------------------------------------------------------
  const recoveryChartData = [];
  for (let m = 1; m <= 24; m++) {
    const cumulativeContribution = totalMonthlyClientContributionBeforeOverhead * m;
    const amountRecovered = Math.min(totalTargetRecoveryValue, cumulativeContribution);
    recoveryChartData.push({
      month: m,
      monthLabel: `M${m}`,
      initialInvestment: totalArtworkInvestment,
      targetRecoveryValue: totalTargetRecoveryValue,
      cumulativeContribution,
      amountRecovered,
      isTargetReached: cumulativeContribution >= totalTargetRecoveryValue && totalTargetRecoveryValue > 0,
    });
  }

  // -------------------------------------------------------------------------
  // Graph 2 Data: Company Monthly Economics
  // -------------------------------------------------------------------------
  const monthlyEconomicsData = [
    { label: 'Revenue', value: totalMonthlySubscriptionRevenue, color: '#221F1C' },
    { label: 'Client DDC', value: totalMonthlyClientDeliveryCosts, color: '#5B5445' },
    { label: 'Company Overhead', value: companyRecurringCost, color: '#B8452D' },
    {
      label: 'Contribution',
      value: portfolioContributionAfterCompanyRecurringCosts,
      color: isSustainable ? '#2B6E4F' : '#A3291B',
    },
  ];

  // -------------------------------------------------------------------------
  // Graph 3 Data: Active Clients Volume vs Contribution Curve (5..50 clients)
  // -------------------------------------------------------------------------
  const volumeSteps = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  const clientVolumeCurveData = volumeSteps.map((vol) => {
    const rev = vol * avgSubscriptionPerClient;
    const ddc = vol * (totalActiveClients > 0 ? totalMonthlyClientDeliveryCosts / totalActiveClients : 0);
    const clientCont = rev - ddc;
    const netCont = clientCont - companyRecurringCost;
    return {
      clients: vol,
      revenue: rev,
      costs: ddc + companyRecurringCost,
      contribution: netCont,
      isBreakeven: netCont >= 0,
    };
  });

  // -------------------------------------------------------------------------
  // Graph 4 Data: Breakeven & Required Plans Analysis
  // -------------------------------------------------------------------------
  const maxPlans = Math.max(50, (requiredBreakevenClients || 20) + 15);
  const breakevenChartData = [];
  for (let c = 0; c <= maxPlans; c += 5) {
    const rev = c * avgSubscriptionPerClient;
    const totalCost = c * (totalActiveClients > 0 ? totalMonthlyClientDeliveryCosts / totalActiveClients : 0) + companyRecurringCost;
    breakevenChartData.push({
      plans: c,
      revenue: rev,
      totalCost,
      targetRevenue: targetRev,
      isCurrent: Math.abs(c - totalActiveClients) < 3,
      isBreakeven: requiredBreakevenClients ? Math.abs(c - requiredBreakevenClients) < 3 : false,
    });
  }

  return {
    breakdown,
    expectedMonthlyRevenue: targetRev,
    targetRevenue: targetRev,
    totalActiveClients,
    totalMonthlySubscriptionRevenue,
    totalMonthlyClientDeliveryCosts,
    totalMonthlyClientContributionBeforeOverhead,
    totalAllocatedStaff,
    totalArtworkInvestment,
    totalTargetRecoveryValue,
    companyRecurringCost,
    portfolioContributionAfterCompanyRecurringCosts,
    isSustainable,

    // Target Analysis
    revenueGap,
    revenueSurplus,
    isTargetReached,
    targetProgressPct,
    additionalPlansForTarget,

    // Required Subscriptions
    avgContributionPerClient,
    avgSubscriptionPerClient,
    requiredBreakevenClients,
    portfolioBreakevenClients: requiredBreakevenClients,
    additionalPlansNeeded,

    // Graph Data
    recoveryChartData,
    monthlyEconomicsData,
    clientVolumeCurveData,
    breakevenChartData,
  };
}

/**
 * Backward compatibility alias for portfolio sustainability
 */
export function calculatePortfolioSustainability(plans, portfolioClients, companyCosts, plansEconomics) {
  return calculateCompanyPerformance({
    expectedMonthlyRevenue: 300000,
    portfolioMix: portfolioClients,
    plans,
    companyCosts,
    plansEconomics,
  });
}

/**
 * Calculate pricing (Markup or Gross Margin).
 * Note: Pricing never feeds back into production cost.
 */
export function calculatePricing(cost, pricing) {
  if (!cost || cost <= 0) return null;
  let sellingPrice;
  if (pricing.method === 'markup') {
    sellingPrice = cost * (1 + num(pricing.markupPercent) / 100);
  } else {
    const m = Math.min(num(pricing.marginPercent), 99);
    sellingPrice = cost / (1 - m / 100);
  }
  const profit = sellingPrice - cost;
  return {
    cost,
    sellingPrice,
    profit,
    marginPct: sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0,
  };
}

/**
 * Number formatting with Indian locale grouping.
 */
export function fmtNum(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return Number(value.toFixed(decimals)).toLocaleString('en-IN');
}

/**
 * Currency formatting with custom symbol and decimal precision.
 */
export function fmtCurrency(value, symbol = '₹', decimals = 0) {
  if (!Number.isFinite(value)) return '—';
  const rounded = Number(value.toFixed(decimals));
  return `${symbol}${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
