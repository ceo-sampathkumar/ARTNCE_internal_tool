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

/**
 * Core Work Types:
 * - ARTNCE WORK: Artwork produced & managed directly by ARTNCE
 * - ARTIST WORK: Artwork produced & managed through an external artist
 */
export const DEFAULT_WORK_TYPE = 'artnce'; // 'artnce' | 'artist'

export const WORK_TYPES = [
  {
    id: 'artnce',
    label: 'ARTNCE WORK',
    tagline: 'Direct Production & Inventory',
    description: 'Artwork is being produced, framed, and managed directly by ARTNCE.',
  },
  {
    id: 'artist',
    label: 'ARTIST WORK',
    tagline: 'Artist Partnership & Curation',
    description: 'Artwork is being produced or curated through an external artist.',
  },
];

/**
 * Artist-specific commercial context (active when Work Type is 'artist' or mixed)
 * Artist Payment and Artist Rent are strictly separated.
 */
export const DEFAULT_ARTIST_CONTEXT = {
  artistName: '',
  artistPayment: 0, // Direct artist compensation / stipend
  artistRent: 0, // Artist rent (separate from payment)
  artistRentFrequency: 'monthly', // 'monthly' | 'per_project' | 'per_artwork' | 'custom'
  otherArtistCosts: 0, // Additional artist-related studio or supply costs
};

export const ARTIST_RENT_FREQUENCIES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'per_project', label: 'Per Project' },
  { id: 'per_artwork', label: 'Per Artwork' },
  { id: 'custom', label: 'Custom' },
];

/**
 * Artwork Source options for client collection or individual paintings
 */
export const ARTWORK_SOURCES = [
  { id: 'artnce', label: 'ARTNCE Artwork', desc: 'Tracked as ARTNCE investment / asset' },
  { id: 'artist', label: 'Artist Artwork', desc: 'Tracked with artist arrangement & stipend' },
  { id: 'mixed', label: 'Mixed Artwork Source', desc: 'Individual artworks tagged by origin' },
];

/**
 * Central Cost Settings for Artwork Production (Single/Batch)
 * Current configured rates: Stretching ₹90/running ft, Frame ₹200/running ft, Transport 2% of subtotal.
 */
export const DEFAULT_SETTINGS = {
  currencySymbol: '₹',
  decimals: 0,

  canvasEnabled: true,
  canvasPrintRate: 150,

  stretchEnabled: true,
  stretchMode: 'combined', // 'combined' | 'separate'
  combinedRate: 90, // Configured rate: ₹90/running ft
  stretchOnlyRate: 90,
  beamRate: 90,
  beamFormula: 'shorter', // 'shorter' | 'longer' | 'width' | 'height' | 'none'
  beamThreshold: 3,

  frameEnabled: true,
  frameRate: 200, // Configured rate: ₹200/running ft
  frameType: 'Black Floater Frame',

  transportPercent: 2, // 2% of subtotal, never applied to final total

  extraComponents: [],
};

export const DEFAULT_PRICING = {
  method: 'markup', // 'markup' | 'margin'
  markupPercent: 40,
  marginPercent: 30,
};

/**
 * Curator Central Pricing Configuration
 * Curation is paid per actual curation work/visit cycle — NOT a monthly charge.
 */
export const DEFAULT_CURATOR_PRICING = {
  method: 'plan', // 'plan' | 'space'
  notice: 'Curation price is for ONE curation work/visit cycle — NOT a monthly charge.',
  planBased: {
    essential: { maxSqFt: 2000, remotePrice: 1000, physicalPrice: 2000 },
    professional: { maxSqFt: 15000, remotePrice: 2000, physicalPrice: 3500 },
    enterprise: { maxSqFt: 25000, remotePrice: 3500, physicalPrice: 6000 },
    signature: { maxSqFt: null, remotePrice: 5000, physicalPrice: 8000 },
  },
  spaceBased: [
    { id: 'tier_1', label: 'Up to 2,000 sq ft', minSqFt: 0, maxSqFt: 2000, remotePrice: 1000, physicalPrice: 2000 },
    { id: 'tier_2', label: '2,001–15,000 sq ft', minSqFt: 2001, maxSqFt: 15000, remotePrice: 2000, physicalPrice: 3500 },
    { id: 'tier_3', label: '15,001–25,000 sq ft', minSqFt: 15001, maxSqFt: 25000, remotePrice: 3500, physicalPrice: 6000 },
    { id: 'tier_4', label: 'Above 25,000 sq ft', minSqFt: 25001, maxSqFt: Infinity, remotePrice: 5000, physicalPrice: 8000, isCustom: true },
  ],
};

/**
 * Artwork Investment Recovery & Markup Defaults
 * 60% markup default calculation: ₹17,967 × 60% = ₹10,780.20 → ₹28,747.20 target recovery value
 */
export const DEFAULT_RECOVERY_SETTINGS = {
  markupPercent: 60,
  benchmarkInvestment: 17967,
};

export const SUBSCRIPTION_TERMS = [1, 3, 6, 12, 24];
export const ROTATION_INTERVALS = [1, 2, 3, 6, 12];

/**
 * Expected Monthly Revenue Target for Company Performance View
 */
export const DEFAULT_EXPECTED_MONTHLY_REVENUE = 300000;

export const STORAGE_KEY = 'artnce_painting_cost_settings_v1';
export const STORAGE_KEY_BATCH = 'artnce_batch_v1';
export const STORAGE_KEY_CURATION = 'artnce_curation_v1';
export const STORAGE_KEY_SUBSCRIPTION = 'artnce_subscription_v1';
export const STORAGE_KEY_QUOTES = 'artnce_saved_quotes_v1';
export const STORAGE_KEY_COMPANY_COSTS = 'artnce_company_costs_v1';
export const STORAGE_KEY_PLANS = 'artnce_subscription_plans_v1';
export const STORAGE_KEY_PORTFOLIO = 'artnce_portfolio_mix_v1';
export const STORAGE_KEY_WORK_TYPE = 'artnce_work_type_v1';
export const STORAGE_KEY_ARTIST = 'artnce_artist_context_v1';
export const STORAGE_KEY_CURATOR_PRICING = 'artnce_curator_pricing_v1';
export const STORAGE_KEY_COMPANY_PERFORMANCE = 'artnce_company_performance_v1';

/**
 * Generate a unique ID with an optional prefix.
 */
export const makeId = (prefix = 'art') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Creates a clean starter painting row ready for user input.
 * Includes source tagging ('artnce' | 'artist').
 */
export const createEmptyPainting = (index = 1) => ({
  id: makeId('p'),
  title: `Artwork ${String(index).padStart(2, '0')}`,
  artist: '',
  source: 'artnce', // 'artnce' | 'artist'
  artistPayment: 0,
  artistRent: 0,
  category: '',
  notes: '',
  width: '',
  height: '',
  unit: 'ft',
});

/**
 * Default starter batch with 5 editable rows ready for input.
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
  spaceType: 'corporate', // 'corporate' | 'hospitality' | 'residential' | 'retail'
  collectionName: 'Proposed Client Collection',
  selectedPaintingIds: [],
};

export const DEFAULT_OPERATING_COSTS = {
  curatorProjectCost: 2000,
  curatorCycles: 1,
  maintenanceMonthly: 500,
  rotationProjectCost: 1500,
  rotationCycles: 1,
  installationProjectCost: 1500,
  logisticsProjectCost: 1200,
  packagingProjectCost: 600,
  travelProjectCost: 600,
  manpowerMonthly: 500,
  artistRecurringMonthly: 1000,
  otherDirectMonthly: 0,
};

export const DEFAULT_EMPLOYEES = [
  { id: 'emp_1', name: 'Operations Lead', role: 'Framing & Logistics', monthlySalary: 100000 },
  { id: 'emp_2', name: 'Technician', role: 'Stretching & Mounting', monthlySalary: 100000 },
  { id: 'emp_3', name: 'Art Handler', role: 'Delivery & Hanging', monthlySalary: 100000 },
];

export const DEFAULT_BIKE_REIMBURSEMENT = {
  ratePerKm: 3, // Editable rate: ₹3/km
  monthlyKm: 2000, // Monthly company usage
};

export const DEFAULT_COMPANY_COSTS = {
  employees: DEFAULT_EMPLOYEES,
  bikeReimbursement: DEFAULT_BIKE_REIMBURSEMENT,
  otherRecurringExpenses: [],
};

export const DEFAULT_SUBSCRIPTION = {
  monthlySubscription: 10000,
  operatingCosts: DEFAULT_OPERATING_COSTS,
};

export const SUBSCRIPTION_PRESETS = [7500, 10000, 12500, 15000, 20000, 25000];

export const STANDARD_DURATIONS = [3, 6, 12, 24];

/**
 * The Four Standard Subscription Plans + Custom
 *
 * ARCHITECTURAL PRINCIPLE:
 * A plan is a commercial/subscription pricing framework, NOT a fixed package of artworks.
 * Artwork count, specific paintings, space size (sq ft), and initial investment are
 * customized per client project.
 *
 * Current planning references:
 * - Essential: Up to approximately 2,000 sq ft
 * - Professional: Approximately 15,000 sq ft
 * - Enterprise: Approximately 20,000–25,000 sq ft
 * - Signature: Custom site
 */
export const DEFAULT_PLANS = {
  essential: {
    id: 'essential',
    name: 'Essential',
    tagline: 'Compact offices, boutique clinics & reception galleries',
    exampleScenarioLabel: 'Example Planning Scenario / Reference: up to ~2,000 sq ft / ~3 artworks',
    spaceSqFt: 2000, // Editable reference space: up to ~2,000 sq ft
    artworkSource: 'curated', // 'curated' | 'custom'
    selectedPaintingIds: null,
    customArtworkCount: 3,
    customTotalArea: 36,
    customInitialInvestment: 17967, // Planning benchmark investment
    markupPercent: 60, // 60% markup: ₹17,967 + ₹10,780.20 = ₹28,747.20 target
    monthlySubscription: 6500,
    subscriptionMonths: 12,
    rotationMonths: 3, // 3-month rotation
    curationMode: 'remote', // 'remote' | 'physical'
    curationFeePerEvent: 1000, // Essential remote confirmed reference: ₹1,000
    curationEvents: 4, // 1 initial + 3 rotations in a 12-mo term
    employeeAllocationPercent: 5,
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 15000,
    maintenanceMonthly: 300,
    artistRecurringMonthly: 500,
    artistRentMonthly: 0,
    manpowerMonthly: 300,
    travelMonthlyAllocation: 200,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 1000,
      cycles: 1,
      mode: 'remote',
      complexity: 'standard',
    },
    installation: { feePerCycle: 1000, cycles: 1 },
    rotation: { feePerCycle: 1000, cycles: 1 },
    logistics: { feePerCycle: 800, cycles: 1, basis: 'project' },
    packaging: { feePerCycle: 400, cycles: 1 },
    projectTravel: { feePerCycle: 400, cycles: 1 },
    otherProjectCosts: [],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    tagline: 'Medium offices, corporate suites & dynamic conference floors',
    exampleScenarioLabel: 'Example Planning Scenario / Reference: ~15,000 sq ft / ~5 artworks',
    spaceSqFt: 15000, // Editable reference space: ~15,000 sq ft
    artworkSource: 'curated',
    selectedPaintingIds: null,
    customArtworkCount: 5,
    customTotalArea: 60,
    customInitialInvestment: 30000,
    markupPercent: 60,
    monthlySubscription: 10000,
    subscriptionMonths: 12,
    rotationMonths: 3,
    curationMode: 'remote',
    curationFeePerEvent: 2000,
    curationEvents: 4,
    employeeAllocationPercent: 20, // 20% of ₹3,00,000 = ₹60,000
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 60000,
    maintenanceMonthly: 500,
    artistRecurringMonthly: 1000,
    artistRentMonthly: 0,
    manpowerMonthly: 500,
    travelMonthlyAllocation: 500,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 2000,
      cycles: 1,
      mode: 'remote',
      complexity: 'standard',
    },
    installation: { feePerCycle: 1500, cycles: 1 },
    rotation: { feePerCycle: 1500, cycles: 1 },
    logistics: { feePerCycle: 1200, cycles: 1, basis: 'project' },
    packaging: { feePerCycle: 600, cycles: 1 },
    projectTravel: { feePerCycle: 600, cycles: 1 },
    otherProjectCosts: [],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Multi-floor headquarters, tech campuses & luxury hospitality',
    exampleScenarioLabel: 'Example Planning Scenario / Reference: ~20,000–25,000 sq ft / ~12 artworks',
    spaceSqFt: 25000, // Editable reference space: ~20,000–25,000 sq ft
    artworkSource: 'curated',
    selectedPaintingIds: null,
    customArtworkCount: 12,
    customTotalArea: 144,
    customInitialInvestment: 75000,
    markupPercent: 60,
    monthlySubscription: 25000,
    subscriptionMonths: 12,
    rotationMonths: 3,
    curationMode: 'physical',
    curationFeePerEvent: 6000,
    curationEvents: 4,
    employeeAllocationPercent: 35, // 35% of ₹3,00,000 = ₹1,05,000
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 105000,
    maintenanceMonthly: 1500,
    artistRecurringMonthly: 2500,
    artistRentMonthly: 0,
    manpowerMonthly: 1500,
    travelMonthlyAllocation: 1000,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 6000,
      cycles: 2,
      mode: 'physical',
      complexity: 'moderate',
    },
    installation: { feePerCycle: 3500, cycles: 2 },
    rotation: { feePerCycle: 3000, cycles: 4 },
    logistics: { feePerCycle: 2500, cycles: 4, basis: 'project' },
    packaging: { feePerCycle: 1200, cycles: 4 },
    projectTravel: { feePerCycle: 1200, cycles: 4 },
    otherProjectCosts: [],
  },
  signature: {
    id: 'signature',
    name: 'Signature',
    tagline: 'Bespoke custom plan tailored specifically to client space',
    exampleScenarioLabel: 'Bespoke Custom Site: Fully defined by client specification',
    spaceSqFt: 3500,
    artworkSource: 'curated',
    selectedPaintingIds: null,
    customArtworkCount: 8,
    customTotalArea: 96,
    customInitialInvestment: 50000,
    markupPercent: 60,
    monthlySubscription: 18000,
    subscriptionMonths: 12,
    rotationMonths: 2,
    curationMode: 'physical',
    curationFeePerEvent: 8000,
    curationEvents: 6,
    employeeAllocationPercent: 25,
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 75000,
    maintenanceMonthly: 1000,
    artistRecurringMonthly: 2000,
    artistRentMonthly: 0,
    manpowerMonthly: 1000,
    travelMonthlyAllocation: 800,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 8000,
      cycles: 2,
      mode: 'physical',
      complexity: 'complex',
    },
    installation: { feePerCycle: 2500, cycles: 2 },
    rotation: { feePerCycle: 2500, cycles: 2 },
    logistics: { feePerCycle: 1800, cycles: 2, basis: 'project' },
    packaging: { feePerCycle: 1000, cycles: 2 },
    projectTravel: { feePerCycle: 1000, cycles: 2 },
    otherProjectCosts: [],
  },
};

/**
 * Factory for creating an independent custom subscription plan template
 */
export function createDefaultCustomPlan(
  id = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
  name = 'Custom Plan'
) {
  return {
    id,
    name,
    tagline: 'Fully custom client proposal',
    exampleScenarioLabel: 'Custom Plan Specification',
    isCustom: true,
    spaceSqFt: 3000,
    artworkSource: 'curated',
    selectedPaintingIds: null,
    customArtworkCount: 6,
    customTotalArea: 72,
    customInitialInvestment: 35000,
    markupPercent: 60,
    monthlySubscription: 15000,
    subscriptionMonths: 12,
    rotationMonths: 3,
    curationMode: 'remote',
    curationFeePerEvent: 2000,
    curationEvents: 4,
    employeeAllocationPercent: 15,
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 45000,
    maintenanceMonthly: 600,
    artistRecurringMonthly: 1500,
    artistRentMonthly: 0,
    manpowerMonthly: 500,
    travelMonthlyAllocation: 600,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: { feePerCycle: 2000, cycles: 1, mode: 'remote', complexity: 'standard' },
    installation: { feePerCycle: 2000, cycles: 1 },
    rotation: { feePerCycle: 1500, cycles: 1 },
    logistics: { feePerCycle: 1500, cycles: 1, basis: 'project' },
    packaging: { feePerCycle: 700, cycles: 1 },
    projectTravel: { feePerCycle: 600, cycles: 1 },
    otherProjectCosts: [],
  };
}

/**
 * Default portfolio client distribution for company sustainability modeling
 */
export const DEFAULT_PORTFOLIO_MIX = {
  essential: 20,
  professional: 10,
  enterprise: 5,
  signature: 2,
};
