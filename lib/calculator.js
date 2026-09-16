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
  DEFAULT_SETTINGS,
  DEFAULT_PRICING,
  STORAGE_KEY,
  STORAGE_KEY_BATCH,
  STORAGE_KEY_CURATION,
  STORAGE_KEY_SUBSCRIPTION,
  STORAGE_KEY_QUOTES,
  makeId,
  createEmptyPainting,
  createDefaultBatch,
  DEFAULT_CURATION_CONTEXT,
  DEFAULT_OPERATING_COSTS,
  DEFAULT_SUBSCRIPTION,
  SUBSCRIPTION_PRESETS,
  STANDARD_DURATIONS,
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
 * - 'combined' (default): Single perimeter rate covers bars + internal support structure,
 *   reproducing the ₹1,200 benchmark for 3×4 ft without double-counting middle support beams.
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
 */
export function buildBreakdown(widthFt, heightFt, settings) {
  const { area, perimeter } = geometry(widthFt, heightFt);
  const rows = [];

  if (settings.canvasEnabled) {
    const rate = num(settings.canvasPrintRate);
    rows.push({
      id: 'canvas',
      name: 'Canvas Print',
      formula: `${fmtNum(area)} sq ft × ₹${fmtNum(rate, 3)}`,
      cost: area * rate,
    });
  }

  let stretch = null;
  if (settings.stretchEnabled) {
    stretch = stretchAndSupport(widthFt, heightFt, perimeter, settings);
    rows.push({
      id: 'stretch',
      name: settings.stretchMode === 'combined' ? 'Stretching + Support' : 'Stretching',
      formula: `${fmtNum(perimeter)} running ft × ₹${fmtNum(stretch.rate, 3)}`,
      cost: stretch.stretchCost,
    });
    if (settings.stretchMode === 'separate' && stretch.beamLength > 0) {
      rows.push({
        id: 'beam',
        name: 'Support Beam',
        formula: `${fmtNum(stretch.beamLength)} running ft × ₹${fmtNum(num(settings.beamRate), 3)}`,
        cost: stretch.beamCost,
      });
    }
  }

  if (settings.frameEnabled) {
    const rate = num(settings.frameRate);
    rows.push({
      id: 'frame',
      name: settings.frameType || 'External Frame',
      formula: `${fmtNum(perimeter)} running ft × ₹${fmtNum(rate, 3)}`,
      cost: perimeter * rate,
    });
  }

  (settings.extraComponents || []).forEach((c) => {
    if (!c.enabled) return;
    const q = num(c.quantity);
    const r = num(c.rate);
    rows.push({
      id: c.id,
      name: c.name || 'Custom Component',
      formula: `${fmtNum(q)} ${c.unit || 'unit'} × ₹${fmtNum(r, 3)}`,
      cost: q * r,
    });
  });

  const subtotal = rows.reduce((sum, r) => sum + r.cost, 0);
  // Transportation is strictly percentage of subtotal only (never final total)
  const transportCost = subtotal * (num(settings.transportPercent) / 100);
  const total = subtotal + transportCost;

  return { area, perimeter, rows, subtotal, transportCost, total, stretch };
}

/**
 * Centralized Single Painting Cost Calculator
 * Single source of truth across COST, BATCH, and CURATE.
 * 
 * @param {Object} painting { width, height, unit, ... }
 * @param {Object} settings cost settings
 * @returns {Object} Structured calculation result
 */
export function calculatePaintingCost(painting, settings) {
  if (!painting) {
    return createEmptyCostResult();
  }

  const rawW = parseFloat(painting.width);
  const rawH = parseFloat(painting.height);
  const unit = painting.unit === 'in' ? 'in' : 'ft';

  const isValid =
    painting.width !== '' &&
    painting.height !== '' &&
    Number.isFinite(rawW) &&
    Number.isFinite(rawH) &&
    rawW > 0 &&
    rawH > 0;

  if (!isValid) {
    return createEmptyCostResult({ width: painting.width, height: painting.height, unit });
  }

  const wFt = toFeet(rawW, unit);
  const hFt = toFeet(rawH, unit);
  const breakdown = buildBreakdown(wFt, hFt, settings);

  const canvasRow = breakdown.rows.find((r) => r.id === 'canvas');
  const stretchRow = breakdown.rows.find((r) => r.id === 'stretch');
  const beamRow = breakdown.rows.find((r) => r.id === 'beam');
  const frameRow = breakdown.rows.find((r) => r.id === 'frame');

  const additionalCosts = breakdown.rows
    .filter((r) => !['canvas', 'stretch', 'beam', 'frame'].includes(r.id))
    .reduce((sum, r) => sum + r.cost, 0);

  return {
    isValid: true,
    width: rawW,
    height: rawH,
    unit,
    wFt,
    hFt,
    areaSqFt: breakdown.area,
    perimeterRunningFt: breakdown.perimeter,
    canvasPrintCost: canvasRow ? canvasRow.cost : 0,
    stretchingCost: stretchRow ? stretchRow.cost : 0,
    supportCost: beamRow ? beamRow.cost : 0,
    frameCost: frameRow ? frameRow.cost : 0,
    transportationCost: breakdown.transportCost,
    additionalCosts,
    subtotal: breakdown.subtotal,
    totalProductionCost: breakdown.total,
    costPerSqFt: breakdown.area > 0 ? breakdown.total / breakdown.area : 0,
    rows: breakdown.rows,
  };
}

function createEmptyCostResult(overrides = {}) {
  return {
    isValid: false,
    width: '',
    height: '',
    unit: 'ft',
    wFt: 0,
    hFt: 0,
    areaSqFt: 0,
    perimeterRunningFt: 0,
    canvasPrintCost: 0,
    stretchingCost: 0,
    supportCost: 0,
    frameCost: 0,
    transportationCost: 0,
    additionalCosts: 0,
    subtotal: 0,
    totalProductionCost: 0,
    costPerSqFt: 0,
    rows: [],
    ...overrides,
  };
}

/**
 * Batch Cost Calculation Engine
 * Aggregates a list of paintings using calculatePaintingCost.
 * 
 * @param {Array} paintings Array of painting items
 * @param {Object} settings Cost settings
 * @returns {Object} Aggregated batch summary
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
 * Subscription & Recurring Recovery Calculation Engine
 * Pure mathematical analysis of collection subscription economics.
 * 
 * Safeguards against zero or negative monthly contribution.
 * Strictly avoids labeling contribution as "profit".
 * 
 * @param {Object} params
 *   - initialInvestment: Total production cost of curated artwork collection
 *   - monthlySubscription: Monthly fee charged to client
 *   - operatingCosts: Object with monthly operating breakdown
 *   - durations: Array of durations in months (default: [3, 6, 12, 24])
 * @returns {Object} Structured economics & scenario matrix
 */
export function calculateSubscriptionEconomics({
  initialInvestment = 0,
  monthlySubscription = 0,
  operatingCosts = {},
  durations = [3, 6, 12, 24],
}) {
  const investment = Math.max(0, num(initialInvestment));
  const rev = Math.max(0, num(monthlySubscription));

  // Sum all recurring monthly operating costs
  const monthlyOperatingCosts = Object.entries(operatingCosts || {}).reduce(
    (sum, [k, v]) => (k === 'otherLabel' ? sum : sum + Math.max(0, num(v))),
    0
  );

  const monthlyContribution = rev - monthlyOperatingCosts;

  // Simple recovery (Artwork investment only, ignoring recurring operating costs)
  const simpleRecoveryMonths =
    rev > 0 && investment > 0 ? investment / rev : null;

  // Recovery with monthly operating costs included
  const isRecoveryAchievable = monthlyContribution > 0 && investment >= 0;
  const estimatedRecoveryMonths =
    isRecoveryAchievable && investment > 0
      ? investment / monthlyContribution
      : null;

  let unachievableReason = null;
  if (!isRecoveryAchievable && investment > 0) {
    if (rev <= 0) {
      unachievableReason = 'Enter a monthly subscription price to calculate recovery.';
    } else if (monthlyContribution <= 0) {
      unachievableReason = 'Investment recovery: Not achievable at current subscription price and operating costs.';
    }
  }

  // Scenarios table
  const scenarios = (durations || [3, 6, 12, 24]).map((months) => {
    const totalRevenue = rev * months;
    const operatingCostsTotal = monthlyOperatingCosts * months;
    const totalContribution = monthlyContribution * months;
    const contributionAfterInvestment = totalContribution - investment;
    const isRecovered = investment === 0 || totalContribution >= investment;

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
  };
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
    const m = Math.min(num(pricing.marginPercent), 99); // Prevent division by zero / negative
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
