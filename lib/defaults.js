/**
 * ARTNCE Painting Production Cost & Subscription Planning Tool - Defaults & Design Tokens
 * 
 * Separated from pure calculation functions in lib/calculator.js
 * to preserve architectural purity and zero-slop separation of concerns.
 */

export const DESIGN_TOKENS = {
  paper: '#EDEAE2',
  paperDark: '#E2DDD0',
  ink: '#221F1C',
  inkMuted: '#5B5445',
  rule: '#CBC3B0',
  rust: '#B8452D',
  danger: '#A3291B',
  success: '#2B6E4F',
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
export const STORAGE_KEY_BATCH = 'artnce_batch_v1';
export const STORAGE_KEY_CURATION = 'artnce_curation_v1';
export const STORAGE_KEY_SUBSCRIPTION = 'artnce_subscription_v1';
export const STORAGE_KEY_QUOTES = 'artnce_saved_quotes_v1';

/**
 * Generate a unique ID with an optional prefix.
 */
export const makeId = (prefix = 'art') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Creates a clean starter painting row ready for user input.
 * Strictly avoids inventing artwork dimensions.
 */
export const createEmptyPainting = (index = 1) => ({
  id: makeId('p'),
  title: `Artwork ${String(index).padStart(2, '0')}`,
  artist: '',
  category: '',
  notes: '',
  width: '',
  height: '',
  unit: 'ft',
});

/**
 * Default starter batch with 5 editable rows ready for input.
 * Matches the immediate 5-painting ARTNCE use case without hard-coding dimensions.
 */
export const createDefaultBatch = () => [
  createEmptyPainting(1),
  createEmptyPainting(2),
  createEmptyPainting(3),
  createEmptyPainting(4),
  createEmptyPainting(5),
];

export const DEFAULT_CURATION_CONTEXT = {
  clientName: '',
  collectionName: '',
  location: '',
  notes: '',
  selectedPaintingIds: [],
};

export const DEFAULT_OPERATING_COSTS = {
  curator: 0,
  logistics: 0,
  artistRecurring: 0,
  maintenance: 0,
  operations: 0,
  other: 0,
  otherLabel: 'Other Monthly Cost',
};

export const DEFAULT_SUBSCRIPTION = {
  monthlySubscription: 10000,
  operatingCosts: DEFAULT_OPERATING_COSTS,
};

export const SUBSCRIPTION_PRESETS = [7500, 10000, 12500, 15000, 20000];

export const STANDARD_DURATIONS = [3, 6, 12, 24];
