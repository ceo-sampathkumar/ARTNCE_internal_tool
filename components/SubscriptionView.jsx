'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ArrowLeft,
  Users,
  Bike,
  Plus,
  Trash2,
  HelpCircle,
  Sliders,
  Sparkles,
  BarChart3,
  Layers,
  Calendar,
  DollarSign,
  Briefcase,
  Wrench,
  Truck,
  Paintbrush,
} from 'lucide-react';
import {
  DESIGN_TOKENS as C,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  fmtNum,
  fmtCurrency,
} from '@/lib/calculator';
import { SUBSCRIPTION_PRESETS } from '@/lib/defaults';

export default function SubscriptionView({
  curatedSummary = { totalProductionCost: 0, validCount: 0, totalArea: 0, avgCostPerArtwork: 0 },
  curationContext = {},
  availablePaintings = [],
  companyCosts = { employees: [], bikeReimbursement: {}, otherRecurringExpenses: [] },
  onUpdateCompanyCosts,
  onUpdateEmployee,
  onAddEmployee,
  onRemoveEmployee,
  onUpdateBikeReimbursement,
  plans = {},
  activePlanId = 'professional',
  onChangeActivePlanId,
  onUpdatePlan,
  onUpdatePlanNested,
  onTogglePlanPainting,
  onSelectAllPlanPaintings,
  onClearPlanPaintings,
  onResetPlanToCurated,
  plansEconomics = {},
  settings = {},
  onSaveSnapshot,
  onNavigateToCurate,
  onNavigateToBatch,
  // Backward compatibility props
  subscriptionState,
  onUpdateSubscription,
}) {
  const [showCompanyCosts, setShowCompanyCosts] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [activeCycleTab, setActiveCycleTab] = useState('initial');

  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  // Active plan & evaluated economics
  const currentPlanId = activePlanId || 'professional';
  const currentPlan = plans[currentPlanId] || plans.professional || {};
  const currentEconomics =
    plansEconomics[currentPlanId] ||
    plansEconomics.professional || {
      initialInvestment: 0,
      monthlySubscription: 0,
      monthlyContribution: 0,
      totalMonthlyOperatingCosts: 0,
      simpleRecoveryMonths: null,
      estimatedRecoveryMonths: null,
      isRecoveryAchievable: false,
      unachievableReason: null,
      scenarios: [],
      curator: { totalCuratorCost: 0 },
      installation: { total: 0 },
      logistics: { total: 0 },
      projectTravel: { total: 0 },
      totalProjectVisitCosts: 0,
    };

  // Available valid paintings from inventory pool
  const validPaintings = useMemo(() => {
    return (availablePaintings || []).filter(
      (p) => p.cost?.isValid || (p.width && p.height)
    );
  }, [availablePaintings]);

  // Set of painting IDs currently assigned to this plan
  const planSelectedIdSet = useMemo(() => {
    if (Array.isArray(currentPlan.selectedPaintingIds)) {
      return new Set(currentPlan.selectedPaintingIds);
    }
    if (curationContext.selectedPaintingIds && curationContext.selectedPaintingIds.length > 0) {
      return new Set(curationContext.selectedPaintingIds);
    }
    return new Set(validPaintings.map((p) => p.id));
  }, [currentPlan.selectedPaintingIds, curationContext.selectedPaintingIds, validPaintings]);

  const isCustomizedCollection = Array.isArray(currentPlan.selectedPaintingIds);

  const {
    initialInvestment,
    monthlySubscription,
    monthlyContribution,
    totalMonthlyOperatingCosts,
    simpleRecoveryMonths,
    estimatedRecoveryMonths,
    isRecoveryAchievable,
    unachievableReason,
    scenarios = [],
    allocatedEmployeeSalary = 0,
    curator = { feePerCycle: 2000, cycles: 1, totalCuratorCost: 2000 },
    installation = { feePerCycle: 1500, cycles: 1, total: 1500 },
    logistics = { feePerCycle: 1200, cycles: 1, total: 1200 },
    projectTravel = { feePerCycle: 600, cycles: 1, total: 600 },
    totalProjectVisitCosts = 0,
  } = currentEconomics;

  const handleSubscriptionPriceChange = (val) => {
    if (onUpdatePlan) {
      onUpdatePlan(currentPlanId, 'monthlySubscription', val);
    } else if (onUpdateSubscription) {
      onUpdateSubscription('monthlySubscription', val);
    }
  };

  const handleSave = () => {
    if (onSaveSnapshot) {
      onSaveSnapshot({
        type: 'subscription_plan',
        title:
          snapshotTitle.trim() ||
          `${currentPlan.name || 'Plan'} - ${curationContext.collectionName || 'Collection'} Economics`,
        planId: currentPlanId,
        economics: currentEconomics,
      });
      setSnapshotTitle('');
    }
  };

  // Company Costs calculated breakdown
  const employeePoolTotal = (companyCosts.employees || []).reduce(
    (sum, e) => sum + Math.max(0, Number(e.monthlySalary) || 0),
    0
  );
  const bikeRate = Number(companyCosts.bikeReimbursement?.ratePerKm) || 3;
  const bikeKm = Number(companyCosts.bikeReimbursement?.monthlyKm) || 2000;
  const monthlyBikeCost = bikeRate * bikeKm;

  return (
    <div className="space-y-8">
      {/* 1. Plan Switcher Navigation Bar */}
      <div
        className="p-4 flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundColor: C.paperDark,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold mr-2" style={{ color: C.inkMuted }}>
            Subscription Plans:
          </span>
          {['essential', 'professional', 'enterprise', 'signature'].map((planKey) => {
            const p = plans[planKey] || {};
            const isSelected = currentPlanId === planKey && !showComparison;
            return (
              <button
                key={planKey}
                type="button"
                onClick={() => {
                  setShowComparison(false);
                  if (onChangeActivePlanId) onChangeActivePlanId(planKey);
                }}
                className="px-3.5 py-1.5 text-xs rounded font-medium transition-colors flex items-center gap-2"
                style={{
                  backgroundColor: isSelected ? C.ink : C.paper,
                  color: isSelected ? C.paper : C.ink,
                  border: `1px solid ${isSelected ? C.ink : C.rule}`,
                }}
              >
                <span>{p.name || planKey.toUpperCase()}</span>
                {planKey === 'signature' && (
                  <span
                    className="text-[10px] px-1 rounded uppercase font-mono"
                    style={{
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : C.paperDark,
                      color: isSelected ? C.paper : C.rust,
                    }}
                  >
                    Custom
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowComparison(!showComparison)}
            className="px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5"
            style={{
              backgroundColor: showComparison ? C.ink : 'transparent',
              color: showComparison ? C.paper : C.inkMuted,
              border: `1px solid ${showComparison ? C.ink : C.rule}`,
            }}
          >
            <BarChart3 size={13} />
            <span>Compare 4 Plans</span>
          </button>
        </div>

        {/* Company Operating Model Drawer Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCompanyCosts(!showCompanyCosts)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium transition-colors"
            style={{
              backgroundColor: showCompanyCosts ? C.rust : C.paper,
              color: showCompanyCosts ? '#fff' : C.ink,
              border: `1px solid ${showCompanyCosts ? C.rust : C.rule}`,
            }}
          >
            <Users size={13} />
            <span>Company Salaries & Bike Model</span>
            <span
              className="ml-1 text-[10px] px-1.5 py-0.2 rounded font-mono"
              style={{
                backgroundColor: showCompanyCosts ? 'rgba(255,255,255,0.2)' : C.paperDark,
                color: showCompanyCosts ? '#fff' : C.inkMuted,
              }}
            >
              {companyCosts.employees?.length || 3} Staff ({money(employeePoolTotal)}/mo)
            </span>
          </button>
        </div>
      </div>

      {/* 2. Company Operating Model Drawer (Staff Salaries & Bike Reimbursement) */}
      {showCompanyCosts && (
        <div
          className="p-6 transition-all"
          style={{
            backgroundColor: C.paperDark,
            border: `1px solid ${C.rule}`,
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b mb-5" style={{ borderColor: C.rule }}>
            <div>
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: C.rust }} />
                <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.2rem', fontWeight: 600, color: C.ink }}>
                  ARTNCE Company Operating Cost Assumptions
                </h2>
              </div>
              <p className="text-xs mt-1" style={{ color: C.inkMuted }}>
                Company-level recurring expenses. The employee salary pool is shared across the company — individual plans receive an explicit percentage allocation rather than charging 100% of staff costs to one plan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCompanyCosts(false)}
              className="text-xs px-3 py-1.5"
              style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper, color: C.ink }}
            >
              Close Assumptions
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Employee Salary Pool */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkMuted }}>
                    Employee Staff Costs
                  </h3>
                  <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                    Total Staff Pool: <strong className="font-mono text-stone-800">{money(employeePoolTotal)}/month</strong> (Combined for all {companyCosts.employees?.length || 0} employees)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onAddEmployee}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 font-medium"
                  style={{ backgroundColor: C.ink, color: C.paper }}
                >
                  <Plus size={12} /> Add Employee
                </button>
              </div>

              <div className="overflow-x-auto" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                      <th className="py-2.5 px-3 font-medium">Employee Name</th>
                      <th className="py-2.5 px-3 font-medium">Role</th>
                      <th className="py-2.5 px-3 font-medium text-right">Monthly Salary</th>
                      <th className="py-2.5 px-2 text-center" style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(companyCosts.employees || []).map((emp) => (
                      <tr key={emp.id} style={{ borderBottom: `1px solid ${C.rule}` }}>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={emp.name}
                            onChange={(e) => onUpdateEmployee(emp.id, 'name', e.target.value)}
                            placeholder="e.g. Art Technician"
                            className="w-full bg-transparent outline-none font-medium"
                            style={{ color: C.ink, fontFamily: FONT_BODY }}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={emp.role}
                            onChange={(e) => onUpdateEmployee(emp.id, 'role', e.target.value)}
                            placeholder="e.g. Delivery & Framing"
                            className="w-full bg-transparent outline-none text-stone-500"
                            style={{ fontFamily: FONT_BODY }}
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-stone-400 mr-1 font-mono">{symbol}</span>
                            <input
                              type="number"
                              step="any"
                              value={emp.monthlySalary}
                              onChange={(e) => onUpdateEmployee(emp.id, 'monthlySalary', e.target.value)}
                              placeholder="0"
                              className="w-28 bg-transparent text-right outline-none tabular font-mono font-medium"
                              style={{ color: C.ink }}
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveEmployee(emp.id)}
                            style={{ color: C.inkMuted }}
                            className="hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] rounded flex items-start gap-2">
                <HelpCircle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Business Principle:</strong> The ₹3,00,000 monthly total is the company employee pool. When evaluating a subscription plan (like Professional at 20%), only the assigned allocation (e.g. ₹60,000/mo) is attributed to that plan.
                </div>
              </div>
            </div>

            {/* Right: Bike / Travel Reimbursement Model */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkMuted }}>
                Bike / Travel Reimbursement
              </h3>

              <div className="p-4" style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Bike size={16} style={{ color: C.rust }} />
                  <span className="text-xs font-medium" style={{ color: C.ink }}>
                    Employee Bike Company Usage
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>
                      Rate per KM
                    </span>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={bikeRate}
                        onChange={(e) => onUpdateBikeReimbursement('ratePerKm', e.target.value)}
                        className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono font-medium"
                        style={{ color: C.ink }}
                      />
                      <span className="text-xs text-stone-400 pl-1">/ km</span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>
                      Monthly Company KM
                    </span>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <input
                        type="number"
                        step="any"
                        value={bikeKm}
                        onChange={(e) => onUpdateBikeReimbursement('monthlyKm', e.target.value)}
                        className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono font-medium"
                        style={{ color: C.ink }}
                      />
                      <span className="text-xs text-stone-400 pl-1">km</span>
                    </div>
                  </label>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: C.rule }}>
                  <span style={{ color: C.inkMuted }}>Total Monthly Bike Cost:</span>
                  <span className="tabular font-mono font-semibold" style={{ color: C.rust }}>
                    {fmtNum(bikeKm)} km × {money(bikeRate)} = {money(monthlyBikeCost)}/mo
                  </span>
                </div>
              </div>

              <div className="p-3 rounded text-[11px]" style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}`, color: C.inkMuted }}>
                <strong>Travel allocation note:</strong> This company-wide vehicle allowance can be assigned across active subscription clients via each plan&apos;s travel allowance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Comparison Matrix View across all 4 plans */}
      {showComparison ? (
        <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: C.rule }}>
            <div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.2rem', fontWeight: 600, color: C.ink }}>
                Side-by-Side Economics Comparison (All 4 Plans)
              </h2>
              <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                Compare monthly subscription fees, artwork investments, employee allocations, operating costs, and investment recovery across all four plans.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ minWidth: 800 }}>
              <thead>
                <tr className="uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium text-right">Monthly Fee</th>
                  <th className="py-3 px-4 font-medium text-right">Artwork Investment</th>
                  <th className="py-3 px-4 font-medium text-right">Employee Alloc.</th>
                  <th className="py-3 px-4 font-medium text-right">Monthly Op Costs</th>
                  <th className="py-3 px-4 font-medium text-right">Monthly Contribution</th>
                  <th className="py-3 px-4 font-medium text-center">Recovery Period</th>
                  <th className="py-3 px-4 font-medium text-right">12-Mo Net Contribution</th>
                </tr>
              </thead>
              <tbody>
                {['essential', 'professional', 'enterprise', 'signature'].map((pKey) => {
                  const pData = plans[pKey] || {};
                  const pEcon = plansEconomics[pKey] || {};
                  const sc12 = (pEcon.scenarios || []).find((s) => s.months === 12);

                  return (
                    <tr
                      key={pKey}
                      className="transition-colors hover:bg-stone-50"
                      style={{ borderBottom: `1px solid ${C.rule}` }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm" style={{ color: C.ink }}>
                          {pData.name}
                        </div>
                        <div className="text-[11px]" style={{ color: C.inkMuted }}>
                          {pEcon.spaceSqFt ?? pData.spaceSqFt} sq ft • {pEcon.artworkCount ?? pData.artworkCount} artworks
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono font-semibold text-sm" style={{ color: C.ink }}>
                        {money(pEcon.monthlySubscription)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.rust }}>
                        {money(pEcon.initialInvestment)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {money(pEcon.allocatedEmployeeSalary)} ({pData.employeeAllocationPercent || 0}%)
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {money(pEcon.totalMonthlyOperatingCosts)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono font-semibold" style={{ color: pEcon.monthlyContribution > 0 ? C.ink : '#DC2626' }}>
                        {money(pEcon.monthlyContribution)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {pEcon.isRecoveryAchievable && pEcon.estimatedRecoveryMonths ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                            {Math.ceil(pEcon.estimatedRecoveryMonths)} mo
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {pEcon.initialInvestment === 0 ? 'No Artworks' : 'Not Achievable'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono font-semibold">
                        <span style={{ color: sc12 && sc12.contributionAfterInvestment >= 0 ? C.rust : '#DC2626' }}>
                          {sc12 ? money(sc12.contributionAfterInvestment) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 4. Active Plan Detailed Economics & Justification */
        <>
          {/* Active Plan Header & Scope Banner */}
          <div
            className="p-6"
            style={{
              backgroundColor: C.paperDark,
              border: `1px solid ${C.rule}`,
            }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.rust }}>
                    Subscription Framework
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-medium" style={{ backgroundColor: C.paper, color: C.ink }}>
                    {currentPlan.name} Plan
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono text-stone-600 bg-stone-200/80">
                    Commercial Framework (Scope Fully Customizable)
                  </span>
                </div>
                <h2 className="mt-1 font-semibold text-lg" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                  {currentPlan.name}: {currentPlan.tagline}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  A subscription plan is a commercial pricing framework. The actual client project determines the artworks, dimensions, and space required.
                </p>
              </div>

              {/* Space Size & Artwork Source Scope Inputs */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Editable Space Size */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 border rounded" style={{ backgroundColor: C.paper, borderColor: C.rule }}>
                  <span className="text-xs font-semibold" style={{ color: C.inkMuted }}>Space Size:</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={currentPlan.spaceSqFt ?? ''}
                    onChange={(e) => onUpdatePlan && onUpdatePlan(currentPlanId, 'spaceSqFt', e.target.value)}
                    placeholder="2500"
                    className="w-20 bg-transparent text-right font-mono font-semibold text-sm outline-none"
                    style={{ color: C.ink }}
                  />
                  <span className="text-xs text-stone-400 font-mono">sq ft</span>
                </div>

                {/* Artwork Source Toggle */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdatePlan && onUpdatePlan(currentPlanId, 'artworkSource', 'curated')}
                    className="text-xs px-3 py-1.5 font-medium transition-colors rounded-l"
                    style={{
                      backgroundColor: currentPlan.artworkSource !== 'custom' ? C.ink : C.paper,
                      color: currentPlan.artworkSource !== 'custom' ? C.paper : C.ink,
                      border: `1px solid ${C.rule}`,
                    }}
                  >
                    Select from Artworks ({currentEconomics.artworkCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePlan && onUpdatePlan(currentPlanId, 'artworkSource', 'custom')}
                    className="text-xs px-3 py-1.5 font-medium transition-colors rounded-r"
                    style={{
                      backgroundColor: currentPlan.artworkSource === 'custom' ? C.ink : C.paper,
                      color: currentPlan.artworkSource === 'custom' ? C.paper : C.ink,
                      border: `1px solid ${C.rule}`,
                    }}
                  >
                    Custom Benchmark
                  </button>
                </div>
              </div>
            </div>

            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-xs" style={{ color: C.inkMuted }}>Project Scope</div>
                <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.ink }}>
                  {currentEconomics.artworkCount}{' '}
                  <span className="text-sm font-normal text-stone-500">
                    artworks ({currentEconomics.spaceSqFt ?? currentPlan.spaceSqFt} sq ft)
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  {fmtNum(currentEconomics.totalArea, 1)} sq ft total artwork area
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: C.inkMuted }}>Initial Artwork Investment</div>
                <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.rust }}>
                  {money(initialInvestment)}
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Avg {money(currentEconomics.avgCostPerArtwork)} / artwork
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: C.inkMuted }}>Monthly Operating Cost</div>
                <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.inkMuted }}>
                  {money(totalMonthlyOperatingCosts)} <span className="text-xs font-normal">/ mo</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Staff {money(allocatedEmployeeSalary)} ({currentPlan.employeeAllocationPercent || 0}%)
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: C.inkMuted }}>Monthly Contribution</div>
                <div
                  className="tabular mt-1 text-2xl font-semibold"
                  style={{ fontFamily: FONT_MONO, color: monthlyContribution > 0 ? C.ink : '#DC2626' }}
                >
                  {money(monthlyContribution)} <span className="text-xs font-normal">/ mo</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Revenue − Operating Costs
                </div>
              </div>
            </div>

            {/* Default Scenario Note */}
            {currentPlan.exampleScenarioLabel && (
              <div className="mt-4 pt-3 border-t text-[11px] text-stone-500 flex items-center justify-between flex-wrap gap-2" style={{ borderColor: C.rule }}>
                <span className="italic">
                  Default Assumption: {currentPlan.exampleScenarioLabel} (Editable planning scenario, not a fixed plan limit).
                </span>
                <span className="font-mono text-[10px] text-stone-400">
                  Plan Identity: {currentPlan.name} (Preserved regardless of artwork count or space)
                </span>
              </div>
            )}
          </div>

          {/* Active Plan Artwork Scope & Selection Manager */}
          <div className="p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
            <div className="flex items-center justify-between pb-3 border-b mb-5 flex-wrap gap-3" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center gap-2">
                  <Layers size={16} style={{ color: C.rust }} />
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
                    Artwork Scope & Selection ({currentPlan.name} Plan)
                  </h3>
                  {isCustomizedCollection ? (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-stone-800 text-white">
                      Plan-Specific Collection ({currentEconomics.artworkCount} artworks)
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-stone-200 text-stone-700">
                      Inheriting Curated Collection ({curatedSummary.validCount} artworks)
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: C.inkMuted }}>
                  Select or remove individual artworks for this {currentPlan.name} proposal. The actual selected artworks determine the plan&apos;s artwork count, area, and initial artwork investment.
                </p>
              </div>

              {/* Artwork Source Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdatePlan && onUpdatePlan(currentPlanId, 'artworkSource', 'curated')}
                  className="text-xs px-3 py-1.5 font-medium transition-colors"
                  style={{
                    backgroundColor: currentPlan.artworkSource !== 'custom' ? C.ink : C.paperDark,
                    color: currentPlan.artworkSource !== 'custom' ? C.paper : C.ink,
                    border: `1px solid ${C.rule}`,
                  }}
                >
                  Select from Artworks ({currentEconomics.artworkCount})
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePlan && onUpdatePlan(currentPlanId, 'artworkSource', 'custom')}
                  className="text-xs px-3 py-1.5 font-medium transition-colors"
                  style={{
                    backgroundColor: currentPlan.artworkSource === 'custom' ? C.ink : C.paperDark,
                    color: currentPlan.artworkSource === 'custom' ? C.paper : C.ink,
                    border: `1px solid ${C.rule}`,
                  }}
                >
                  Custom Benchmark Scenario
                </button>
              </div>
            </div>

            {currentPlan.artworkSource === 'custom' ? (
              /* Custom Benchmark Scenario Mode */
              <div className="space-y-4">
                <div className="p-3.5 bg-stone-50 border border-stone-200 text-xs rounded">
                  <div className="font-semibold text-stone-800 mb-0.5">Benchmark / Custom Scenario Mode</div>
                  <div className="text-stone-600">
                    Use custom benchmark inputs to evaluate subscription pricing and payback before physical artworks are chosen.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <label className="block p-4 border rounded" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
                    <span className="block text-xs font-medium mb-1" style={{ color: C.inkMuted }}>
                      Custom Artwork Count
                    </span>
                    <div className="flex items-center border-b" style={{ borderColor: C.ink }}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={currentPlan.customArtworkCount ?? currentPlan.artworkCount ?? 5}
                        onChange={(e) => onUpdatePlan && onUpdatePlan(currentPlanId, 'customArtworkCount', e.target.value)}
                        className="w-full bg-transparent py-1 text-xl font-mono font-semibold outline-none"
                        style={{ color: C.ink }}
                      />
                      <span className="text-xs text-stone-500 pl-1 font-mono">artworks</span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 block">Pieces included in scope</span>
                  </label>

                  <label className="block p-4 border rounded" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
                    <span className="block text-xs font-medium mb-1" style={{ color: C.inkMuted }}>
                      Custom Total Area
                    </span>
                    <div className="flex items-center border-b" style={{ borderColor: C.ink }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={currentPlan.customTotalArea ?? 60}
                        onChange={(e) => onUpdatePlan && onUpdatePlan(currentPlanId, 'customTotalArea', e.target.value)}
                        className="w-full bg-transparent py-1 text-xl font-mono font-semibold outline-none"
                        style={{ color: C.ink }}
                      />
                      <span className="text-xs text-stone-500 pl-1 font-mono">sq ft</span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 block">Combined canvas coverage</span>
                  </label>

                  <label className="block p-4 border rounded" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
                    <span className="block text-xs font-medium mb-1" style={{ color: C.inkMuted }}>
                      Custom Initial Artwork Investment
                    </span>
                    <div className="flex items-center border-b" style={{ borderColor: C.ink }}>
                      <span className="text-base font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={currentPlan.customInitialInvestment ?? 30000}
                        onChange={(e) => onUpdatePlan && onUpdatePlan(currentPlanId, 'customInitialInvestment', e.target.value)}
                        className="w-full bg-transparent py-1 text-xl font-mono font-semibold outline-none"
                        style={{ color: C.ink }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400 mt-1 block">Production, stretching & framing</span>
                  </label>
                </div>
              </div>
            ) : (
              /* Real Artwork Selection from Inventory / Curated */
              <div className="space-y-4">
                {/* Batch Action Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectAllPlanPaintings && onSelectAllPlanPaintings(currentPlanId)}
                      className="px-2.5 py-1 rounded font-medium transition-colors"
                      style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paperDark, color: C.ink }}
                    >
                      Select All Available ({validPaintings.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => onClearPlanPaintings && onClearPlanPaintings(currentPlanId)}
                      className="px-2.5 py-1 rounded font-medium transition-colors"
                      style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paperDark, color: C.inkMuted }}
                    >
                      Clear Selection
                    </button>
                    {isCustomizedCollection && (
                      <button
                        type="button"
                        onClick={() => onResetPlanToCurated && onResetPlanToCurated(currentPlanId)}
                        className="px-2.5 py-1 rounded font-medium transition-colors text-stone-600 hover:text-stone-900"
                        style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}
                      >
                        ↺ Reset to Curated Set ({curatedSummary.validCount})
                      </button>
                    )}
                  </div>

                  {onNavigateToBatch && (
                    <button
                      type="button"
                      onClick={onNavigateToBatch}
                      className="flex items-center gap-1 font-medium hover:underline text-xs"
                      style={{ color: C.rust }}
                    >
                      <Plus size={12} /> Add New Artwork in Batch Pool
                    </button>
                  )}
                </div>

                {/* Artworks List / Table */}
                {validPaintings.length === 0 ? (
                  <div className="p-8 text-center border rounded" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
                    <p className="text-sm font-medium text-stone-700">
                      No artwork dimensions entered yet in Artwork Pool (Batch).
                    </p>
                    <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                      Define artwork sizes in Stage 02 BATCH, or switch to Custom Benchmark mode to test plan economics immediately.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      {onNavigateToBatch && (
                        <button
                          type="button"
                          onClick={onNavigateToBatch}
                          className="px-3 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: C.ink, color: C.paper }}
                        >
                          Go to 02 BATCH
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onUpdatePlan && onUpdatePlan(currentPlanId, 'artworkSource', 'custom')}
                        className="px-3 py-1.5 text-xs font-medium border"
                        style={{ borderColor: C.rule, backgroundColor: C.paper, color: C.ink }}
                      >
                        Use Custom Benchmark Mode
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border" style={{ borderColor: C.rule }}>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.rule}`, backgroundColor: C.paperDark, color: C.inkMuted }}>
                          <th className="py-2.5 px-3 font-medium text-center" style={{ width: '44px' }}>In Plan</th>
                          <th className="py-2.5 px-3 font-medium">Artwork Title / ID</th>
                          <th className="py-2.5 px-3 font-medium">Dimensions</th>
                          <th className="py-2.5 px-3 font-medium text-right">Area (sq ft)</th>
                          <th className="py-2.5 px-3 font-medium">Framing &amp; Specs</th>
                          <th className="py-2.5 px-3 font-medium text-right">Production Cost</th>
                          <th className="py-2.5 px-3 font-medium text-center" style={{ width: '130px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validPaintings.map((p, idx) => {
                          const isIncluded = planSelectedIdSet.has(p.id);
                          return (
                            <tr
                              key={p.id}
                              className="transition-colors"
                              style={{
                                borderBottom: `1px solid ${C.rule}`,
                                backgroundColor: isIncluded ? 'rgba(245, 245, 240, 0.7)' : C.paper,
                              }}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isIncluded}
                                  onChange={() => onTogglePlanPainting && onTogglePlanPainting(currentPlanId, p.id)}
                                  className="w-4 h-4 cursor-pointer accent-stone-800"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-stone-900">
                                  {p.title || `Artwork #${idx + 1}`}
                                </div>
                                <div className="text-[10px] font-mono text-stone-400">
                                  ID: {p.id}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {p.width} × {p.height} {p.unit || 'ft'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {fmtNum(p.cost?.areaSqFt, 1)} sq ft
                              </td>
                              <td className="py-2.5 px-3 text-stone-600">
                                {settings.frameEnabled ? (settings.frameType || 'External Frame') : 'Unframed / Canvas Wrap'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium" style={{ color: C.rust }}>
                                {money(p.cost?.totalProductionCost)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {isIncluded ? (
                                  <button
                                    type="button"
                                    onClick={() => onTogglePlanPainting && onTogglePlanPainting(currentPlanId, p.id)}
                                    className="text-[11px] font-medium text-red-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    <Trash2 size={11} /> Remove
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onTogglePlanPainting && onTogglePlanPainting(currentPlanId, p.id)}
                                    className="text-[11px] font-medium text-stone-800 hover:underline inline-flex items-center gap-1"
                                  >
                                    <Plus size={11} /> + Add to Plan
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="p-3 bg-stone-50 border border-stone-200 text-stone-700 text-[11px] rounded flex items-center justify-between flex-wrap gap-2">
                  <span>
                    <strong>Dynamic Economics:</strong> Changing artworks immediately updates Initial Artwork Investment (<strong>{money(initialInvestment)}</strong>), Simple Recovery (<strong>{simpleRecoveryMonths ? `${fmtNum(simpleRecoveryMonths, 1)} mo` : '—'}</strong>), and Monthly Contribution (<strong>{money(monthlyContribution)}</strong>).
                  </span>
                  <span className="font-mono text-stone-500">
                    Plan Identity: {currentPlan.name} (Never converts into another plan)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Monthly Subscription Input & Core Recovery Analysis Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Client Subscription Input */}
            <div className="lg:col-span-6 p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
              <div className="flex items-center justify-between mb-1">
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
                  Monthly Subscription Fee
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                  Client Revenue Input
                </span>
              </div>
              <p className="text-xs mb-5" style={{ color: C.inkMuted }}>
                Enter proposed monthly fee. Subscription pricing does not alter artwork production cost.
              </p>

              <label className="block">
                <span className="block text-xs mb-1.5" style={{ color: C.inkMuted }}>
                  Client Monthly Payment
                </span>
                <div className="flex items-center border-b-2" style={{ borderColor: C.ink }}>
                  <span className="text-lg font-mono mr-1" style={{ color: C.inkMuted }}>{symbol}</span>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={currentPlan.monthlySubscription || ''}
                    onChange={(e) => handleSubscriptionPriceChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-2 text-2xl outline-none tabular font-mono font-medium"
                    style={{ color: C.ink }}
                  />
                  <span className="text-xs text-stone-500 whitespace-nowrap pl-2">/ month</span>
                </div>
              </label>

              {/* Quick presets */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: C.inkMuted }}>Presets:</span>
                {SUBSCRIPTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSubscriptionPriceChange(preset)}
                    className="text-xs px-2.5 py-1 transition-colors"
                    style={{
                      border: `1px solid ${Number(currentPlan.monthlySubscription) === preset ? C.ink : C.rule}`,
                      backgroundColor: Number(currentPlan.monthlySubscription) === preset ? C.ink : 'transparent',
                      color: Number(currentPlan.monthlySubscription) === preset ? C.paper : C.ink,
                      fontFamily: FONT_MONO,
                    }}
                  >
                    {money(preset)}
                  </button>
                ))}
              </div>

              {/* Revenue vs Operating Costs Breakdown Box */}
              <div className="mt-6 pt-5 border-t" style={{ borderColor: C.rule }}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
                    <div className="text-xs" style={{ color: C.inkMuted }}>Monthly Revenue</div>
                    <div className="mt-1 text-lg font-semibold tabular font-mono" style={{ color: C.ink }}>
                      {money(monthlySubscription)}
                    </div>
                  </div>
                  <div className="p-3.5" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
                    <div className="text-xs" style={{ color: C.inkMuted }}>Monthly Operating Costs</div>
                    <div className="mt-1 text-lg font-semibold tabular font-mono" style={{ color: C.inkMuted }}>
                      {money(totalMonthlyOperatingCosts)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-4" style={{ backgroundColor: C.ink, color: C.paper }}>
                  <div className="text-xs text-stone-300">
                    Monthly Contribution (Revenue − Recurring Operating Costs)
                  </div>
                  <div
                    className="mt-1 text-2xl font-bold tabular font-mono"
                    style={{ color: monthlyContribution > 0 ? C.paper : '#F87171' }}
                  >
                    {money(monthlyContribution)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Recovery Analysis Cards */}
            <div className="lg:col-span-6 space-y-4">
              {/* Card A: Simple Artwork Investment Recovery */}
              <div className="p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
                    Simple Artwork Investment Recovery
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                    Initial Artwork Investment ÷ Monthly Subscription (excludes recurring operating costs)
                  </p>
                </div>

                <div className="mt-4">
                  {simpleRecoveryMonths !== null ? (
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-semibold tabular font-mono" style={{ color: C.rust }}>
                        {Math.ceil(simpleRecoveryMonths)} {Math.ceil(simpleRecoveryMonths) === 1 ? 'Month' : 'Months'}
                      </div>
                      <div className="text-xs tabular font-mono" style={{ color: C.inkMuted }}>
                        ({fmtNum(simpleRecoveryMonths, 1)} months exact)
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-stone-500">
                      {initialInvestment === 0
                        ? 'No curated artworks selected. Add artworks to calculate investment recovery.'
                        : 'Enter a monthly subscription price.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Card B: Estimated Recovery After Operating Costs */}
              <div className="p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paperDark }}>
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.ink }}>
                    Estimated Investment Recovery (With Operating Costs)
                  </span>
                  <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                    Initial Artwork Investment ÷ Monthly Contribution (accounts for staff allocation & recurring costs)
                  </p>
                </div>

                <div className="mt-4">
                  {isRecoveryAchievable && estimatedRecoveryMonths !== null ? (
                    <div className="flex items-baseline gap-3">
                      <div className="text-3xl font-semibold tabular font-mono" style={{ color: C.ink }}>
                        {Math.ceil(estimatedRecoveryMonths)} {Math.ceil(estimatedRecoveryMonths) === 1 ? 'Month' : 'Months'}
                      </div>
                      <div className="text-xs tabular font-mono" style={{ color: C.inkMuted }}>
                        ({fmtNum(estimatedRecoveryMonths, 1)} months exact)
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle size={14} className="text-red-700 shrink-0" />
                        <span>
                          {unachievableReason ||
                            'Investment recovery is not achievable at the current subscription price and operating costs.'}
                        </span>
                      </div>
                      {monthlyContribution <= 0 && monthlySubscription > 0 && (
                        <p className="mt-1 text-[11px] text-red-700">
                          Monthly operating costs ({money(totalMonthlyOperatingCosts)}) exceed subscription revenue ({money(monthlySubscription)}).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. Explicit 3-Tier Cost Classification Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category A: Initial / Artwork Investment */}
            <div className="p-6 flex flex-col justify-between" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-700 inline-block"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
                    A. Initial Artwork Investment
                  </span>
                </div>
                <h3 className="font-semibold text-base" style={{ color: C.ink }}>
                  Production & Framing Outlay
                </h3>
                <p className="text-xs mt-0.5 mb-4" style={{ color: C.inkMuted }}>
                  Non-recurring cost incurred once to produce, stretch, frame, and transport artworks.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                    <span style={{ color: C.inkMuted }}>Artworks In Plan:</span>
                    <span className="font-mono font-medium">{currentEconomics.artworkCount} pieces</span>
                  </div>
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                    <span style={{ color: C.inkMuted }}>Client Space Size:</span>
                    <span className="font-mono font-medium">{currentEconomics.spaceSqFt ?? currentPlan.spaceSqFt} sq ft</span>
                  </div>
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                    <span style={{ color: C.inkMuted }}>Total Canvas Area:</span>
                    <span className="font-mono font-medium">{fmtNum(currentEconomics.totalArea, 1)} sq ft</span>
                  </div>
                  {currentPlan.artworkSource === 'custom' ? (
                    <label className="block pt-1">
                      <span className="block text-[11px] mb-1" style={{ color: C.inkMuted }}>
                        Custom Benchmark Artwork Outlay
                      </span>
                      <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                        <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                        <input
                          type="number"
                          step="any"
                          value={currentPlan.customInitialInvestment || ''}
                          onChange={(e) => onUpdatePlan(currentPlanId, 'customInitialInvestment', e.target.value)}
                          className="w-full bg-transparent py-1 text-sm outline-none tabular font-mono font-medium"
                          style={{ color: C.ink }}
                        />
                      </div>
                    </label>
                  ) : (
                    <div className="flex justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                      <span style={{ color: C.inkMuted }}>
                        {isCustomizedCollection ? 'Plan-Specific Collection:' : 'Inherited Curated Set:'}
                      </span>
                      <span className="font-mono font-medium">
                        {currentEconomics.artworkCount} artworks
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                    <span style={{ color: C.inkMuted }}>Avg Outlay / Artwork:</span>
                    <span className="font-mono font-medium">
                      {money(initialInvestment / (currentEconomics.artworkCount || 1))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t flex items-center justify-between" style={{ borderColor: C.rule }}>
                <span className="text-xs font-semibold" style={{ color: C.ink }}>
                  Total Artwork Outlay:
                </span>
                <span className="text-lg font-bold tabular font-mono" style={{ color: C.rust }}>
                  {money(initialInvestment)}
                </span>
              </div>
            </div>

            {/* Category B: Monthly Recurring Operating Costs */}
            <div className="p-6 flex flex-col justify-between" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-700 inline-block"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
                    B. Monthly Recurring Costs
                  </span>
                </div>
                <h3 className="font-semibold text-base" style={{ color: C.ink }}>
                  Recurring Operating & Delivery
                </h3>
                <p className="text-xs mt-0.5 mb-4" style={{ color: C.inkMuted }}>
                  Only genuine recurring monthly costs. Curator and installation are strictly excluded.
                </p>

                <div className="space-y-3 text-xs">
                  {/* Employee Allocation */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: C.inkMuted }}>
                        Employee Allocation ({currentPlan.employeeAllocationPercent || 0}% of ₹3L)
                      </span>
                      <span className="font-mono font-semibold text-stone-800">
                        {money(allocatedEmployeeSalary)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={currentPlan.employeeAllocationPercent || 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'employeeAllocationPercent', e.target.value)}
                        className="w-full accent-stone-700"
                      />
                      <span className="font-mono text-[11px] w-10 text-right">
                        {currentPlan.employeeAllocationPercent || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Maintenance Reserve */}
                  <label className="block pt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ color: C.inkMuted }}>Maintenance Reserve (Monthly)</span>
                    </div>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.maintenanceMonthly || 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'maintenanceMonthly', e.target.value)}
                        className="w-full bg-transparent py-1 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Artist Recurring Payment */}
                  <label className="block">
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ color: C.inkMuted }}>Artist Recurring Stipend / Royalty</span>
                    </div>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.artistRecurringMonthly || 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'artistRecurringMonthly', e.target.value)}
                        className="w-full bg-transparent py-1 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Travel / Bike Monthly Allocation */}
                  <label className="block">
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ color: C.inkMuted }}>Travel / Bike Monthly Allowance</span>
                    </div>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.travelMonthlyAllocation || 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'travelMonthlyAllocation', e.target.value)}
                        className="w-full bg-transparent py-1 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t flex items-center justify-between" style={{ borderColor: C.rule }}>
                <span className="text-xs font-semibold" style={{ color: C.ink }}>
                  Total Monthly Operating:
                </span>
                <span className="text-lg font-bold tabular font-mono" style={{ color: C.ink }}>
                  {money(totalMonthlyOperatingCosts)} / mo
                </span>
              </div>
            </div>

            {/* Category C: Project & Visit-Based Costs */}
            <div className="p-6 flex flex-col justify-between" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block"></span>
                  <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
                    C. Project & Visit-Based Costs
                  </span>
                </div>
                <h3 className="font-semibold text-base" style={{ color: C.ink }}>
                  On-Demand Delivery & Cycles
                </h3>
                <p className="text-xs mt-0.5 mb-4" style={{ color: C.inkMuted }}>
                  Paid on-demand only when work is performed. Never spread across every month.
                </p>

                <div className="space-y-3 text-xs">
                  {/* Curator Project Fee */}
                  <div className="p-2.5 rounded" style={{ backgroundColor: C.paperDark }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium" style={{ color: C.ink }}>
                        Curator Fee ({curator.cycles || 1} visit/cycle)
                      </span>
                      <span className="font-mono font-semibold" style={{ color: C.rust }}>
                        {money(curator.totalCuratorCost)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Fee / Visit:</span>
                        <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                          <span className="text-[10px] font-mono mr-0.5 text-stone-400">{symbol}</span>
                          <input
                            type="number"
                            step="any"
                            value={currentPlan.curator?.feePerCycle || 2000}
                            onChange={(e) => onUpdatePlanNested(currentPlanId, 'curator', 'feePerCycle', e.target.value)}
                            className="w-full bg-transparent py-0.5 outline-none font-mono text-xs"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Visits / Cycles:</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={currentPlan.curator?.cycles || 1}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'curator', 'cycles', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                    </div>
                    <div className="text-[10px] mt-1 text-stone-500 italic">
                      Workload basis: {currentPlan.spaceSqFt} sq ft space • {currentEconomics.artworkCount} artworks
                    </div>
                  </div>

                  {/* Installation Team */}
                  <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                    <span style={{ color: C.inkMuted }}>Installation Team ({installation.cycles || 1} cycle):</span>
                    <span className="font-mono font-medium">{money(installation.total)}</span>
                  </div>

                  {/* Project Logistics */}
                  <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                    <span style={{ color: C.inkMuted }}>Project Logistics & Handling:</span>
                    <span className="font-mono font-medium">{money(logistics.total)}</span>
                  </div>

                  {/* Project Travel / Site Visits */}
                  <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: C.rule }}>
                    <span style={{ color: C.inkMuted }}>Project Site Travel & Mileage:</span>
                    <span className="font-mono font-medium">{money(projectTravel.total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t flex items-center justify-between" style={{ borderColor: C.rule }}>
                <span className="text-xs font-semibold" style={{ color: C.ink }}>
                  Total Project Delivery Cost:
                </span>
                <span className="text-lg font-bold tabular font-mono" style={{ color: C.ink }}>
                  {money(totalProjectVisitCosts)}
                </span>
              </div>
            </div>
          </div>

          {/* 7. Duration Scenario Matrix (3, 6, 12, 24 Months) */}
          <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: C.rule }}>
              <div>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
                  {currentPlan.name} Plan: Multi-Duration Scenario Projections
                </h3>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  Projections across 3, 6, 12, and 24-month subscription terms comparing cumulative revenue, recurring operating expenses, total contribution, and investment recovery.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 780 }}>
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                    <th className="py-3 px-4 font-medium">Duration</th>
                    <th className="py-3 px-4 font-medium text-right">Monthly Revenue</th>
                    <th className="py-3 px-4 font-medium text-right">Total Revenue</th>
                    <th className="py-3 px-4 font-medium text-right">Total Operating Costs</th>
                    <th className="py-3 px-4 font-medium text-right">Total Contribution</th>
                    <th className="py-3 px-4 font-medium text-right">Artwork Investment</th>
                    <th className="py-3 px-4 font-medium text-right">Contribution After Investment</th>
                    <th className="py-3 px-4 font-medium text-center">Recovered?</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((sc) => (
                    <tr
                      key={sc.months}
                      className="text-sm transition-colors hover:bg-stone-50/60"
                      style={{ borderBottom: `1px solid ${C.rule}` }}
                    >
                      {/* Duration */}
                      <td className="py-3.5 px-4 font-medium" style={{ color: C.ink }}>
                        {sc.durationLabel}
                      </td>

                      {/* Monthly Revenue */}
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {money(sc.monthlyRevenue)}
                      </td>

                      {/* Total Revenue */}
                      <td className="py-3.5 px-4 text-right tabular font-mono font-medium">
                        {money(sc.totalRevenue)}
                      </td>

                      {/* Total Operating Costs */}
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {money(sc.operatingCostsTotal)}
                      </td>

                      {/* Total Contribution */}
                      <td
                        className="py-3.5 px-4 text-right tabular font-mono font-medium"
                        style={{ color: sc.totalContribution >= 0 ? C.ink : '#DC2626' }}
                      >
                        {money(sc.totalContribution)}
                      </td>

                      {/* Artwork Investment */}
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {money(sc.initialInvestment)}
                      </td>

                      {/* Contribution After Initial Investment */}
                      <td className="py-3.5 px-4 text-right tabular font-mono font-semibold">
                        <span style={{ color: sc.contributionAfterInvestment >= 0 ? C.rust : '#DC2626' }}>
                          {money(sc.contributionAfterInvestment)}
                        </span>
                      </td>

                      {/* Recovered Status */}
                      <td className="py-3.5 px-4 text-center">
                        {sc.isRecovered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                            <CheckCircle2 size={12} /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded">
                            Not Yet
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 8. Save Subscription Proposal Snapshot */}
          <div className="p-6 border" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.inkMuted }}>
              Save Subscription Plan Snapshot
            </h3>
            <p className="text-xs mb-4" style={{ color: C.inkMuted }}>
              Save this complete plan justification including artwork investment, monthly subscription, allocated staff costs, curator scope, and recovery scenarios.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
                placeholder={`e.g. ${currentPlan.name} Proposal for ${curationContext.clientName || 'Client'} (₹${monthlySubscription}/mo)`}
                className="flex-1 min-w-[240px] bg-transparent border-b py-2 text-sm outline-none"
                style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
              />
              <button
                type="button"
                onClick={handleSave}
                className="py-2 px-4 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: C.rust,
                  color: '#fff',
                }}
              >
                <Bookmark size={13} /> Save Plan Snapshot
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
