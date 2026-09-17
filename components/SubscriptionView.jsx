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
  TrendingUp,
  RefreshCw,
  Box,
  MapPin,
  Building2,
  PieChart,
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
  portfolioClients = {},
  onUpdatePortfolioClientCount,
  portfolioSustainability = {},
  onAddCustomPlan,
  onDeleteCustomPlan,
  settings = {},
  onSaveSnapshot,
  onNavigateToCurate,
  onNavigateToBatch,
  onNavigateToPerformance,
  // Backward compatibility props
  subscriptionState,
  onUpdateSubscription,
}) {
  const [showCompanyCosts, setShowCompanyCosts] = useState(false);
  const [viewMode, setViewMode] = useState('plan'); // 'plan' | 'compare' | 'portfolio'
  const [snapshotTitle, setSnapshotTitle] = useState('');

  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  // Active plan & evaluated economics
  const currentPlanId = activePlanId || 'professional';
  const currentPlan = plans[currentPlanId] || plans.professional || Object.values(plans)[0] || {};
  const currentEconomics =
    plansEconomics[currentPlanId] ||
    plansEconomics.professional ||
    Object.values(plansEconomics)[0] || {
      initialInvestment: 0,
      monthlySubscription: 0,
      monthlyContributionBeforeOverhead: 0,
      monthlyContribution: 0,
      totalMonthlyClientDeliveryCost: 0,
      totalMonthlyOperatingCosts: 0,
      simpleRecoveryMonths: null,
      estimatedRecoveryMonths: null,
      clientContributionRecoveryMonths: null,
      isRecoveryAchievable: false,
      unachievableReason: null,
      scenarios: [],
      curator: { totalCuratorCost: 0, feePerCycle: 2000, cycles: 1 },
      installation: { total: 0, feePerCycle: 1500, cycles: 1 },
      rotation: { total: 0, feePerCycle: 1000, cycles: 1 },
      logistics: { total: 0, feePerCycle: 1200, cycles: 1 },
      packaging: { total: 0, feePerCycle: 400, cycles: 1 },
      projectTravel: { total: 0, feePerCycle: 600, cycles: 1 },
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
    initialInvestment = 0,
    monthlySubscription = 0,
    monthlyContributionBeforeOverhead = 0,
    monthlyContribution = 0,
    totalMonthlyClientDeliveryCost = 0,
    maintenanceMonthly = 0,
    artistRecurringMonthly = 0,
    artistRentMonthly = 0,
    manpowerMonthly = 0,
    travelMonthlyAllocation = 0,
    packagingMonthly = 0,
    companyOverheadMonthly = 0,
    allocatedEmployeeSalary = 0,
    totalCompanyOverheadAllocation = 0,
    totalMonthlyOperatingCosts = 0,
    simpleRecoveryMonths = null,
    estimatedRecoveryMonths = null,
    clientContributionRecoveryMonths = null,
    isRecoveryAchievable = false,
    unachievableReason = null,
    scenarios = [],
    curator = { feePerCycle: 2000, cycles: 1, totalCuratorCost: 2000, type: 'remote' },
    installation = { feePerCycle: 1500, cycles: 1, total: 1500 },
    rotation = { feePerCycle: 1000, cycles: 1, total: 1000 },
    logistics = { feePerCycle: 1200, cycles: 1, total: 1200 },
    packaging = { feePerCycle: 400, cycles: 1, total: 400 },
    projectTravel = { feePerCycle: 600, cycles: 1, total: 600 },
    totalProjectVisitCosts = 0,
    artworkRecovery = {},
    targetRecoveryValue = 0,
    recoveryMarkupPercent = 60,
    recoveryTargetReachedMonth = null,
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
      {/* 1. Plan Switcher & Mode Navigation Bar */}
      <div
        className="p-4 flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundColor: C.paperDark,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wider font-semibold mr-1" style={{ color: C.inkMuted }}>
            Independent Plans:
          </span>

          {Object.keys(plans).map((planKey) => {
            const p = plans[planKey] || {};
            const isSelected = currentPlanId === planKey && viewMode === 'plan';
            const isCore = ['essential', 'professional', 'enterprise', 'signature'].includes(planKey);

            return (
              <div key={planKey} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('plan');
                    if (onChangeActivePlanId) onChangeActivePlanId(planKey);
                  }}
                  className="px-3 py-1.5 text-xs rounded font-medium transition-colors flex items-center gap-1.5"
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
                      Bespoke
                    </span>
                  )}
                  {p.isCustom && !isCore && (
                    <span
                      className="text-[10px] px-1 rounded uppercase font-mono"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : C.paperDark,
                        color: isSelected ? C.paper : '#2563EB',
                      }}
                    >
                      Custom
                    </span>
                  )}
                </button>
                {!isCore && onDeleteCustomPlan && (
                  <button
                    type="button"
                    title={`Delete ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomPlan(planKey);
                    }}
                    className="ml-0.5 p-1 text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}

          {/* + Add Custom Plan button */}
          {onAddCustomPlan && (
            <button
              type="button"
              onClick={() => {
                const name = typeof window !== 'undefined' && window.prompt
                  ? window.prompt('Enter Custom Plan Name:', 'Custom Plan')
                  : 'Custom Plan';
                if (name && name.trim()) {
                  const newId = onAddCustomPlan(name.trim());
                  setViewMode('plan');
                  if (onChangeActivePlanId) onChangeActivePlanId(newId);
                }
              }}
              className="px-2.5 py-1.5 text-xs rounded transition-colors flex items-center gap-1 text-stone-700 hover:text-stone-900 border border-dashed border-stone-400 hover:border-stone-700"
              style={{ backgroundColor: C.paper }}
            >
              <Plus size={12} />
              <span>Custom Plan</span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-stone-300 mx-1"></div>

          {/* View Toggles */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'compare' ? 'plan' : 'compare')}
            className="px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 font-medium"
            style={{
              backgroundColor: viewMode === 'compare' ? C.ink : 'transparent',
              color: viewMode === 'compare' ? C.paper : C.inkMuted,
              border: `1px solid ${viewMode === 'compare' ? C.ink : C.rule}`,
            }}
          >
            <BarChart3 size={13} />
            <span>Compare Plans</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'portfolio' ? 'plan' : 'portfolio')}
            className="px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 font-medium"
            style={{
              backgroundColor: viewMode === 'portfolio' ? C.rust : 'transparent',
              color: viewMode === 'portfolio' ? '#fff' : C.inkMuted,
              border: `1px solid ${viewMode === 'portfolio' ? C.rust : C.rule}`,
            }}
          >
            <TrendingUp size={13} />
            <span>Portfolio Mix &amp; Breakeven</span>
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
            <span>Company Salaries &amp; Travel</span>
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
                Company-level recurring expenses. The employee salary pool is shared across the company — individual plans receive an explicit editable allocation rather than charging 100% of staff costs to one client.
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
                  <strong>Business Principle:</strong> The ₹3,00,000 monthly total is the company employee pool. When evaluating an individual subscription plan, only its assigned allocation (editable % or fixed amount) is attributed to that plan.
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

      {/* 3. VIEW MODE: SIDE-BY-SIDE COMPARISON MATRIX */}
      {viewMode === 'compare' && (
        <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: C.rule }}>
            <div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.2rem', fontWeight: 600, color: C.ink }}>
                Side-by-Side Economics Comparison (All Independently Configured Plans)
              </h2>
              <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                Compare monthly subscription fees, artwork investments, employee allocations, operating costs, and investment recovery across all plans. Plans are commercial frameworks and are not ranked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('plan')}
              className="text-xs px-3 py-1.5 font-medium border"
              style={{ borderColor: C.rule, backgroundColor: C.paperDark, color: C.ink }}
            >
              Back to Active Plan View
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" style={{ minWidth: 920 }}>
              <thead>
                <tr className="uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                  <th className="py-3 px-4 font-medium">Plan &amp; Scope</th>
                  <th className="py-3 px-4 font-medium text-right">Monthly Fee</th>
                  <th className="py-3 px-4 font-medium text-right">Monthly Delivery Cost</th>
                  <th className="py-3 px-4 font-medium text-right">Client Contribution</th>
                  <th className="py-3 px-4 font-medium text-right">Staff Allocation</th>
                  <th className="py-3 px-4 font-medium text-right">Contribution After Overhead</th>
                  <th className="py-3 px-4 font-medium text-right">Artwork Investment</th>
                  <th className="py-3 px-4 font-medium text-center">Recovery</th>
                  <th className="py-3 px-4 font-medium text-right">12-Mo Net</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(plans).map((pKey) => {
                  const pData = plans[pKey] || {};
                  const pEcon = plansEconomics[pKey] || {};
                  const sc12 = (pEcon.scenarios || []).find((s) => s.months === 12);

                  return (
                    <tr
                      key={pKey}
                      className="transition-colors hover:bg-stone-50 cursor-pointer"
                      onClick={() => {
                        if (onChangeActivePlanId) onChangeActivePlanId(pKey);
                        setViewMode('plan');
                      }}
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
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {money(pEcon.totalMonthlyClientDeliveryCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono font-semibold" style={{ color: pEcon.monthlyContributionBeforeOverhead > 0 ? C.ink : '#DC2626' }}>
                        {money(pEcon.monthlyContributionBeforeOverhead)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {money(pEcon.allocatedEmployeeSalary)} ({pData.employeeAllocationPercent || 0}%)
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono font-semibold" style={{ color: pEcon.monthlyContribution > 0 ? C.ink : '#DC2626' }}>
                        {money(pEcon.monthlyContribution)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular font-mono text-xs" style={{ color: C.rust }}>
                        {money(pEcon.initialInvestment)}
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
      )}

      {/* 4. VIEW MODE: COMPANY SUSTAINABILITY & PORTFOLIO MIX */}
      {viewMode === 'portfolio' && (
        <div className="space-y-6">
          <div className="p-6" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
            <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b mb-4" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} style={{ color: C.rust }} />
                  <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600, color: C.ink }}>
                    ARTNCE Company Sustainability &amp; Client Portfolio Model
                  </h2>
                </div>
                <p className="text-xs mt-1" style={{ color: C.inkMuted }}>
                  Model combinations of active clients across Essential, Professional, Enterprise, Signature, and Custom plans to evaluate portfolio revenue, aggregate client delivery costs, company pool coverage, and breakeven active clients.
                </p>
              </div>

              {/* Preset Client Mixes */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-stone-500 font-medium">Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdatePortfolioClientCount) {
                      onUpdatePortfolioClientCount('essential', 20);
                      onUpdatePortfolioClientCount('professional', 10);
                      onUpdatePortfolioClientCount('enterprise', 5);
                      onUpdatePortfolioClientCount('signature', 2);
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded border font-mono transition-colors"
                  style={{ backgroundColor: C.paper, borderColor: C.rule, color: C.ink }}
                >
                  Balanced (20/10/5/2)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdatePortfolioClientCount) {
                      onUpdatePortfolioClientCount('essential', 5);
                      onUpdatePortfolioClientCount('professional', 15);
                      onUpdatePortfolioClientCount('enterprise', 10);
                      onUpdatePortfolioClientCount('signature', 3);
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded border font-mono transition-colors"
                  style={{ backgroundColor: C.paper, borderColor: C.rule, color: C.ink }}
                >
                  Enterprise Heavy (5/15/10/3)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdatePortfolioClientCount) {
                      onUpdatePortfolioClientCount('essential', 35);
                      onUpdatePortfolioClientCount('professional', 10);
                      onUpdatePortfolioClientCount('enterprise', 2);
                      onUpdatePortfolioClientCount('signature', 1);
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded border font-mono transition-colors"
                  style={{ backgroundColor: C.paper, borderColor: C.rule, color: C.ink }}
                >
                  High Volume (35/10/2/1)
                </button>
              </div>
            </div>

            {/* Portfolio Summary KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-3 rounded" style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}>
                <div className="text-[11px]" style={{ color: C.inkMuted }}>Total Active Clients</div>
                <div className="tabular mt-1 text-2xl font-bold font-mono" style={{ color: C.ink }}>
                  {portfolioSustainability.totalActiveClients || 0}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Commercial accounts</div>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}>
                <div className="text-[11px]" style={{ color: C.inkMuted }}>Total Monthly Revenue</div>
                <div className="tabular mt-1 text-2xl font-bold font-mono" style={{ color: C.ink }}>
                  {money(portfolioSustainability.totalMonthlySubscriptionRevenue || 0)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Portfolio subscriptions</div>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}>
                <div className="text-[11px]" style={{ color: C.inkMuted }}>Client Delivery Costs</div>
                <div className="tabular mt-1 text-2xl font-bold font-mono" style={{ color: C.inkMuted }}>
                  {money(portfolioSustainability.totalMonthlyClientDeliveryCosts || 0)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Direct monthly delivery</div>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}>
                <div className="text-[11px]" style={{ color: C.inkMuted }}>Client Contribution</div>
                <div className="tabular mt-1 text-2xl font-bold font-mono" style={{ color: C.ink }}>
                  {money(portfolioSustainability.totalMonthlyClientContributionBeforeOverhead || 0)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Before company pool</div>
              </div>

              <div className="p-3 rounded" style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}>
                <div className="text-[11px]" style={{ color: C.inkMuted }}>Company Recurring Pool</div>
                <div className="tabular mt-1 text-2xl font-bold font-mono" style={{ color: C.rust }}>
                  {money(portfolioSustainability.companyRecurringCost || 306000)}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">3 Staff + Bike Allowance</div>
              </div>

              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: portfolioSustainability.isSustainable ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${portfolioSustainability.isSustainable ? '#A7F3D0' : '#FECACA'}`,
                }}
              >
                <div className="text-[11px] font-medium" style={{ color: portfolioSustainability.isSustainable ? '#065F46' : '#991B1B' }}>
                  Portfolio Net Contribution
                </div>
                <div
                  className="tabular mt-1 text-2xl font-bold font-mono"
                  style={{ color: portfolioSustainability.isSustainable ? '#047857' : '#DC2626' }}
                >
                  {money(portfolioSustainability.portfolioContributionAfterCompanyRecurringCosts || 0)}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: portfolioSustainability.isSustainable ? '#065F46' : '#991B1B' }}>
                  {portfolioSustainability.isSustainable ? '✓ Fully Sustainable' : 'Overhead Deficit'}
                </div>
              </div>
            </div>

            {/* Breakeven Active Clients Reference Banner */}
            <div className="mt-4 p-3 rounded bg-stone-100 border border-stone-200 text-xs flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-stone-700" />
                <span className="text-stone-700">
                  <strong>Portfolio Breakeven Threshold:</strong> With this client mix (avg contribution of <strong>{money(portfolioSustainability.avgContributionPerClient)}/client</strong>), ARTNCE requires <strong>{portfolioSustainability.portfolioBreakevenClients ?? '—'} active clients</strong> to completely cover the ₹3,06,000 monthly company staff and vehicle pool.
                </span>
              </div>
              <span className="font-mono text-stone-500 text-[11px]">
                Currently Active: {portfolioSustainability.totalActiveClients} / {portfolioSustainability.portfolioBreakevenClients ?? '—'} ({portfolioSustainability.totalActiveClients >= (portfolioSustainability.portfolioBreakevenClients || 0) ? 'Breakeven Achieved' : `${(portfolioSustainability.portfolioBreakevenClients || 0) - portfolioSustainability.totalActiveClients} more needed`})
              </span>
            </div>
          </div>

          {/* Interactive Client Mix Table */}
          <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: C.rule }}>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.1rem', fontWeight: 600, color: C.ink }}>
                Client Distribution by Plan &amp; Standalone Breakeven
              </h3>
              <span className="text-xs text-stone-500">
                Edit client counts in each row to instantly recalculate portfolio sustainability.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" style={{ minWidth: 840 }}>
                <thead>
                  <tr className="uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                    <th className="py-3 px-4 font-medium">Plan Framework</th>
                    <th className="py-3 px-4 font-medium text-center" style={{ width: '130px' }}>Active Clients</th>
                    <th className="py-3 px-4 font-medium text-right">Fee / Client</th>
                    <th className="py-3 px-4 font-medium text-right">Monthly Delivery Cost</th>
                    <th className="py-3 px-4 font-medium text-right">Contribution / Client</th>
                    <th className="py-3 px-4 font-medium text-right">Total Revenue</th>
                    <th className="py-3 px-4 font-medium text-right">Total Plan Contribution</th>
                    <th className="py-3 px-4 font-medium text-center">Standalone Breakeven</th>
                  </tr>
                </thead>
                <tbody>
                  {(portfolioSustainability.breakdown || []).map((row) => (
                    <tr key={row.planId} style={{ borderBottom: `1px solid ${C.rule}` }}>
                      <td className="py-3.5 px-4 font-semibold text-sm" style={{ color: C.ink }}>
                        {row.planName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={portfolioClients[row.planId] ?? row.clientCount ?? 0}
                          onChange={(e) => onUpdatePortfolioClientCount && onUpdatePortfolioClientCount(row.planId, e.target.value)}
                          className="w-20 text-center font-mono font-bold text-sm py-1 border rounded outline-none"
                          style={{ borderColor: C.ink, backgroundColor: C.paperDark, color: C.ink }}
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular font-medium">
                        {money(row.monthlySubscription)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular text-stone-500">
                        {money(row.totalMonthlyClientDeliveryCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular font-semibold" style={{ color: row.monthlyContributionBeforeOverhead > 0 ? C.ink : '#DC2626' }}>
                        {money(row.monthlyContributionBeforeOverhead)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular font-medium">
                        {money(row.revenueTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular font-bold" style={{ color: row.contributionBeforeOverheadTotal > 0 ? C.rust : '#DC2626' }}>
                        {money(row.contributionBeforeOverheadTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.singlePlanBreakevenClients ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                            {row.singlePlanBreakevenClients} clients alone
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW MODE: ACTIVE PLAN DETAILED ECONOMICS & WHITEBOARD MODEL */}
      {viewMode === 'plan' && (
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
                    Independently Configured (Zero Cross-Contamination)
                  </span>
                </div>
                <h2 className="mt-1 font-semibold text-lg" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                  {currentPlan.name}: {currentPlan.tagline}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  A subscription plan is a commercial framework. Changing values in this plan will NEVER modify any other plan.
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
                <div className="text-xs" style={{ color: C.inkMuted }}>Client Direct Delivery Cost</div>
                <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.inkMuted }}>
                  {money(totalMonthlyClientDeliveryCost)} <span className="text-xs font-normal">/ mo</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Direct monthly maintenance &amp; delivery
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: C.inkMuted }}>Client Contribution</div>
                <div
                  className="tabular mt-1 text-2xl font-semibold"
                  style={{ fontFamily: FONT_MONO, color: monthlyContributionBeforeOverhead > 0 ? C.ink : '#DC2626' }}
                >
                  {money(monthlyContributionBeforeOverhead)} <span className="text-xs font-normal">/ mo</span>
                </div>
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Revenue − Client Delivery Costs
                </div>
              </div>
            </div>
          </div>

          {/* WHITEBOARD MODEL FOR THIS PLAN */}
          <div className="p-6" style={{ backgroundColor: C.paper, border: `2px solid ${C.ink}` }}>
            <div className="flex items-center justify-between pb-3 border-b mb-4 flex-wrap gap-2" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.2rem', fontWeight: 700, color: C.ink }}>
                    Whiteboard Commercial Model ({currentPlan.name} Plan)
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  Two-tier contribution calculation. Client Contribution measures commercial revenue after direct delivery; Contribution After Overhead allocates company expenses. Do not call this profit.
                </p>
              </div>
              <div className="text-right font-mono text-xs text-stone-500">
                Plan Framework: <strong>{currentPlan.name}</strong>
              </div>
            </div>

            {/* Waterfall Breakdown */}
            <div className="space-y-3 font-mono text-sm">
              {/* Step 1: Subscription Revenue */}
              <div className="p-3 bg-stone-50 rounded flex items-center justify-between border" style={{ borderColor: C.rule }}>
                <div>
                  <span className="font-semibold text-stone-900">Monthly Subscription Revenue</span>
                  <div className="text-[11px] text-stone-500 font-sans">Monthly payment from client</div>
                </div>
                <span className="text-lg font-bold text-stone-900 tabular">
                  + {money(monthlySubscription)}
                </span>
              </div>

              {/* Step 2: Direct Client Delivery Costs Sub-list */}
              <div className="p-3 bg-stone-50/50 rounded border text-xs" style={{ borderColor: C.rule }}>
                <div className="font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Less Direct Monthly Service Delivery Costs:
                </div>
                <div className="space-y-1.5 pl-3 border-l-2 border-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Maintenance Reserve:</span>
                    <span className="tabular font-medium text-stone-800">- {money(maintenanceMonthly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Artist Recurring Stipend / Remuneration:</span>
                    <span className="tabular font-medium text-stone-800">- {money(artistRecurringMonthly)}</span>
                  </div>
                  {Number(artistRentMonthly) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-stone-600">Artist Rent / Studio Lease:</span>
                      <span className="tabular font-medium text-stone-800">- {money(artistRentMonthly)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-600">Manpower Allocation:</span>
                    <span className="tabular font-medium text-stone-800">- {money(manpowerMonthly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Travel / Petrol Allocation:</span>
                    <span className="tabular font-medium text-stone-800">- {money(travelMonthlyAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Packaging (Monthly direct):</span>
                    <span className="tabular font-medium text-stone-800">- {money(packagingMonthly)}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between font-semibold text-stone-800" style={{ borderColor: C.rule }}>
                  <span>Total Direct Delivery Cost:</span>
                  <span className="tabular">- {money(totalMonthlyClientDeliveryCost)}</span>
                </div>
              </div>

              {/* Level 1: Client Contribution */}
              <div
                className="p-3.5 rounded flex items-center justify-between border-2"
                style={{
                  backgroundColor: monthlyContributionBeforeOverhead >= 0 ? '#F0FDF4' : '#FEF2F2',
                  borderColor: monthlyContributionBeforeOverhead >= 0 ? '#86EFAC' : '#FCA5A5',
                }}
              >
                <div>
                  <span className="font-bold text-sm" style={{ color: monthlyContributionBeforeOverhead >= 0 ? '#166534' : '#991B1B' }}>
                    = LEVEL 1: CLIENT CONTRIBUTION (Before Company Overhead)
                  </span>
                  <div className="text-[11px] font-sans text-stone-600">Subscription Revenue − Direct Delivery Costs</div>
                </div>
                <span
                  className="text-xl font-bold tabular"
                  style={{ color: monthlyContributionBeforeOverhead >= 0 ? '#15803D' : '#DC2626' }}
                >
                  {money(monthlyContributionBeforeOverhead)} / mo
                </span>
              </div>

              {/* Step 3: Company Overhead Allocation Sub-list */}
              <div className="p-3 bg-stone-50/50 rounded border text-xs" style={{ borderColor: C.rule }}>
                <div className="font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Less Applicable Company Overhead Allocation:
                </div>
                <div className="space-y-1.5 pl-3 border-l-2 border-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-600">
                      Staff Salary Allocation ({currentPlan.employeeAllocationPercent || 0}% of ₹3L pool):
                    </span>
                    <span className="tabular font-medium text-stone-800">- {money(allocatedEmployeeSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Other Company Overhead Allocation:</span>
                    <span className="tabular font-medium text-stone-800">- {money(companyOverheadMonthly)}</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between font-semibold text-stone-800" style={{ borderColor: C.rule }}>
                  <span>Total Overhead Allocated:</span>
                  <span className="tabular">- {money(totalCompanyOverheadAllocation)}</span>
                </div>
              </div>

              {/* Level 2: Contribution After Company Overhead */}
              <div
                className="p-4 rounded flex items-center justify-between text-white"
                style={{ backgroundColor: monthlyContribution >= 0 ? C.ink : '#991B1B' }}
              >
                <div>
                  <span className="font-bold text-sm uppercase tracking-wide">
                    = LEVEL 2: CONTRIBUTION AFTER COMPANY OVERHEAD ALLOCATION
                  </span>
                  <div className="text-[11px] font-sans text-stone-300">
                    Client Contribution − Applicable Company Overhead Allocation (Do not call this profit)
                  </div>
                </div>
                <span className="text-2xl font-bold tabular">
                  {money(monthlyContribution)} / mo
                </span>
              </div>
            </div>
          </div>

          {/* Real Artwork Scope & Selection Manager */}
          <div className="p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
            <div className="flex items-center justify-between pb-3 border-b mb-5 flex-wrap gap-3" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center gap-2">
                  <Layers size={16} style={{ color: C.rust }} />
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
                    Artwork Scope &amp; Selection ({currentPlan.name} Plan)
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
                  Select or remove individual artworks for this {currentPlan.name} client. Selected artworks determine the plan&apos;s artwork count, area, and initial artwork investment.
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
                    <span className="text-[10px] text-stone-400 mt-1 block">Production, stretching &amp; framing</span>
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
              </div>
            )}
          </div>

          {/* Monthly Subscription Input & Core Recovery Analysis Cards */}
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
                Enter proposed monthly fee for this client proposal. Subscription pricing does not alter artwork production cost.
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
            </div>

            {/* Right: Recovery Analysis Cards */}
            <div className="lg:col-span-6 space-y-4">
              {/* Card A: Simple Artwork Investment Recovery */}
              <div className="p-5" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
                      Simple Artwork Payback
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                      Initial Outlay ÷ Monthly Subscription Revenue
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    Gross Top-line
                  </span>
                </div>

                <div className="mt-3">
                  {simpleRecoveryMonths !== null ? (
                    <div className="flex items-baseline gap-3">
                      <div className="text-2xl font-semibold tabular font-mono" style={{ color: C.rust }}>
                        {Math.ceil(simpleRecoveryMonths)} {Math.ceil(simpleRecoveryMonths) === 1 ? 'Month' : 'Months'}
                      </div>
                      <div className="text-xs tabular font-mono" style={{ color: C.inkMuted }}>
                        ({fmtNum(simpleRecoveryMonths, 1)} months exact)
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-medium text-stone-500">
                      {initialInvestment === 0
                        ? 'Add artworks to calculate investment recovery.'
                        : 'Enter a monthly subscription price.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Card B: Estimated Recovery After Operating Costs */}
              <div className="p-5" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paperDark }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.ink }}>
                      Operating Payback (Net Contribution)
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                      Initial Outlay ÷ Monthly Contribution (after delivery &amp; overhead)
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                    Net Operating
                  </span>
                </div>

                <div className="mt-3">
                  {isRecoveryAchievable && estimatedRecoveryMonths !== null ? (
                    <div className="flex items-baseline gap-3">
                      <div className="text-2xl font-semibold tabular font-mono" style={{ color: C.ink }}>
                        {Math.ceil(estimatedRecoveryMonths)} {Math.ceil(estimatedRecoveryMonths) === 1 ? 'Month' : 'Months'}
                      </div>
                      <div className="text-xs tabular font-mono" style={{ color: C.inkMuted }}>
                        ({fmtNum(estimatedRecoveryMonths, 1)} months exact)
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 rounded text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle size={13} className="text-red-700 shrink-0" />
                        <span>
                          {unachievableReason ||
                            'Operating recovery is not achievable at current fee and cost structure.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card C: 60% Markup Target Recovery Card */}
              <div
                className="p-5 rounded border"
                style={{
                  backgroundColor: '#FAF8F5',
                  borderColor: C.rust,
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold" style={{ color: C.rust }}>
                      Asset Recovery Target ({recoveryMarkupPercent || 60}% Target Markup)
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                      Initial Investment + {recoveryMarkupPercent || 60}% asset recovery markup value
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#B8452D]/10 text-[#B8452D]">
                    Asset Recovery Model
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t text-xs font-mono" style={{ borderColor: 'rgba(184,69,45,0.2)' }}>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-sans">Initial Outlay</span>
                    <span className="font-bold text-stone-900">{money(initialInvestment)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-sans">+{recoveryMarkupPercent || 60}% Markup</span>
                    <span className="font-bold text-amber-900">
                      +{money(artworkRecovery?.markupAmount ?? (initialInvestment * 0.6))}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-sans">Target Recovery</span>
                    <span className="font-bold text-lg text-[#B8452D]">
                      {money(targetRecoveryValue || (initialInvestment * 1.6))}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone-500 font-sans">Target Reached</span>
                    <span className="font-bold text-emerald-800">
                      {recoveryTargetReachedMonth ? `Month ${recoveryTargetReachedMonth}` : '—'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'rgba(184,69,45,0.15)' }}>
                  <span className="text-stone-600">
                    Recovery markup is isolated from operational gross margin and direct delivery.
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <span className="text-stone-500">Target %:</span>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={currentPlan.recoveryMarkupPercent ?? 60}
                      onChange={(e) => onUpdatePlan(currentPlanId, 'recoveryMarkupPercent', e.target.value)}
                      className="w-12 text-right bg-white border px-1 py-0.5 rounded font-bold outline-none"
                      style={{ borderColor: C.rule }}
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Tier Independent Cost Classification Breakdown */}
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
                  Production &amp; Framing Outlay
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
                    B. Monthly Direct Delivery &amp; Overhead
                  </span>
                </div>
                <h3 className="font-semibold text-base" style={{ color: C.ink }}>
                  Monthly Economics Inputs
                </h3>
                <p className="text-xs mt-0.5 mb-4" style={{ color: C.inkMuted }}>
                  Every value is independently editable for this plan.
                </p>

                <div className="space-y-3 text-xs">
                  {/* Maintenance Reserve */}
                  <label className="block">
                    <span className="block text-[11px] mb-0.5" style={{ color: C.inkMuted }}>Maintenance Reserve (Monthly)</span>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.maintenanceMonthly ?? 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'maintenanceMonthly', e.target.value)}
                        className="w-full bg-transparent py-0.5 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Artist Recurring Payment */}
                  <label className="block">
                    <span className="block text-[11px] mb-0.5" style={{ color: C.inkMuted }}>Artist / Painting Recurring Allocation</span>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.artistRecurringMonthly ?? 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'artistRecurringMonthly', e.target.value)}
                        className="w-full bg-transparent py-0.5 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Artist Rent Input */}
                  <label className="block">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="block text-[11px]" style={{ color: C.inkMuted }}>
                        Artist Rent (Separate from Stipend)
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">Studio / Storage Lease</span>
                    </div>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.artistRentMonthly ?? 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'artistRentMonthly', e.target.value)}
                        className="w-full bg-transparent py-0.5 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Manpower Allocation */}
                  <label className="block">
                    <span className="block text-[11px] mb-0.5" style={{ color: C.inkMuted }}>Manpower Monthly Allocation</span>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.manpowerMonthly ?? 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'manpowerMonthly', e.target.value)}
                        className="w-full bg-transparent py-0.5 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Travel / Bike Monthly Allocation */}
                  <label className="block">
                    <span className="block text-[11px] mb-0.5" style={{ color: C.inkMuted }}>Travel / Bike Monthly Allowance</span>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.travelMonthlyAllocation ?? 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'travelMonthlyAllocation', e.target.value)}
                        className="w-full bg-transparent py-0.5 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Packaging Monthly */}
                  <label className="block">
                    <span className="block text-[11px] mb-0.5" style={{ color: C.inkMuted }}>Packaging Monthly Delivery Allocation</span>
                    <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                      <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                      <input
                        type="number"
                        step="any"
                        value={currentPlan.packagingMonthly ?? 0}
                        onChange={(e) => onUpdatePlan(currentPlanId, 'packagingMonthly', e.target.value)}
                        className="w-full bg-transparent py-0.5 outline-none tabular font-mono"
                        style={{ color: C.ink }}
                      />
                    </div>
                  </label>

                  {/* Employee Staff Pool Allocation */}
                  <div className="pt-2 border-t" style={{ borderColor: C.rule }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: C.inkMuted }}>
                        Staff Salary Allocation ({currentPlan.employeeAllocationPercent || 0}% of ₹3L)
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
                    C. Project &amp; Cycle Costs
                  </span>
                </div>
                <h3 className="font-semibold text-base" style={{ color: C.ink }}>
                  On-Demand Delivery &amp; Cycles
                </h3>
                <p className="text-xs mt-0.5 mb-4" style={{ color: C.inkMuted }}>
                  Paid on-demand only when work is performed. Never spread into regular monthly costs.
                </p>

                <div className="space-y-3 text-xs">
                  {/* Curator Project Fee */}
                  <div className="p-2.5 rounded" style={{ backgroundColor: C.paperDark }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800">Curator Visit</span>
                      <span className="font-mono font-semibold" style={{ color: C.rust }}>
                        {money(curator.totalCuratorCost)}
                      </span>
                    </div>
                    {/* Remote vs Physical selector */}
                    <div className="flex items-center gap-1 my-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdatePlanNested(currentPlanId, 'curator', 'type', 'remote')}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                          (currentPlan.curator?.type || 'remote') === 'remote'
                            ? 'bg-stone-900 text-white font-bold'
                            : 'bg-stone-200/70 text-stone-700'
                        }`}
                      >
                        Remote Curation
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdatePlanNested(currentPlanId, 'curator', 'type', 'physical')}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                          currentPlan.curator?.type === 'physical'
                            ? 'bg-[#B8452D] text-white font-bold'
                            : 'bg-stone-200/70 text-stone-700'
                        }`}
                      >
                        Physical Visit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Fee / Visit:</span>
                        <input
                          type="number"
                          step="any"
                          value={currentPlan.curator?.feePerCycle ?? 2000}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'curator', 'feePerCycle', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Cycles:</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={currentPlan.curator?.cycles ?? 1}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'curator', 'cycles', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                    </div>
                    <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                      <strong>Notice:</strong> Curation price is for ONE curation work/visit cycle — NOT a monthly charge.
                    </div>
                  </div>

                  {/* Installation Team */}
                  <div className="p-2.5 rounded" style={{ backgroundColor: C.paperDark }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800">Installation Team</span>
                      <span className="font-mono font-semibold text-stone-800">{money(installation.total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Fee / Event:</span>
                        <input
                          type="number"
                          step="any"
                          value={currentPlan.installation?.feePerCycle ?? 1500}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'installation', 'feePerCycle', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Events:</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={currentPlan.installation?.cycles ?? 1}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'installation', 'cycles', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Rotation / Recycling */}
                  <div className="p-2.5 rounded" style={{ backgroundColor: C.paperDark }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800">Rotation / Recycling</span>
                      <span className="font-mono font-semibold text-stone-800">{money(rotation.total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Fee / Rotation:</span>
                        <input
                          type="number"
                          step="any"
                          value={currentPlan.rotation?.feePerCycle ?? 1000}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'rotation', 'feePerCycle', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Rotations:</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={currentPlan.rotation?.cycles ?? 1}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'rotation', 'cycles', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Project Logistics */}
                  <div className="p-2.5 rounded" style={{ backgroundColor: C.paperDark }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800">Logistics &amp; Handling</span>
                      <span className="font-mono font-semibold text-stone-800">{money(logistics.total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Fee / Delivery:</span>
                        <input
                          type="number"
                          step="any"
                          value={currentPlan.logistics?.feePerCycle ?? 1200}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'logistics', 'feePerCycle', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Events:</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={currentPlan.logistics?.cycles ?? 1}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'logistics', 'cycles', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Packaging */}
                  <div className="p-2.5 rounded" style={{ backgroundColor: C.paperDark }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800">Crating &amp; Packaging</span>
                      <span className="font-mono font-semibold text-stone-800">{money(packaging.total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Fee / Cycle:</span>
                        <input
                          type="number"
                          step="any"
                          value={currentPlan.packaging?.feePerCycle ?? 400}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'packaging', 'feePerCycle', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Cycles:</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={currentPlan.packaging?.cycles ?? 1}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'packaging', 'cycles', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Project Travel */}
                  <div className="p-2.5 rounded" style={{ backgroundColor: C.paperDark }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800">Project Travel / Site Mileage</span>
                      <span className="font-mono font-semibold text-stone-800">{money(projectTravel.total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Fee / Visit:</span>
                        <input
                          type="number"
                          step="any"
                          value={currentPlan.projectTravel?.feePerCycle ?? 600}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'projectTravel', 'feePerCycle', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                      <label className="block">
                        <span className="text-[10px] text-stone-500">Visits:</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={currentPlan.projectTravel?.cycles ?? 1}
                          onChange={(e) => onUpdatePlanNested(currentPlanId, 'projectTravel', 'cycles', e.target.value)}
                          className="w-full bg-transparent border-b py-0.5 outline-none font-mono text-xs"
                          style={{ borderColor: C.rule }}
                        />
                      </label>
                    </div>
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

          {/* Multi-Duration Scenario Matrix (3, 6, 12, 24 Months) */}
          <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: C.rule }}>
              <div>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
                  {currentPlan.name} Plan: Multi-Duration Scenario Projections
                </h3>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  Independent scenario projections across 3, 6, 12, and 24-month terms comparing cumulative revenue, recurring operating expenses, total contribution, and investment recovery.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 960 }}>
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                    <th className="py-3 px-4 font-medium">Monthly Revenue</th>
                    <th className="py-3 px-3 font-medium">Duration</th>
                    <th className="py-3 px-3 font-medium text-right">Client Pays</th>
                    <th className="py-3 px-1 text-center font-mono font-semibold text-stone-400 text-sm select-none" style={{ width: '28px' }}>−</th>
                    <th className="py-3 px-3 font-medium text-right">Delivery Cost</th>
                    <th className="py-3 px-1 text-center font-mono font-semibold text-stone-400 text-sm select-none" style={{ width: '28px' }}>=</th>
                    <th className="py-3 px-3 font-medium text-right">Contribution</th>
                    <th className="py-3 px-1 text-center font-mono font-semibold text-stone-400 text-sm select-none" style={{ width: '28px' }}>−</th>
                    <th className="py-3 px-3 font-medium text-right">Artwork Investment</th>
                    <th className="py-3 px-1 text-center font-mono font-semibold text-stone-400 text-sm select-none" style={{ width: '28px' }}>=</th>
                    <th className="py-3 px-3 font-medium text-right">Amount Remaining</th>
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
                      <td className="py-3.5 px-4 tabular font-mono font-medium text-sm" style={{ color: C.ink }}>
                        {money(sc.monthlyRevenue)}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-sm" style={{ color: C.inkMuted }}>
                        {sc.months} months
                      </td>
                      <td className="py-3.5 px-3 text-right tabular font-mono font-medium" style={{ color: C.ink }}>
                        {money(sc.totalRevenue)}
                      </td>
                      <td className="py-3.5 px-1 text-center font-mono font-bold text-stone-400 text-sm select-none">
                        −
                      </td>
                      <td className="py-3.5 px-3 text-right tabular font-mono text-xs font-medium text-stone-600">
                        {money(sc.operatingCostsTotal)}
                      </td>
                      <td className="py-3.5 px-1 text-center font-mono font-bold text-stone-400 text-sm select-none">
                        =
                      </td>
                      <td
                        className="py-3.5 px-3 text-right tabular font-mono font-semibold"
                        style={{ color: sc.totalContribution >= 0 ? C.ink : '#DC2626' }}
                      >
                        {money(sc.totalContribution)}
                      </td>
                      <td className="py-3.5 px-1 text-center font-mono font-bold text-stone-400 text-sm select-none">
                        −
                      </td>
                      <td className="py-3.5 px-3 text-right tabular font-mono text-xs font-medium text-stone-600">
                        {money(sc.initialInvestment)}
                      </td>
                      <td className="py-3.5 px-1 text-center font-mono font-bold text-stone-400 text-sm select-none">
                        =
                      </td>
                      <td className="py-3.5 px-3 text-right tabular font-mono font-bold">
                        <span style={{ color: sc.contributionAfterInvestment >= 0 ? C.rust : '#DC2626' }}>
                          {money(sc.contributionAfterInvestment)}
                        </span>
                      </td>
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

          {/* Save Subscription Proposal Snapshot */}
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
          {/* Next Workflow Stage Navigation Banner */}
          <div
            className="p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: C.paperDark,
              borderColor: C.ink,
            }}
          >
            <div>
              <div className="text-xs uppercase font-mono font-bold tracking-wider" style={{ color: C.rust }}>
                NEXT WORKFLOW STAGE
              </div>
              <div className="text-base font-bold mt-1" style={{ color: C.ink }}>
                Step 05: Company Performance &amp; Sustainability Planning
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                Model executive revenue targets (₹3,00,000/mo), active client portfolio mix, and review interactive SVG charts.
              </div>
            </div>
            {onNavigateToPerformance && (
              <button
                type="button"
                onClick={onNavigateToPerformance}
                className="px-5 py-2.5 text-xs font-mono font-bold uppercase rounded flex items-center gap-2 transition-all hover:opacity-90 shrink-0"
                style={{ backgroundColor: C.ink, color: C.paper }}
              >
                Open Company Performance →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
