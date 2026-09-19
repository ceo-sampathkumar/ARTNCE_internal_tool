import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  Zap,
  BarChart3,
  Layers,
  Clock,
  Target,
  ChevronRight,
  Info,
  SlidersHorizontal,
  ShieldCheck,
  Check,
  Percent,
} from 'lucide-react';

import {
  fmtNum,
  fmtCurrency,
  calculateCompanyTargetPerformance,
} from '@/lib/calculator';

import {
  DEFAULT_SIMPLE_PLANS,
  DEFAULT_COMPANY_MONTHLY_EXPENSES,
} from '@/lib/defaults';

import {
  STARTUP_GROWTH_STORAGE_KEY,
  DEFAULT_GROWTH_SCENARIOS,
  DEFAULT_STARTUP_ASSUMPTIONS,
  getCleanPlanEconomics,
  formatCalendarDate,
  calculateSinglePlanProjection,
  calculateFourPlanComparison,
  calculateFinancialJourneyMilestones,
  calculatePlanRequirements,
  calculateCustomMixBreakEven,
} from '@/lib/startup-growth';

/* ---------------------------------------------------------------------------
 * Style Palette (Matches ARTNCE Minimal Executive Editorial Standard)
 * -------------------------------------------------------------------------*/
const C = {
  ink: '#1c1917',
  inkLight: '#44403c',
  inkMuted: '#78716c',
  paper: '#fafaf9',
  paperDark: '#f5f5f4',
  paperDeeper: '#e7e5e4',
  rule: '#e7e5e4',
  ruleDark: '#d6d3d1',
  rust: '#b45309',
  forest: '#15803d',
  emerald: '#059669',
  cardBg: '#ffffff',
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const PLAN_KEYS = ['essential', 'professional', 'enterprise', 'signature'];

export default function StartupGrowthView({
  settings = {},
  plans: propPlans,
  companyExpenses: propCompanyExpenses,
  activeClients = [],
  onNavigateToSubscription,
  onNavigateToPerformance,
}) {
  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  const plans = propPlans || DEFAULT_SIMPLE_PLANS;
  const companyExpenses = propCompanyExpenses || DEFAULT_COMPANY_MONTHLY_EXPENSES;

  // Live company baseline performance from current state
  const currentPerformance = useMemo(() => {
    return calculateCompanyTargetPerformance({
      companyExpenses,
      activeClients,
      selectedPlanContribution: 10608,
    });
  }, [companyExpenses, activeClients]);

  /* ---------------------------------------------------------------------------
   * Persistent Assumptions State
   * -------------------------------------------------------------------------*/
  const [assumptions, setAssumptions] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STARTUP_GROWTH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_STARTUP_ASSUMPTIONS,
            ...parsed,
            startingActiveClients: activeClients.length > 0 ? activeClients.length : (parsed.startingActiveClients || 5),
          };
        }
      } catch (e) {
        console.warn('Failed to load startup growth assumptions:', e);
      }
    }
    return {
      ...DEFAULT_STARTUP_ASSUMPTIONS,
      startingActiveClients: activeClients.length > 0 ? activeClients.length : 5,
    };
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STARTUP_GROWTH_STORAGE_KEY, JSON.stringify(assumptions));
      } catch (e) {
        console.warn('Failed to save startup growth assumptions:', e);
      }
    }
  }, [assumptions]);

  const updateAssumption = (field, value) => {
    setAssumptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetDefaults = () => {
    setAssumptions({
      ...DEFAULT_STARTUP_ASSUMPTIONS,
      startingActiveClients: activeClients.length > 0 ? activeClients.length : 5,
    });
  };

  /* ---------------------------------------------------------------------------
   * Core Single-Plan Financial Projection Engine
   * -------------------------------------------------------------------------*/
  const singlePlanProj = useMemo(() => {
    return calculateSinglePlanProjection({
      selectedPlanId: assumptions.selectedPlanId || 'essential',
      purePlanComparison: !!assumptions.purePlanComparison,
      startingActiveClients: assumptions.startingActiveClients,
      startingNewClientsMonth1: assumptions.startingNewClientsMonth1,
      monthlyIncreaseRate: assumptions.monthlyIncreaseRate,
      accelerationFrequencyMonths: assumptions.accelerationFrequencyMonths,
      monthlyChurnPercent: assumptions.monthlyChurnPercent,
      projectionMonths: assumptions.projectionMonths,
      initialInvestment: assumptions.initialInvestment,
      plans,
      companyExpenses,
      activeClients,
      startDate: assumptions.startDate || '2026-10-01',
    });
  }, [assumptions, plans, companyExpenses, activeClients]);

  // Four-Plan Comparative Financial Projection
  const fourPlanComparison = useMemo(() => {
    return calculateFourPlanComparison({
      purePlanComparison: !!assumptions.purePlanComparison,
      startingActiveClients: assumptions.startingActiveClients,
      startingNewClientsMonth1: assumptions.startingNewClientsMonth1,
      monthlyIncreaseRate: assumptions.monthlyIncreaseRate,
      accelerationFrequencyMonths: assumptions.accelerationFrequencyMonths,
      monthlyChurnPercent: assumptions.monthlyChurnPercent,
      projectionMonths: assumptions.projectionMonths,
      initialInvestment: assumptions.initialInvestment,
      plans,
      companyExpenses,
      activeClients,
      startDate: assumptions.startDate || '2026-10-01',
    });
  }, [assumptions, plans, companyExpenses, activeClients]);

  // Financial Journey Milestones
  const financialJourneyMilestones = useMemo(() => {
    return calculateFinancialJourneyMilestones(singlePlanProj);
  }, [singlePlanProj]);

  // Chart view tab
  const [activeChartTab, setActiveChartTab] = useState('parity'); // 'parity' | 'cumulative' | 'clients'

  // Table pagination or limit
  const [tableLimit, setTableLimit] = useState(12);

  const heroPlanEcon = singlePlanProj.selectedPlanEconomics;
  const isInvZero = singlePlanProj.initialInvestment <= 0;

  return (
    <div className="space-y-8 pb-16" style={{ color: C.ink }}>
      {/* ---------------------------------------------------------------------
       * HEADER: TERMINAL TITLE & NAVIGATION
       * -------------------------------------------------------------------*/}
      <div className="border-b pb-6" style={{ borderColor: C.rule }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded tracking-wider uppercase bg-stone-900 text-white">
                06 STARTUP GROWTH
              </span>
              <span className="text-xs font-medium text-stone-500">
                Deterministic Single-Plan Financial Terminal
              </span>
            </div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
              STARTUP GROWTH &amp; FINANCIAL TARGET
            </h1>
            <p className="text-xs sm:text-sm mt-1 max-w-3xl" style={{ color: C.inkMuted }}>
              Model ARTNCE&apos;s exact financial trajectory assuming all new subscriber growth is concentrated into ONE selected plan.
              Deterministic break-even, operating loss recovery, and capital payback calculations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 bg-white hover:bg-stone-50 transition-colors shadow-sm"
              style={{ borderColor: C.rule }}
              title="Reset all assumptions to default configuration"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
            {onNavigateToPerformance && (
              <button
                type="button"
                onClick={onNavigateToPerformance}
                className="px-3 py-1.5 rounded text-xs font-medium border text-stone-700 bg-white hover:bg-stone-50 transition-colors shadow-sm flex items-center gap-1.5"
                style={{ borderColor: C.rule }}
              >
                <span>05 PERFORMANCE</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------------------
         * PROMINENT HERO SELECTOR: PROJECTION MODE (SELECT ONE PLAN)
         * -----------------------------------------------------------------*/}
        <div className="mt-6 p-4 rounded bg-stone-100 border flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: C.rule }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Target size={15} className="text-stone-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                PROJECTION MODE — SELECT ONE PLAN:
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {PLAN_KEYS.map((pid) => {
                const isSelected = (assumptions.selectedPlanId || 'essential') === pid;
                const pTpl = plans[pid] || DEFAULT_SIMPLE_PLANS[pid];
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => updateAssumption('selectedPlanId', pid)}
                    className="px-4 py-2 rounded text-xs font-bold border transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: isSelected ? C.ink : '#ffffff',
                      color: isSelected ? '#ffffff' : C.ink,
                      borderColor: isSelected ? C.ink : C.rule,
                      boxShadow: isSelected ? '0 2px 5px rgba(0,0,0,0.15)' : 'none',
                    }}
                  >
                    <span>{pTpl?.name || pid}</span>
                    <span
                      className="font-mono text-[11px] font-normal opacity-80"
                      style={{ color: isSelected ? '#f5f5f4' : C.inkMuted }}
                    >
                      {money(pTpl?.monthlySubscription || 12500)}/mo
                    </span>
                    {isSelected && <Check size={13} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode Toggle: Current Business vs Pure Plan */}
          <div className="pt-3 md:pt-0 md:border-l md:pl-4 border-stone-200 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-700">Modeling Scope:</span>
              <div className="flex rounded border overflow-hidden bg-white" style={{ borderColor: C.rule }}>
                <button
                  type="button"
                  onClick={() => updateAssumption('purePlanComparison', false)}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: !assumptions.purePlanComparison ? C.ink : '#ffffff',
                    color: !assumptions.purePlanComparison ? '#ffffff' : C.ink,
                  }}
                >
                  Current Business
                </button>
                <button
                  type="button"
                  onClick={() => updateAssumption('purePlanComparison', true)}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: assumptions.purePlanComparison ? C.ink : '#ffffff',
                    color: assumptions.purePlanComparison ? '#ffffff' : C.ink,
                  }}
                >
                  Pure Plan Projection
                </button>
              </div>
            </div>
            <span className="text-[11px] text-stone-500 mt-1 block max-w-xs">
              {assumptions.purePlanComparison
                ? 'Pure Plan: Assumes all active clients use the selected plan for a clean benchmark.'
                : 'Current Business: Existing 5 clients retain their actual plans. All new clients are 100% on the selected plan.'}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
       * SECTION 1: HERO PLAN ECONOMICS & CURRENT POSITION
       * -------------------------------------------------------------------*/}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hero Plan Economics Card (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded border bg-white shadow-sm flex flex-col justify-between" style={{ borderColor: C.rule }}>
          <div>
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.rule }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                SELECTED SUBSCRIBER PLAN
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold uppercase">
                100% New Additions
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-900 mt-2">
              {heroPlanEcon.name} Plan Economics
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Exact unit economics from the centralized Subscription calculation engine.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono mt-4">
            <div className="p-3 rounded bg-stone-50 border" style={{ borderColor: C.rule }}>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">PLAN PRICE</span>
              <strong className="text-lg font-bold text-stone-900 block mt-0.5">
                {money(heroPlanEcon.monthlyFee)}
              </strong>
              <span className="text-[10px] text-stone-500 block">Per client / month</span>
            </div>

            <div className="p-3 rounded bg-stone-50 border" style={{ borderColor: C.rule }}>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">DIRECT COST</span>
              <strong className="text-lg font-bold text-stone-800 block mt-0.5">
                {money(heroPlanEcon.directCost)}
              </strong>
              <span className="text-[10px] text-stone-500 block">Delivery &amp; service</span>
            </div>

            <div className="p-3 rounded bg-emerald-50 border" style={{ borderColor: '#bbf7d0' }}>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">CONTRIBUTION</span>
              <strong className="text-lg font-bold text-emerald-700 block mt-0.5">
                {money(heroPlanEcon.monthlyContribution)}
              </strong>
              <span className="text-[10px] text-emerald-600 block">Price minus direct cost</span>
            </div>

            <div className="p-3 rounded bg-emerald-50 border" style={{ borderColor: '#bbf7d0' }}>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">CONTRIB. MARGIN</span>
              <strong className="text-lg font-bold text-emerald-700 block mt-0.5">
                {fmtNum(heroPlanEcon.contributionMargin, 2)}%
              </strong>
              <span className="text-[10px] text-emerald-600 block">Margin on monthly price</span>
            </div>
          </div>
        </div>

        {/* Current Financial Baseline & Requirement Card (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded border bg-white shadow-sm flex flex-col justify-between" style={{ borderColor: C.rule }}>
          <div>
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.rule }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                CURRENT BUSINESS SITUATION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                Live From Stage 04 &amp; 05
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-stone-900 mt-2">
              Operational Baseline &amp; Overhead Gap
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Live operational contribution from current subscribers versus total company monthly requirement.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono mt-4">
            <div className="p-3 rounded bg-stone-50 border" style={{ borderColor: C.rule }}>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">ACTIVE CLIENTS</span>
              <strong className="text-base font-bold text-stone-900 block mt-0.5">
                {singlePlanProj.currentPosition.totalActiveClients}
              </strong>
              <span className="text-[10px] text-stone-500 block">Current subscriber base</span>
            </div>

            <div className="p-3 rounded bg-stone-50 border" style={{ borderColor: C.rule }}>
              <span className="text-[10px] uppercase font-bold text-stone-500 block">MONTHLY REVENUE</span>
              <strong className="text-base font-bold text-stone-900 block mt-0.5">
                {money(singlePlanProj.currentPosition.monthlyRevenue)}
              </strong>
              <span className="text-[10px] text-stone-500 block">Total monthly billing</span>
            </div>

            <div className="p-3 rounded bg-emerald-50 border" style={{ borderColor: '#bbf7d0' }}>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">CONTRIBUTION</span>
              <strong className="text-base font-bold text-emerald-700 block mt-0.5">
                {money(singlePlanProj.currentPosition.monthlyContribution)}
              </strong>
              <span className="text-[10px] text-emerald-600 block">Current net contribution</span>
            </div>

            <div className="p-3 rounded bg-red-50 border" style={{ borderColor: '#fecaca' }}>
              <span className="text-[10px] uppercase font-bold text-red-800 block">OPERATING GAP</span>
              <strong className="text-base font-bold text-red-700 block mt-0.5">
                {money(singlePlanProj.currentPosition.operatingGap)}
              </strong>
              <span className="text-[10px] text-red-600 block">Shortfall to breakeven</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
       * SECTION 2: FD / SIP STYLE PROJECTION CALCULATOR (INPUTS & OUTCOMES)
       * -------------------------------------------------------------------*/}
      <div className="p-6 rounded border bg-white shadow-sm" style={{ borderColor: C.rule }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b" style={{ borderColor: C.rule }}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              DETERMINISTIC FINANCIAL ENGINE
            </span>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.4rem', fontWeight: 600 }}>
              {heroPlanEcon.name} Plan Financial Projection Calculator
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your capital, acquisition, and churn parameters. The engine calculates the exact month when ARTNCE breaks even and repays its initial investment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-700">Horizon:</span>
            <div className="flex rounded border overflow-hidden bg-white" style={{ borderColor: C.rule }}>
              {[12, 24, 36, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => updateAssumption('projectionMonths', m)}
                  className="px-2.5 py-1 text-xs font-mono font-bold transition-colors"
                  style={{
                    backgroundColor: assumptions.projectionMonths === m ? C.ink : '#ffffff',
                    color: assumptions.projectionMonths === m ? '#ffffff' : C.ink,
                  }}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Assumptions (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5 p-4 rounded bg-stone-50 border" style={{ borderColor: C.rule }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Projection Assumptions
            </h3>

            {/* Initial Investment */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-stone-800">
                  Initial Investment (Invested Capital)
                </label>
                <span className="text-[11px] font-mono text-stone-500">
                  {money(assumptions.initialInvestment)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-stone-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={assumptions.initialInvestment}
                  onChange={(e) => updateAssumption('initialInvestment', Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-mono border rounded outline-none bg-white focus:ring-1 focus:ring-stone-800"
                  style={{ borderColor: C.rule }}
                />
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                Upfront capital to recover for ROI payback (changing this does not affect monthly operating profit)
              </span>
              {companyExpenses.technologyIsOneTime && Number(companyExpenses.technologySoftware) > 0 && (
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  <span>Stage 05 Tech CapEx: {money(companyExpenses.technologySoftware)}</span>
                  {assumptions.initialInvestment !== Number(companyExpenses.technologySoftware) && (
                    <button
                      type="button"
                      onClick={() => updateAssumption('initialInvestment', Number(companyExpenses.technologySoftware))}
                      className="underline font-bold text-blue-900 hover:text-blue-700"
                    >
                      Sync CapEx
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Starting Active Clients */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-800">
                  Starting Clients
                </label>
                <input
                  type="number"
                  min="0"
                  value={assumptions.startingActiveClients}
                  onChange={(e) => updateAssumption('startingActiveClients', Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border rounded outline-none bg-white"
                  style={{ borderColor: C.rule }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-stone-800">
                  New Clients (M1)
                </label>
                <input
                  type="number"
                  min="0"
                  value={assumptions.startingNewClientsMonth1}
                  onChange={(e) => updateAssumption('startingNewClientsMonth1', Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono border rounded outline-none bg-white"
                  style={{ borderColor: C.rule }}
                />
              </div>
            </div>

            {/* Growth Acceleration */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-800">
                Growth Acceleration Cadence
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  value={assumptions.monthlyIncreaseRate}
                  onChange={(e) => updateAssumption('monthlyIncreaseRate', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border rounded outline-none bg-white"
                  style={{ borderColor: C.rule }}
                  title="Additional new clients added per step"
                />
                <select
                  value={assumptions.accelerationFrequencyMonths}
                  onChange={(e) => updateAssumption('accelerationFrequencyMonths', Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs border rounded outline-none bg-white"
                  style={{ borderColor: C.rule }}
                >
                  <option value={1}>Every 1 Month</option>
                  <option value={2}>Every 2 Months</option>
                  <option value={3}>Every 3 Months</option>
                  <option value={6}>Every 6 Months</option>
                </select>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                +{assumptions.monthlyIncreaseRate} additional client added every {assumptions.accelerationFrequencyMonths} months
              </span>
            </div>

            {/* Monthly Churn % */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-stone-800">
                  Monthly Churn Rate
                </label>
                <span className="text-[11px] font-mono text-stone-500">
                  {assumptions.monthlyChurnPercent}% / mo
                </span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={assumptions.monthlyChurnPercent}
                onChange={(e) => updateAssumption('monthlyChurnPercent', Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono border rounded outline-none bg-white"
                style={{ borderColor: C.rule }}
              />
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                Percentage of subscriber accounts leaving every month
              </span>
            </div>
          </div>

          {/* Right: Projected Outcomes (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                CALCULATED FINANCIAL MILESTONES &amp; OUTCOMES
              </span>
              <h3 className="text-lg font-bold font-serif text-stone-900">
                {heroPlanEcon.name} Projection Summary ({assumptions.projectionMonths} Months)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
              {/* Milestone 1: Monthly Operational Break-Even */}
              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: singlePlanProj.monthlyBreakEven ? '#f0fdf4' : '#fff',
                  borderColor: singlePlanProj.monthlyBreakEven ? '#86efac' : C.rule,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    MONTHLY OPERATIONAL BREAK-EVEN
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold">
                    Contribution &gt;= Expenses
                  </span>
                </div>
                <div className="text-xl font-bold mt-1 text-stone-900">
                  {singlePlanProj.monthlyBreakEven
                    ? `Month ${singlePlanProj.monthlyBreakEvenMonthIndex}`
                    : `NOT REACHED WITHIN ${assumptions.projectionMonths} MONTHS`}
                </div>
                <span className="text-xs font-semibold text-emerald-800 block">
                  {singlePlanProj.monthlyBreakEven ? singlePlanProj.monthlyBreakEven.calendarDate : '—'}
                </span>

                {singlePlanProj.monthlyBreakEven && (
                  <div className="mt-2 pt-2 border-t text-[11px] space-y-0.5 text-stone-700" style={{ borderColor: '#bbf7d0' }}>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Clients at Break-Even:</span>
                      <strong>{singlePlanProj.monthlyBreakEven.closingClients}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Monthly Revenue:</span>
                      <strong>{money(singlePlanProj.monthlyBreakEven.monthlyRevenue)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Monthly Contribution:</span>
                      <strong className="text-emerald-700">{money(singlePlanProj.monthlyBreakEven.monthlyContribution)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Monthly Profit:</span>
                      <strong className="text-emerald-700">{money(singlePlanProj.monthlyBreakEven.operatingProfit)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone 2: Operating Loss Recovery */}
              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: singlePlanProj.operatingLossRecovery ? '#f0fdf4' : '#fff',
                  borderColor: singlePlanProj.operatingLossRecovery ? '#86efac' : C.rule,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    OPERATING LOSS RECOVERY
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold">
                    Cumulative Profit &gt;= 0
                  </span>
                </div>
                <div className="text-xl font-bold mt-1 text-stone-900">
                  {singlePlanProj.operatingLossRecovery
                    ? `Month ${singlePlanProj.operatingLossRecoveryMonthIndex}`
                    : `NOT REACHED WITHIN ${assumptions.projectionMonths} MONTHS`}
                </div>
                <span className="text-xs font-semibold text-emerald-800 block">
                  {singlePlanProj.operatingLossRecovery ? singlePlanProj.operatingLossRecovery.calendarDate : '—'}
                </span>

                <div className="mt-2 pt-2 border-t text-[11px] space-y-0.5 text-stone-700" style={{ borderColor: C.rule }}>
                  <span className="text-[10px] text-stone-500 block leading-tight">
                    Month when all accumulated early-stage operational losses are completely wiped out by positive subscriber profits.
                  </span>
                </div>
              </div>

              {/* Milestone 3: Investment Recovery / Payback */}
              <div
                className="p-4 rounded border"
                style={{
                  backgroundColor: singlePlanProj.investmentRecovery ? '#eff6ff' : '#fff',
                  borderColor: singlePlanProj.investmentRecovery ? '#93c5fd' : C.rule,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    INVESTMENT RECOVERY / PAYBACK
                  </span>
                  <span className="text-[10px] text-blue-800 font-semibold">
                    100% Capital Repaid
                  </span>
                </div>
                <div className="text-xl font-bold mt-1 text-stone-900">
                  {isInvZero
                    ? 'N/A'
                    : singlePlanProj.investmentRecovery
                    ? `Month ${singlePlanProj.investmentRecoveryMonthIndex}`
                    : `NOT REACHED WITHIN ${assumptions.projectionMonths} MONTHS`}
                </div>
                <span className="text-xs font-semibold text-blue-800 block">
                  {isInvZero ? 'No initial capital' : singlePlanProj.investmentRecovery ? singlePlanProj.investmentRecovery.calendarDate : '—'}
                </span>

                <div className="mt-2 pt-2 border-t text-[11px] space-y-0.5 text-stone-700" style={{ borderColor: '#bfdbfe' }}>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Initial Capital:</span>
                    <strong>{isInvZero ? 'N/A' : money(singlePlanProj.initialInvestment)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Capital Recovered:</span>
                    <strong className="text-blue-700">
                      {isInvZero ? 'N/A' : money(singlePlanProj.finalMonth?.capitalRecovered || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Capital Remaining:</span>
                    <strong className="text-stone-800">
                      {isInvZero ? 'N/A' : money(singlePlanProj.finalMonth?.capitalRemaining || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Cumulative Operating Profit & ROI % */}
              <div className="p-4 rounded border bg-stone-50" style={{ borderColor: C.rule }}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                  {assumptions.projectionMonths}-MONTH CUMULATIVE OUTCOME
                </span>
                <div
                  className="text-xl font-bold mt-1"
                  style={{
                    color: (singlePlanProj.finalMonth?.cumulativeOperatingProfit || 0) >= 0 ? '#15803D' : '#dc2626',
                  }}
                >
                  {money(singlePlanProj.finalMonth?.cumulativeOperatingProfit || 0)}
                </div>
                <span className="text-xs font-semibold text-stone-700 block">
                  Cumulative Operating Profit
                </span>

                <div className="mt-2 pt-2 border-t text-[11px] space-y-0.5 text-stone-700" style={{ borderColor: C.rule }}>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Cumulative ROI:</span>
                    <strong
                      className="font-bold"
                      style={{
                        color: isInvZero
                          ? '#78716c'
                          : (singlePlanProj.finalMonth?.roiPercent || 0) >= 0 ? '#15803D' : '#dc2626',
                      }}
                    >
                      {isInvZero ? 'N/A' : `${fmtNum(singlePlanProj.finalMonth?.roiPercent || 0, 1)}%`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Closing Clients:</span>
                    <strong>{singlePlanProj.finalMonth?.closingClients || 0} clients</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Monthly Run-Rate:</span>
                    <strong className="text-emerald-700">{money(singlePlanProj.finalMonth?.monthlyContribution || 0)}/mo</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
       * SECTION 3: 12M / 24M / 36M / 60M YEAR-END SNAPSHOTS (Section 28)
       * -------------------------------------------------------------------*/}
      <div className="p-5 rounded border bg-white shadow-sm" style={{ borderColor: C.rule }}>
        <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: C.rule }}>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600 }}>
              Multi-Year Snapshot ({heroPlanEcon.name} Plan Trajectory)
            </h3>
            <p className="text-xs text-stone-500">
              Immediate summary of client volume, financial scale, and net profitability across key annual horizons.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-800">
            {heroPlanEcon.name} • {money(heroPlanEcon.monthlyFee)}/mo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b bg-stone-50 text-[10px] uppercase text-stone-600" style={{ borderColor: C.rule }}>
                <th className="py-2 px-3 font-semibold">Horizon Metric</th>
                <th className="py-2 px-3 font-semibold text-right">12 Months (1 Year)</th>
                <th className="py-2 px-3 font-semibold text-right">24 Months (2 Years)</th>
                <th className="py-2 px-3 font-semibold text-right">36 Months (3 Years)</th>
                <th className="py-2 px-3 font-semibold text-right">60 Months (5 Years)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs" style={{ borderColor: C.rule }}>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-900 font-sans">Active Clients</td>
                <td className="py-2.5 px-3 text-right font-bold">{singlePlanProj.snapshots.m12?.clients ?? '—'}</td>
                <td className="py-2.5 px-3 text-right font-bold">{singlePlanProj.snapshots.m24?.clients ?? '—'}</td>
                <td className="py-2.5 px-3 text-right font-bold">{singlePlanProj.snapshots.m36?.clients ?? '—'}</td>
                <td className="py-2.5 px-3 text-right font-bold">{singlePlanProj.snapshots.m60?.clients ?? '—'}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-900 font-sans">Monthly Revenue</td>
                <td className="py-2.5 px-3 text-right">{singlePlanProj.snapshots.m12 ? money(singlePlanProj.snapshots.m12.revenue) : '—'}</td>
                <td className="py-2.5 px-3 text-right">{singlePlanProj.snapshots.m24 ? money(singlePlanProj.snapshots.m24.revenue) : '—'}</td>
                <td className="py-2.5 px-3 text-right">{singlePlanProj.snapshots.m36 ? money(singlePlanProj.snapshots.m36.revenue) : '—'}</td>
                <td className="py-2.5 px-3 text-right">{singlePlanProj.snapshots.m60 ? money(singlePlanProj.snapshots.m60.revenue) : '—'}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-900 font-sans">Monthly Contribution</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{singlePlanProj.snapshots.m12 ? money(singlePlanProj.snapshots.m12.contribution) : '—'}</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{singlePlanProj.snapshots.m24 ? money(singlePlanProj.snapshots.m24.contribution) : '—'}</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{singlePlanProj.snapshots.m36 ? money(singlePlanProj.snapshots.m36.contribution) : '—'}</td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{singlePlanProj.snapshots.m60 ? money(singlePlanProj.snapshots.m60.contribution) : '—'}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-900 font-sans">Monthly Operating Profit</td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m12?.operatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m12 ? money(singlePlanProj.snapshots.m12.operatingProfit) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m24?.operatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m24 ? money(singlePlanProj.snapshots.m24.operatingProfit) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m36?.operatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m36 ? money(singlePlanProj.snapshots.m36.operatingProfit) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m60?.operatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m60 ? money(singlePlanProj.snapshots.m60.operatingProfit) : '—'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-900 font-sans">Cumulative Operating Profit</td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m12?.cumulativeOperatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m12 ? money(singlePlanProj.snapshots.m12.cumulativeOperatingProfit) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m24?.cumulativeOperatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m24 ? money(singlePlanProj.snapshots.m24.cumulativeOperatingProfit) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m36?.cumulativeOperatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m36 ? money(singlePlanProj.snapshots.m36.cumulativeOperatingProfit) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold" style={{ color: (singlePlanProj.snapshots.m60?.cumulativeOperatingProfit || 0) >= 0 ? '#15803D' : '#dc2626' }}>
                  {singlePlanProj.snapshots.m60 ? money(singlePlanProj.snapshots.m60.cumulativeOperatingProfit) : '—'}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-stone-900 font-sans">Cumulative ROI %</td>
                <td className="py-2.5 px-3 text-right font-bold">
                  {isInvZero ? 'N/A' : singlePlanProj.snapshots.m12 ? `${fmtNum(singlePlanProj.snapshots.m12.roiPercent, 1)}%` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold">
                  {isInvZero ? 'N/A' : singlePlanProj.snapshots.m24 ? `${fmtNum(singlePlanProj.snapshots.m24.roiPercent, 1)}%` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold">
                  {isInvZero ? 'N/A' : singlePlanProj.snapshots.m36 ? `${fmtNum(singlePlanProj.snapshots.m36.roiPercent, 1)}%` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold">
                  {isInvZero ? 'N/A' : singlePlanProj.snapshots.m60 ? `${fmtNum(singlePlanProj.snapshots.m60.roiPercent, 1)}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
       * SECTION 4: MAIN INTERACTIVE FINANCIAL PROJECTION CHART (Section 13, 14, 15)
       * -------------------------------------------------------------------*/}
      <div className="p-6 rounded border bg-white shadow-sm" style={{ borderColor: C.rule }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600 }}>
              {heroPlanEcon.name} Plan — {assumptions.projectionMonths} Month Financial Projection Chart
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Live curves plotting monthly contribution, requirement parity, and cumulative payback.
            </p>
          </div>

          <div className="flex rounded border overflow-hidden" style={{ borderColor: C.rule }}>
            <button
              type="button"
              onClick={() => setActiveChartTab('parity')}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeChartTab === 'parity' ? C.ink : '#ffffff',
                color: activeChartTab === 'parity' ? '#ffffff' : C.ink,
              }}
            >
              Monthly Parity Curve
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('cumulative')}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeChartTab === 'cumulative' ? C.ink : '#ffffff',
                color: activeChartTab === 'cumulative' ? '#ffffff' : C.ink,
              }}
            >
              Cumulative Profit &amp; Payback
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('clients')}
              className="px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeChartTab === 'clients' ? C.ink : '#ffffff',
                color: activeChartTab === 'clients' ? '#ffffff' : C.ink,
              }}
            >
              Client Growth
            </button>
          </div>
        </div>

        {/* Chart SVG Rendering */}
        <div className="h-72 w-full pt-4">
          {activeChartTab === 'parity' && (
            <div className="relative h-full flex flex-col justify-between">
              <svg className="w-full h-52 overflow-visible" viewBox="0 0 800 220" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeWidth="1" />

                {/* Company Requirement line */}
                <line x1="0" y1="110" x2="800" y2="110" stroke="#dc2626" strokeWidth="2" strokeDasharray="5,5" />
                <text x="10" y="103" fill="#dc2626" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  Requirement: {money(singlePlanProj.companyMonthlyRequirement)}
                </text>

                {/* Contribution Path */}
                {(() => {
                  const maxVal = Math.max(
                    singlePlanProj.companyMonthlyRequirement * 1.5,
                    singlePlanProj.finalMonth?.monthlyContribution || 100000
                  );
                  const points = singlePlanProj.months.map((m, idx) => {
                    const x = (idx / (singlePlanProj.months.length - 1)) * 800;
                    const y = 200 - (m.monthlyContribution / maxVal) * 170;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polyline fill="none" stroke="#15803d" strokeWidth="3" points={points} />
                  );
                })()}

                {/* Monthly Break-Even Marker */}
                {singlePlanProj.monthlyBreakEvenMonthIndex && (
                  (() => {
                    const idx = singlePlanProj.monthlyBreakEvenMonthIndex - 1;
                    const x = (idx / (singlePlanProj.months.length - 1)) * 800;
                    return (
                      <g>
                        <circle cx={x} cy="110" r="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
                        <text x={x} y="85" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#15803d">
                          🎯 Break-Even (M{singlePlanProj.monthlyBreakEvenMonthIndex})
                        </text>
                      </g>
                    );
                  })()
                )}

                {/* Start Marker */}
                <circle cx="0" cy="180" r="4" fill="#1c1917" stroke="#ffffff" strokeWidth="1.5" />
                <text x="10" y="195" fontSize="10" fill="#1c1917" fontWeight="bold">
                  Start (M1)
                </text>
              </svg>

              <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-2 border-t" style={{ borderColor: C.rule }}>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-700 inline-block"></span> Monthly Contribution
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-b-2 border-red-600 border-dashed inline-block"></span> Company Requirement ({money(singlePlanProj.companyMonthlyRequirement)})
                  </span>
                </div>
                <span>Month 1 to {assumptions.projectionMonths}</span>
              </div>
            </div>
          )}

          {activeChartTab === 'cumulative' && (
            <div className="relative h-full flex flex-col justify-between">
              <svg className="w-full h-52 overflow-visible" viewBox="0 0 800 220" preserveAspectRatio="none">
                {/* Zero line (Operating Break-Even) */}
                <line x1="0" y1="130" x2="800" y2="130" stroke="#78716c" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="10" y="123" fill="#78716c" fontSize="10" fontFamily="monospace">
                  Operating Breakeven (₹0 Cumulative Profit)
                </text>

                {/* Initial Capital Line */}
                {!isInvZero && (
                  <g>
                    <line x1="0" y1="60" x2="800" y2="60" stroke="#2563eb" strokeWidth="1" strokeDasharray="4,4" />
                    <text x="10" y="53" fill="#2563eb" fontSize="10" fontFamily="monospace">
                      Initial Investment Capital ({money(singlePlanProj.initialInvestment)})
                    </text>
                  </g>
                )}

                {/* Cumulative Profit Path */}
                {(() => {
                  const maxProfit = Math.max(100000, singlePlanProj.finalMonth?.cumulativeOperatingProfit || 100000);
                  const minProfit = Math.min(-50000, singlePlanProj.months[0]?.cumulativeOperatingProfit || -50000);
                  const span = maxProfit - minProfit || 1;

                  const points = singlePlanProj.months.map((m, idx) => {
                    const x = (idx / (singlePlanProj.months.length - 1)) * 800;
                    const y = 200 - ((m.cumulativeOperatingProfit - minProfit) / span) * 170;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={points} />
                  );
                })()}

                {/* Operating Loss Recovery Marker */}
                {singlePlanProj.operatingLossRecoveryMonthIndex && (
                  (() => {
                    const idx = singlePlanProj.operatingLossRecoveryMonthIndex - 1;
                    const x = (idx / (singlePlanProj.months.length - 1)) * 800;
                    return (
                      <g>
                        <circle cx={x} cy="130" r="5" fill="#059669" stroke="#ffffff" strokeWidth="2" />
                        <text x={x} y="150" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#059669">
                          Losses Recovered (M{singlePlanProj.operatingLossRecoveryMonthIndex})
                        </text>
                      </g>
                    );
                  })()
                )}

                {/* Investment Payback Marker */}
                {singlePlanProj.investmentRecoveryMonthIndex && (
                  (() => {
                    const idx = singlePlanProj.investmentRecoveryMonthIndex - 1;
                    const x = (idx / (singlePlanProj.months.length - 1)) * 800;
                    return (
                      <g>
                        <circle cx={x} cy="60" r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <text x={x} y="45" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2563eb">
                          💎 Investment Payback (M{singlePlanProj.investmentRecoveryMonthIndex})
                        </text>
                      </g>
                    );
                  })()
                )}
              </svg>

              <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-2 border-t" style={{ borderColor: C.rule }}>
                <span className="text-blue-700 font-semibold">Cumulative Operating Profit Curve</span>
                <span>Ending Capital Recovered: {isInvZero ? 'N/A' : money(singlePlanProj.finalMonth?.capitalRecovered || 0)}</span>
                <span>Ending Cumulative: {money(singlePlanProj.finalMonth?.cumulativeOperatingProfit || 0)}</span>
              </div>
            </div>
          )}

          {activeChartTab === 'clients' && (
            <div className="relative h-full flex flex-col justify-between">
              <svg className="w-full h-52 overflow-visible" viewBox="0 0 800 220" preserveAspectRatio="none">
                {(() => {
                  const maxClients = Math.max(20, singlePlanProj.finalMonth?.closingClients || 10);
                  const points = singlePlanProj.months.map((m, idx) => {
                    const x = (idx / (singlePlanProj.months.length - 1)) * 800;
                    const y = 200 - (m.closingClients / maxClients) * 170;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <polyline fill="none" stroke="#1c1917" strokeWidth="3" points={points} />
                  );
                })()}
              </svg>

              <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-2 border-t" style={{ borderColor: C.rule }}>
                <span>Month 1: {singlePlanProj.months[0]?.closingClients || 0} clients</span>
                <span>Active Client Volume Progression</span>
                <span>Month {assumptions.projectionMonths}: {singlePlanProj.finalMonth?.closingClients || 0} clients</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------
       * SECTION 5: FINANCIAL JOURNEY MILESTONE TIMELINE (Section 25)
       * -------------------------------------------------------------------*/}
      <div className="p-6 rounded border bg-white shadow-sm" style={{ borderColor: C.rule }}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600 }}>
              Financial Journey Milestones
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Verified chronological progression of financial milestones actually achieved within the {assumptions.projectionMonths}-month horizon.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-800">
            {heroPlanEcon.name} Path
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {financialJourneyMilestones.map((m, idx) => {
            const isAchieved = m.status === 'achieved';
            const isNotReached = m.status === 'not_reached';
            const isNa = m.status === 'na';
            return (
              <div
                key={m.id}
                className="p-3.5 rounded border relative flex flex-col justify-between transition-all"
                style={{
                  borderColor: isAchieved ? '#86efac' : isNotReached ? '#fecaca' : C.rule,
                  backgroundColor: isAchieved ? '#f0fdf4' : isNotReached ? '#fef2f2' : C.paper,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Step 0{idx + 1}
                    </span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold"
                      style={{
                        backgroundColor: isAchieved ? '#dcfce7' : isNotReached ? '#fee2e2' : '#f5f5f4',
                        color: isAchieved ? '#166534' : isNotReached ? '#991b1b' : '#57534e',
                      }}
                    >
                      {m.monthLabel}
                    </span>
                  </div>

                  <strong className="text-xs font-bold block text-stone-900 mt-1">
                    {m.title}
                  </strong>
                  <span className="text-[11px] text-stone-500 block mb-2 leading-tight">
                    {m.subtitle}
                  </span>
                </div>

                <div className="pt-2 border-t text-[11px] space-y-1 font-mono" style={{ borderColor: C.rule }}>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date:</span>
                    <span className="font-semibold text-stone-800">{m.dateLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Clients:</span>
                    <span className="font-semibold text-stone-800">{m.clients}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Contrib:</span>
                    <span className="font-semibold text-emerald-700">
                      {typeof m.contribution === 'number' ? money(m.contribution) : m.contribution}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Cumul Profit:</span>
                    <span
                      className="font-bold"
                      style={{
                        color: typeof m.cumulativeProfit === 'number'
                          ? m.cumulativeProfit >= 0 ? '#15803D' : '#dc2626'
                          : '#78716c',
                      }}
                    >
                      {typeof m.cumulativeProfit === 'number' ? money(m.cumulativeProfit) : m.cumulativeProfit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------
       * SECTION 6: PLAN-BY-PLAN FINANCIAL PROJECTION COMPARISON (Section 16)
       * -------------------------------------------------------------------*/}
      <div className="p-6 rounded border bg-white shadow-sm" style={{ borderColor: C.rule }}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600 }}>
              Plan-by-Plan Financial Comparison (4 Independent Scenarios)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Side-by-side comparison of Essential, Professional, Enterprise, and Signature under identical growth and investment parameters.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
            Factual Financial Scenarios (No Rankings)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAN_KEYS.map((pid) => {
            const row = fourPlanComparison[pid];
            if (!row) return null;
            const isCurrent = (assumptions.selectedPlanId || 'essential') === pid;
            return (
              <div
                key={pid}
                className="p-4 rounded border flex flex-col justify-between transition-all"
                style={{
                  backgroundColor: isCurrent ? '#fafaf9' : '#ffffff',
                  borderColor: isCurrent ? C.ink : C.rule,
                  boxShadow: isCurrent ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.rule }}>
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      {row.planName}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-900 text-white font-mono">
                        Active Hero
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateAssumption('selectedPlanId', pid)}
                        className="text-[10px] text-blue-600 hover:underline font-medium font-sans"
                      >
                        Select Plan →
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-xl font-bold font-mono text-stone-900 block">
                      {money(row.monthlyFee)}
                      <span className="text-xs font-normal text-stone-500"> / mo</span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 block mt-0.5 font-mono">
                      Contrib: {money(row.monthlyContribution)} ({fmtNum(row.contributionMargin, 1)}%)
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t text-[11px] font-mono space-y-1.5 text-stone-700" style={{ borderColor: C.rule }}>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Clients for Breakeven:</span>
                    <strong>{row.clientsRequiredForBreakEven} clients</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Break-Even Month:</span>
                    <strong className="text-stone-900">
                      {row.monthlyBreakEvenMonth ? `Month ${row.monthlyBreakEvenMonth}` : 'Not reached'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Losses Recovered:</span>
                    <strong>
                      {row.operatingLossRecoveryMonth ? `Month ${row.operatingLossRecoveryMonth}` : 'Not reached'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Investment Payback:</span>
                    <strong className="text-blue-700">
                      {isInvZero ? 'N/A' : row.investmentRecoveryMonth ? `Month ${row.investmentRecoveryMonth}` : 'Not reached'}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-1 border-t" style={{ borderColor: C.rule }}>
                    <span className="text-stone-500">36M Cumulative Profit:</span>
                    <strong
                      style={{ color: (row.profit36M || 0) >= 0 ? '#15803D' : '#dc2626' }}
                    >
                      {row.profit36M !== null ? money(row.profit36M) : '—'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------------------
       * SECTION 7: DETERMINISTIC MONTH-BY-MONTH PROJECTION TABLE (Section 8, 15)
       * -------------------------------------------------------------------*/}
      <div className="p-6 rounded border bg-white shadow-sm" style={{ borderColor: C.rule }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600 }}>
              Deterministic Month-by-Month Projection Ledger ({heroPlanEcon.name})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Complete financial record tracing opening client volume, net additions, churn, billings, and cumulative returns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Show Rows:</span>
            {[12, 24, 36, 60].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => setTableLimit(limit)}
                className="px-2.5 py-1 rounded text-xs font-mono border transition-colors"
                style={{
                  backgroundColor: tableLimit === limit ? C.ink : '#ffffff',
                  color: tableLimit === limit ? '#ffffff' : C.ink,
                  borderColor: tableLimit === limit ? C.ink : C.rule,
                }}
              >
                {limit}M
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded border" style={{ borderColor: C.rule }}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-stone-50 text-[10px] uppercase tracking-wider" style={{ borderColor: C.rule, color: C.inkMuted }}>
                <th className="py-2.5 px-3 font-semibold">Month</th>
                <th className="py-2.5 px-3 font-semibold">Calendar</th>
                <th className="py-2.5 px-3 font-semibold text-right">Opening</th>
                <th className="py-2.5 px-3 font-semibold text-right">New</th>
                <th className="py-2.5 px-3 font-semibold text-right">Churn</th>
                <th className="py-2.5 px-3 font-semibold text-right font-bold text-stone-900">Closing</th>
                <th className="py-2.5 px-3 font-semibold">Plan</th>
                <th className="py-2.5 px-3 font-semibold text-right">Revenue</th>
                <th className="py-2.5 px-3 font-semibold text-right">Direct Cost</th>
                <th className="py-2.5 px-3 font-semibold text-right">Contribution</th>
                <th className="py-2.5 px-3 font-semibold text-right">Requirement</th>
                <th className="py-2.5 px-3 font-semibold text-right">Operating Profit</th>
                <th className="py-2.5 px-3 font-semibold text-right">Cumulative</th>
                <th className="py-2.5 px-3 font-semibold text-right">Capital Recovered</th>
                <th className="py-2.5 px-3 font-semibold text-right">ROI %</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-[11px]" style={{ borderColor: C.rule }}>
              {singlePlanProj.months.slice(0, tableLimit).map((row) => {
                const isBE = row.isMonthlyBreakEvenMonth;
                const isLossRec = row.isOperatingLossRecoveryMonth;
                const isPayback = row.isInvestmentRecoveryMonth;

                return (
                  <tr
                    key={row.monthIndex}
                    className="hover:bg-black/5 transition-colors"
                    style={{
                      backgroundColor: isPayback
                        ? '#eff6ff'
                        : isBE
                        ? '#f0fdf4'
                        : isLossRec
                        ? '#f0fdf4'
                        : 'transparent',
                    }}
                  >
                    <td className="py-2 px-3 font-bold text-stone-900">
                      M{row.monthIndex}
                    </td>
                    <td className="py-2 px-3 text-stone-600 font-sans">
                      {row.calendarDate}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-600">
                      {row.openingClients}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-700 font-bold">
                      +{row.newClients}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-500">
                      {row.churnedClients}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-stone-900">
                      {row.closingClients}
                    </td>
                    <td className="py-2 px-3 font-sans text-stone-600">
                      {row.planName}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-800">
                      {money(row.monthlyRevenue)}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-500">
                      {money(row.monthlyDirectCost)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      {money(row.monthlyContribution)}
                    </td>
                    <td className="py-2 px-3 text-right text-stone-600">
                      {money(row.companyMonthlyRequirement)}
                    </td>
                    <td
                      className="py-2 px-3 text-right font-bold"
                      style={{ color: row.operatingProfit >= 0 ? '#15803D' : '#dc2626' }}
                    >
                      {money(row.operatingProfit)}
                    </td>
                    <td
                      className="py-2 px-3 text-right font-medium"
                      style={{ color: row.cumulativeOperatingProfit >= 0 ? '#15803D' : '#dc2626' }}
                    >
                      {money(row.cumulativeOperatingProfit)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-stone-800">
                      {isInvZero ? 'N/A' : money(row.capitalRecovered)}
                    </td>
                    <td
                      className="py-2 px-3 text-right font-bold"
                      style={{
                        color: isInvZero
                          ? '#78716c'
                          : row.roiPercent >= 0 ? '#15803D' : '#dc2626',
                      }}
                    >
                      {isInvZero ? 'N/A' : `${fmtNum(row.roiPercent, 1)}%`}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      {isPayback ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 whitespace-nowrap">
                          💎 Payback
                        </span>
                      ) : isLossRec ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 whitespace-nowrap">
                          ✅ Loss Recovered
                        </span>
                      ) : isBE ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 whitespace-nowrap">
                          🎯 Break-Even
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-medium whitespace-nowrap"
                          style={{ color: row.operatingProfit >= 0 ? '#15803D' : '#9ca3af' }}
                        >
                          {row.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
