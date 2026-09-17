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
  spaceSqFt: '',
  artworkCount: '',
  curationComplexity: 'standard', // 'standard' | 'moderate' | 'complex'
  curatorProjectFee: '',
};

// Storage keys for company-wide assumptions and multi-plan economics
export const STORAGE_KEY_COMPANY_COSTS = 'artnce_company_costs_v1';
export const STORAGE_KEY_PLANS = 'artnce_plans_v1';
export const STORAGE_KEY_PORTFOLIO = 'artnce_portfolio_mix_v1';

/**
 * Default Employee Salaries
 * 3 employees combined = ₹3,00,000 / month TOTAL (₹1,00,000 each).
 * All rows and assumptions are editable.
 */
export const DEFAULT_EMPLOYEES = [
  { id: 'emp_1', name: 'Operations Lead', role: 'Operations & Logistics', monthlySalary: 100000 },
  { id: 'emp_2', name: 'Art Handler & Technician', role: 'Framing & Delivery', monthlySalary: 100000 },
  { id: 'emp_3', name: 'Client Engagement Manager', role: 'Client Relations & Sales', monthlySalary: 100000 },
];

/**
 * Default Bike / Travel Reimbursement
 * Employee-owned bike reimbursement rate: ₹3 per km.
 * Default assumption: 2,000 km/month = ₹6,000/month.
 */
export const DEFAULT_BIKE_REIMBURSEMENT = {
  ratePerKm: 3,
  monthlyKm: 2000,
};

/**
 * Default Company-Level Operating Assumptions
 */
export const DEFAULT_COMPANY_COSTS = {
  employees: DEFAULT_EMPLOYEES,
  bikeReimbursement: DEFAULT_BIKE_REIMBURSEMENT,
  otherRecurringExpenses: [],
};

/**
 * Backward compatibility: legacy single-plan monthly costs
 * Note: Curator has been intentionally removed from monthly operating costs per ARTNCE business rules.
 */
export const DEFAULT_OPERATING_COSTS = {
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

export const SUBSCRIPTION_PRESETS = [7500, 10000, 12500, 15000, 20000, 25000];

export const STANDARD_DURATIONS = [3, 6, 12, 24];

/**
 * The Four Subscription Plans:
 * 1. Essential (Compact / Boutique commercial spaces)
 * 2. Professional (Medium Office / Standard Corporate reception)
 * 3. Enterprise (Large Campus / Multi-floor HQ)
 * 4. Signature (Bespoke / Custom Site)
 *
 * ARCHITECTURAL PRINCIPLE:
 * A plan is a commercial/subscription pricing framework, NOT a fixed package of artworks.
 * Artwork count, specific paintings, space size (sq ft), and initial investment are
 * customized per client project.
 *
 * Example figures below represent editable default planning scenarios, NOT fixed business limits.
 */
export const DEFAULT_PLANS = {
  essential: {
    id: 'essential',
    name: 'Essential',
    tagline: 'Compact offices, clinics & boutique hospitality',
    exampleScenarioLabel: 'Example Planning Scenario: ~1,500 sq ft / ~3 artworks',
    spaceSqFt: 1500, // Fully editable project space
    artworkSource: 'curated', // 'curated' (select from artworks) | 'custom' (benchmark scenario)
    selectedPaintingIds: null, // null inherits active curated collection; or array of specific painting IDs
    customArtworkCount: 3,
    customTotalArea: 36,
    customInitialInvestment: 16500,
    monthlySubscription: 6500,
    employeeAllocationPercent: 5,
    employeeAllocationType: 'percent', // 'percent' | 'fixed'
    fixedEmployeeAllocation: 15000,
    maintenanceMonthly: 300,
    artistRecurringMonthly: 500,
    manpowerMonthly: 200,
    travelMonthlyAllocation: 200,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 1500,
      cycles: 1,
      complexity: 'standard',
      baseFee: 1200,
      artworkFee: 150,
      spaceComplexityFee: 150,
      justification: 'Base curation + site space evaluation',
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
    tagline: 'Medium offices, executive suites & corporate reception',
    exampleScenarioLabel: 'Example Planning Scenario: ~2,500 sq ft / ~5 artworks',
    spaceSqFt: 2500, // Fully editable project space
    artworkSource: 'curated',
    selectedPaintingIds: null,
    customArtworkCount: 5,
    customTotalArea: 60,
    customInitialInvestment: 30000,
    monthlySubscription: 10000,
    employeeAllocationPercent: 20, // 20% of ₹3,00,000 = ₹60,000
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 60000,
    maintenanceMonthly: 500,
    artistRecurringMonthly: 1000,
    manpowerMonthly: 500,
    travelMonthlyAllocation: 500,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 2000,
      cycles: 1,
      complexity: 'standard',
      baseFee: 1500,
      artworkFee: 300,
      spaceComplexityFee: 200,
      justification: 'Base curation (₹1,500) + artwork workload + space complexity',
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
    tagline: 'Corporate headquarters, tech campuses & luxury hospitality',
    exampleScenarioLabel: 'Example Planning Scenario: ~6,000 sq ft / ~12 artworks',
    spaceSqFt: 6000, // Fully editable project space
    artworkSource: 'curated',
    selectedPaintingIds: null,
    customArtworkCount: 12,
    customTotalArea: 144,
    customInitialInvestment: 75000,
    monthlySubscription: 25000,
    employeeAllocationPercent: 35, // 35% of ₹3,00,000 = ₹1,05,000
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 105000,
    maintenanceMonthly: 1500,
    artistRecurringMonthly: 2500,
    manpowerMonthly: 1500,
    travelMonthlyAllocation: 1000,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 3500,
      cycles: 2,
      complexity: 'moderate',
      baseFee: 2000,
      artworkFee: 1000,
      spaceComplexityFee: 500,
      justification: 'Base curation (₹2,000) + multi-zone campus artwork workload',
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
    exampleScenarioLabel: 'Bespoke Custom Plan: Fully defined by client specification',
    spaceSqFt: 3500, // Fully editable project space
    artworkSource: 'curated',
    selectedPaintingIds: null,
    customArtworkCount: 8,
    customTotalArea: 96,
    customInitialInvestment: 50000,
    monthlySubscription: 18000,
    employeeAllocationPercent: 25,
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 75000,
    maintenanceMonthly: 1000,
    artistRecurringMonthly: 2000,
    manpowerMonthly: 1000,
    travelMonthlyAllocation: 800,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: {
      feePerCycle: 3000,
      cycles: 2,
      complexity: 'complex',
      baseFee: 2000,
      artworkFee: 500,
      spaceComplexityFee: 500,
      justification: 'Custom bespoke curation tailored to high-profile architectural site',
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
    monthlySubscription: 15000,
    employeeAllocationPercent: 15,
    employeeAllocationType: 'percent',
    fixedEmployeeAllocation: 45000,
    maintenanceMonthly: 600,
    artistRecurringMonthly: 1500,
    manpowerMonthly: 500,
    travelMonthlyAllocation: 600,
    packagingMonthly: 0,
    companyOverheadMonthly: 0,
    otherMonthlyCosts: [],
    curator: { feePerCycle: 2000, cycles: 1, complexity: 'standard' },
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
