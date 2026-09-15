/**
 * ARTNCE Painting Cost Calculation Engine
 * Pure, UI-agnostic, formula-driven calculation module.
 * 
 * Precision: All internal operations maintain full floating-point precision.
 * Rounding is applied strictly at presentation/formatting time.
 */

export const DESIGN_TOKENS = {
  paper: '#EDEAE2',
  paperDark: '#E2DDD0',
  ink: '#221F1C',
  inkMuted: '#5B5445',
  rule: '#CBC3B0',
  rust: '#B8452D',
  danger: '#A3291B',
};

export const FONT_DISPLAY = "'Fraunces', Georgia, serif";
export const FONT_BODY = "'IBM Plex Sans', -apple-system, sans-serif";
export const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

export const DEFAULT_SETTINGS = {
  currencySymbol: '₹',
  decimals: 0,

  canvasEnabled: true,
  canvasPrintRate: 150,

  stretchEnabled: true,
  stretchMode: 'combined', // 'combined' | 'separate'
  combinedRate: 85.714,
  stretchOnlyRate: 85.714,
  beamRate: 85.714,
  beamFormula: 'shorter', // 'shorter' | 'longer' | 'width' | 'height' | 'none'
  beamThreshold: 3,

  frameEnabled: true,
  frameRate: 171.429,
  frameType: 'Black Floater Frame',

  transportPercent: 2,

  extraComponents: [],
};

export const DEFAULT_PRICING = {
  method: 'markup', // 'markup' | 'margin'
  markupPercent: 40,
  marginPercent: 30,
};

export const STORAGE_KEY = 'artnce_painting_cost_settings_v1';

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
 * Build complete itemized production cost breakdown.
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
  // Transportation is percentage of subtotal only (never final total)
  const transportCost = subtotal * (num(settings.transportPercent) / 100);
  const total = subtotal + transportCost;

  return { area, perimeter, rows, subtotal, transportCost, total, stretch };
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
