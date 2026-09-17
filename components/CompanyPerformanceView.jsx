'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Target,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Layers,
  ArrowRight,
  RotateCcw,
  Plus,
  Briefcase,
  HelpCircle,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  DESIGN_TOKENS as C,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  fmtNum,
  fmtCurrency,
  calculateCompanyPerformance,
} from '@/lib/calculator';
import { DEFAULT_EXPECTED_MONTHLY_REVENUE } from '@/lib/defaults';

export default function CompanyPerformanceView({
  plans = {},
  plansEconomics = {},
  portfolioClients = {},
  onUpdatePortfolioClientCount,
  companyCosts = {},
  expectedMonthlyRevenue = DEFAULT_EXPECTED_MONTHLY_REVENUE,
  onUpdateExpectedMonthlyRevenue,
  settings = {},
  onAddCustomPlan,
  onNavigateToSubscription,
}) {
  const [targetRevenueInput, setTargetRevenueInput] = useState(
    expectedMonthlyRevenue || DEFAULT_EXPECTED_MONTHLY_REVENUE
  );
  const [activeChartTab, setActiveChartTab] = useState('all'); // 'all' | 'recovery' | 'economics' | 'volume' | 'breakeven'

  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  const numTargetRev = Math.max(0, Number(targetRevenueInput) || 0);

  // Compute full performance model
  const performance = useMemo(() => {
    return calculateCompanyPerformance({
      expectedMonthlyRevenue: numTargetRev,
      portfolioMix: portfolioClients,
      plans,
      companyCosts,
      plansEconomics,
    });
  }, [numTargetRev, portfolioClients, plans, companyCosts, plansEconomics]);

  const {
    breakdown = [],
    totalActiveClients = 0,
    totalMonthlySubscriptionRevenue = 0,
    totalMonthlyClientDeliveryCosts = 0,
    totalMonthlyClientContributionBeforeOverhead = 0,
    companyRecurringCost = 0,
    portfolioContributionAfterCompanyRecurringCosts = 0,
    isSustainable = false,
    revenueGap = 0,
    revenueSurplus = 0,
    isTargetReached = false,
    targetProgressPct = 0,
    additionalPlansForTarget = 0,
    avgContributionPerClient = 0,
    avgSubscriptionPerClient = 0,
    requiredBreakevenClients = null,
    additionalPlansNeeded = 0,
    recoveryChartData = [],
    monthlyEconomicsData = [],
    clientVolumeCurveData = [],
    breakevenChartData = [],
    totalArtworkInvestment = 0,
    totalTargetRecoveryValue = 0,
  } = performance;

  const handleTargetChange = (val) => {
    const clean = val.replace(/[^0-9]/g, '');
    const numVal = Number(clean) || 0;
    setTargetRevenueInput(numVal);
    if (onUpdateExpectedMonthlyRevenue) {
      onUpdateExpectedMonthlyRevenue(numVal);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div
        className="p-6 md:p-8 rounded-xl border relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${C.paperDark} 0%, ${C.paper} 100%)`,
          borderColor: C.rule,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider rounded uppercase"
                style={{ background: C.rust, color: '#fff' }}
              >
                05 PERFORMANCE
              </span>
              <span className="text-xs font-mono font-medium" style={{ color: C.inkMuted }}>
                EXECUTIVE BUSINESS PLANNING & SUSTAINABILITY
              </span>
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ fontFamily: FONT_DISPLAY, color: C.ink }}
            >
              Company Performance & Portfolio Economics
            </h1>
            <p className="text-sm max-w-3xl leading-relaxed" style={{ color: C.inkMuted }}>
              Model company-wide subscription economics, track expected monthly revenue targets,
              evaluate breakeven client volumes against ARTNCE overhead pools, and project 24-month
              investment recoveries.
            </p>
          </div>

          {/* Editable Target Revenue Control */}
          <div
            className="p-4 rounded-lg border bg-white/70 backdrop-blur-sm min-w-[280px] space-y-2"
            style={{ borderColor: C.rule }}
          >
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: C.ink }}
              >
                <Target size={14} style={{ color: C.rust }} />
                Expected Monthly Revenue
              </label>
              <span className="text-[10px] font-mono text-gray-500">Editable Target</span>
            </div>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold"
                style={{ color: C.inkMuted }}
              >
                {symbol}
              </span>
              <input
                type="text"
                value={numTargetRev ? numTargetRev.toLocaleString('en-IN') : ''}
                onChange={(e) => handleTargetChange(e.target.value)}
                placeholder="3,00,000"
                className="w-full pl-8 pr-3 py-2 text-lg font-mono font-bold rounded border transition-colors focus:outline-none"
                style={{
                  borderColor: C.rule,
                  background: '#FFFFFF',
                  color: C.ink,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: C.inkMuted }}>
              <span>Target Benchmark:</span>
              <button
                type="button"
                onClick={() => handleTargetChange('300000')}
                className="underline hover:opacity-80 transition-opacity"
              >
                Reset to {symbol}3,00,000
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Metric Summary Cards (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue Target Progress */}
        <div
          className="p-5 rounded-xl border bg-white space-y-3"
          style={{ borderColor: C.rule }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Target size={14} style={{ color: C.rust }} />
              Revenue Target
            </span>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{
                background: isTargetReached ? '#D1FAE5' : '#FEE2E2',
                color: isTargetReached ? '#065F46' : '#991B1B',
              }}
            >
              {targetProgressPct.toFixed(0)}% Reached
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: C.ink }}>
              {money(totalMonthlySubscriptionRevenue)}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              Target: {money(numTargetRev)} / month
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, targetProgressPct)}%`,
                background: isTargetReached ? C.success : C.rust,
              }}
            />
          </div>
          <div className="text-[11px] font-mono flex items-center justify-between">
            {isTargetReached ? (
              <span className="text-green-700 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> Surplus +{money(revenueSurplus)}
              </span>
            ) : (
              <span className="text-red-700 font-semibold flex items-center gap-1">
                <AlertTriangle size={12} /> Deficit -{money(revenueGap)}
              </span>
            )}
            <span className="text-gray-400">{totalActiveClients} active clients</span>
          </div>
        </div>

        {/* Card 2: Company Sustainability Status */}
        <div
          className="p-5 rounded-xl border bg-white space-y-3"
          style={{ borderColor: C.rule }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <ShieldCheck size={14} style={{ color: C.rust }} />
              Sustainability Status
            </span>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{
                background: isSustainable ? '#D1FAE5' : '#FEE2E2',
                color: isSustainable ? '#065F46' : '#991B1B',
              }}
            >
              {isSustainable ? 'Sustainable' : 'Overhead Deficit'}
            </span>
          </div>
          <div>
            <div
              className="text-2xl font-bold font-mono"
              style={{ color: isSustainable ? C.success : C.danger }}
            >
              {portfolioContributionAfterCompanyRecurringCosts >= 0 ? '+' : ''}
              {money(portfolioContributionAfterCompanyRecurringCosts)}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              Net Portfolio Contribution / month
            </div>
          </div>
          <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: C.rule }}>
            <div className="flex justify-between text-gray-600">
              <span>Client Contribution:</span>
              <span className="font-bold text-gray-900">
                {money(totalMonthlyClientContributionBeforeOverhead)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Company Overhead Pool:</span>
              <span className="font-bold text-red-700">-{money(companyRecurringCost)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Subscriptions & Breakeven */}
        <div
          className="p-5 rounded-xl border bg-white space-y-3"
          style={{ borderColor: C.rule }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Users size={14} style={{ color: C.rust }} />
              Active Subscriptions
            </span>
            <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
              Current: {totalActiveClients}
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: C.ink }}>
              {requiredBreakevenClients ? `${requiredBreakevenClients} Clients` : '—'}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              Required for Company Breakeven
            </div>
          </div>
          <div className="pt-2 border-t text-[11px] font-mono space-y-1" style={{ borderColor: C.rule }}>
            <div className="flex justify-between text-gray-600">
              <span>Additional Needed to Breakeven:</span>
              <span
                className={`font-bold ${
                  additionalPlansNeeded > 0 ? 'text-red-700' : 'text-green-700'
                }`}
              >
                {additionalPlansNeeded > 0 ? `+${additionalPlansNeeded} plans` : '0 (Achieved)'}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Avg Contribution / Client:</span>
              <span className="font-bold text-gray-900">{money(avgContributionPerClient)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Target Gap Suggestion */}
        <div
          className="p-5 rounded-xl border bg-white space-y-3"
          style={{ borderColor: C.rule }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Sparkles size={14} style={{ color: C.rust }} />
              Target Gap Suggestion
            </span>
            <span className="text-xs font-mono text-gray-500">Plan Volume</span>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: C.ink }}>
              {isTargetReached ? (
                <span className="text-green-700">Target Reached</span>
              ) : (
                <span>+{additionalPlansForTarget} Plans</span>
              )}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              {isTargetReached
                ? `Surplus of ${money(revenueSurplus)} monthly`
                : `Needed at avg subscription (${money(avgSubscriptionPerClient)})`}
            </div>
          </div>
          <div className="pt-2 border-t text-[11px] font-mono space-y-1 text-gray-600" style={{ borderColor: C.rule }}>
            {!isTargetReached && revenueGap > 0 ? (
              <div className="space-y-0.5">
                <div className="text-gray-500">Or single-tier volume needed:</div>
                <div className="flex justify-between">
                  <span>Essential:</span>
                  <span className="font-bold text-gray-900">+{Math.ceil(revenueGap / 6500)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Professional:</span>
                  <span className="font-bold text-gray-900">+{Math.ceil(revenueGap / 10000)}</span>
                </div>
              </div>
            ) : (
              <div className="text-green-700 font-medium">
                Portfolio covers target revenue with {money(revenueSurplus)} margin.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Interactive Portfolio Mix Table */}
      <div
        className="rounded-xl border bg-white overflow-hidden"
        style={{ borderColor: C.rule }}
      >
        <div
          className="p-4 md:px-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ background: C.paperDark, borderColor: C.rule }}
        >
          <div>
            <h2
              className="text-lg font-bold flex items-center gap-2"
              style={{ fontFamily: FONT_DISPLAY, color: C.ink }}
            >
              <Users size={18} style={{ color: C.rust }} />
              Active Portfolio Mix & Volume Modeling
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Adjust active client counts per plan to simulate aggregate revenue, direct delivery costs,
              and contribution after overhead.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // Quick Preset: 20 Essential, 10 Professional, 5 Enterprise, 2 Signature
                if (onUpdatePortfolioClientCount) {
                  onUpdatePortfolioClientCount('essential', 20);
                  onUpdatePortfolioClientCount('professional', 10);
                  onUpdatePortfolioClientCount('enterprise', 5);
                  onUpdatePortfolioClientCount('signature', 2);
                }
              }}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded border hover:bg-white/80 transition-colors flex items-center gap-1"
              style={{ borderColor: C.rule, color: C.ink }}
            >
              <RotateCcw size={12} />
              Preset Mix A (37 Clients)
            </button>
            <button
              type="button"
              onClick={() => {
                // Preset B: 5 Essential, 15 Professional, 10 Enterprise, 3 Signature
                if (onUpdatePortfolioClientCount) {
                  onUpdatePortfolioClientCount('essential', 5);
                  onUpdatePortfolioClientCount('professional', 15);
                  onUpdatePortfolioClientCount('enterprise', 10);
                  onUpdatePortfolioClientCount('signature', 3);
                }
              }}
              className="px-3 py-1.5 text-xs font-mono font-medium rounded border hover:bg-white/80 transition-colors flex items-center gap-1"
              style={{ borderColor: C.rule, color: C.ink }}
            >
              <RotateCcw size={12} />
              Preset Mix B (33 Clients)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wider text-gray-500 bg-gray-50" style={{ borderColor: C.rule }}>
                <th className="py-3 px-4">Plan / Framework</th>
                <th className="py-3 px-4 text-center">Active Clients</th>
                <th className="py-3 px-4 text-right">Subscription Price</th>
                <th className="py-3 px-4 text-right">Monthly Revenue</th>
                <th className="py-3 px-4 text-right">Direct Delivery (DDC)</th>
                <th className="py-3 px-4 text-right">Client Contribution</th>
                <th className="py-3 px-4 text-right">Staff Overhead Alloc.</th>
                <th className="py-3 px-4 text-center">Single-Plan Breakeven</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.rule }}>
              {breakdown.map((row) => {
                const planId = row.planId;
                const isCustom = Boolean(row.isCustom);
                return (
                  <tr key={planId} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold" style={{ color: C.ink }}>
                        {row.planName}
                      </div>
                      <div className="text-[11px] text-gray-500 font-sans">
                        {plans[planId]?.spaceSqFt
                          ? `~${plans[planId].spaceSqFt.toLocaleString()} sq ft`
                          : 'Custom Site'}
                        {isCustom && <span className="ml-1 text-xs text-amber-700 font-mono">[Custom]</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const newCount = Math.max(0, row.clientCount - 1);
                            if (onUpdatePortfolioClientCount) onUpdatePortfolioClientCount(planId, newCount);
                          }}
                          className="w-6 h-6 rounded border flex items-center justify-center text-xs font-bold hover:bg-gray-100"
                          style={{ borderColor: C.rule }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={row.clientCount}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            if (onUpdatePortfolioClientCount) onUpdatePortfolioClientCount(planId, val);
                          }}
                          className="w-14 text-center py-1 font-mono font-bold border rounded focus:outline-none"
                          style={{ borderColor: C.rule }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newCount = row.clientCount + 1;
                            if (onUpdatePortfolioClientCount) onUpdatePortfolioClientCount(planId, newCount);
                          }}
                          className="w-6 h-6 rounded border flex items-center justify-center text-xs font-bold hover:bg-gray-100"
                          style={{ borderColor: C.rule }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {money(row.monthlySubscription)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {money(row.revenueTotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {money(row.deliveryCostTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-700">
                      {money(row.contributionBeforeOverheadTotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-700">
                      {money(row.staffAllocTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.singlePlanBreakevenClients ? (
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-bold">
                          {row.singlePlanBreakevenClients} clients
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr
                className="font-bold border-t text-sm bg-gray-50"
                style={{ borderColor: C.rule, color: C.ink }}
              >
                <td className="py-3 px-4">Portfolio Aggregate Total</td>
                <td className="py-3 px-4 text-center text-base">{totalActiveClients} Clients</td>
                <td className="py-3 px-4 text-right text-xs text-gray-500">
                  Avg: {money(avgSubscriptionPerClient)}
                </td>
                <td className="py-3 px-4 text-right text-base text-gray-900">
                  {money(totalMonthlySubscriptionRevenue)}
                </td>
                <td className="py-3 px-4 text-right text-gray-700">
                  {money(totalMonthlyClientDeliveryCosts)}
                </td>
                <td className="py-3 px-4 text-right text-base text-green-700">
                  {money(totalMonthlyClientContributionBeforeOverhead)}
                </td>
                <td className="py-3 px-4 text-right text-red-700">
                  {money(companyRecurringCost)}
                </td>
                <td className="py-3 px-4 text-center text-xs">
                  {requiredBreakevenClients ? `${requiredBreakevenClients} to break even` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Bespoke Data-Driven SVG Graphs (4 Major Visualizations) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              className="text-xl font-bold flex items-center gap-2"
              style={{ fontFamily: FONT_DISPLAY, color: C.ink }}
            >
              <BarChart3 size={20} style={{ color: C.rust }} />
              Executive Analytics & Projections
            </h2>
            <p className="text-xs text-gray-600">
              Interactive SVG charts driven strictly by current portfolio parameters and calculation engine.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg text-xs font-mono">
            {['all', 'recovery', 'economics', 'volume', 'breakeven'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveChartTab(tab)}
                className={`px-3 py-1 rounded transition-all capitalize ${
                  activeChartTab === tab
                    ? 'bg-white text-gray-900 font-bold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'all' ? 'All 4 Graphs' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GRAPH 1: Investment Recovery Trajectory (1..24 Months) */}
          {(activeChartTab === 'all' || activeChartTab === 'recovery') && (
            <div
              className="p-5 rounded-xl border bg-white space-y-4"
              style={{ borderColor: C.rule }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                    Graph 1: Investment Recovery Trajectory (24 Months)
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Cumulative Contribution vs Initial Investment & Target Recovery (60% Markup)
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-gray-900">{money(totalTargetRecoveryValue)}</div>
                  <div className="text-[10px] text-gray-500">60% Markup Target</div>
                </div>
              </div>

              {/* Bespoke SVG Chart 1 */}
              <div className="relative w-full h-64 border rounded bg-[#FAFAF8] p-2 overflow-hidden" style={{ borderColor: C.rule }}>
                <svg viewBox="0 0 500 220" className="w-full h-full">
                  {/* Grid lines */}
                  {[0, 50, 100, 150, 200].map((y) => (
                    <line
                      key={y}
                      x1="40"
                      y1={y}
                      x2="480"
                      y2={y}
                      stroke={C.rule}
                      strokeDasharray="3 3"
                      strokeWidth="0.8"
                    />
                  ))}

                  {/* Dynamic Scaling */}
                  {(() => {
                    const maxVal = Math.max(
                      totalTargetRecoveryValue * 1.3,
                      (recoveryChartData[23]?.cumulativeContribution || 100000) * 1.1,
                      50000
                    );
                    const scaleY = (val) => 200 - (Math.min(maxVal, Math.max(0, val)) / maxVal) * 180;
                    const scaleX = (m) => 40 + ((m - 1) / 23) * 440;

                    // Initial Investment reference line
                    const initY = scaleY(totalArtworkInvestment);
                    // Markup Target reference line
                    const targetY = scaleY(totalTargetRecoveryValue);

                    // Path for cumulative contribution
                    const points = recoveryChartData.map((d) => `${scaleX(d.month)},${scaleY(d.cumulativeContribution)}`);
                    const pathD = `M ${points.join(' L ')}`;
                    const areaD = `${pathD} L ${scaleX(24)},200 L ${scaleX(1)},200 Z`;

                    return (
                      <>
                        {/* Shaded Area */}
                        <path d={areaD} fill="#2B6E4F" fillOpacity="0.08" />

                        {/* Initial Investment Reference Line */}
                        <line
                          x1="40"
                          y1={initY}
                          x2="480"
                          y2={initY}
                          stroke="#5B5445"
                          strokeDasharray="4 4"
                          strokeWidth="1.2"
                        />
                        <text x="45" y={initY - 4} fontSize="9" fill="#5B5445" fontFamily={FONT_MONO}>
                          Initial Investment: {money(totalArtworkInvestment)}
                        </text>

                        {/* Target Recovery Reference Line (with 60% markup) */}
                        <line
                          x1="40"
                          y1={targetY}
                          x2="480"
                          y2={targetY}
                          stroke={C.rust}
                          strokeDasharray="5 3"
                          strokeWidth="1.5"
                        />
                        <text x="45" y={targetY - 4} fontSize="9" fill={C.rust} fontWeight="bold" fontFamily={FONT_MONO}>
                          60% Markup Target: {money(totalTargetRecoveryValue)}
                        </text>

                        {/* Cumulative Contribution Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#2B6E4F"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Month Points */}
                        {[1, 6, 12, 18, 24].map((m) => {
                          const item = recoveryChartData[m - 1];
                          if (!item) return null;
                          const cx = scaleX(m);
                          const cy = scaleY(item.cumulativeContribution);
                          return (
                            <g key={m}>
                              <circle cx={cx} cy={cy} r="3.5" fill="#2B6E4F" stroke="#fff" strokeWidth="1.5" />
                              <text x={cx} y="215" fontSize="9" textAnchor="middle" fill="#5B5445" fontFamily={FONT_MONO}>
                                M{m}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs font-mono text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#2B6E4F]" /> Cumulative Contribution
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#B8452D] border-t border-dashed" /> 60% Markup Target
                  </span>
                </div>
                <span className="text-gray-500">24-month horizon</span>
              </div>
            </div>
          )}

          {/* GRAPH 2: Company Monthly Economics (Additive Bar Breakdown) */}
          {(activeChartTab === 'all' || activeChartTab === 'economics') && (
            <div
              className="p-5 rounded-xl border bg-white space-y-4"
              style={{ borderColor: C.rule }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                    Graph 2: Monthly Economics Breakdown
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Additive Revenue vs Direct Delivery Costs vs Company Overhead Pool
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      isSustainable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Net: {money(portfolioContributionAfterCompanyRecurringCosts)}
                  </span>
                </div>
              </div>

              {/* Bespoke SVG Chart 2: Additive Bars */}
              <div className="relative w-full h-64 border rounded bg-[#FAFAF8] p-2 overflow-hidden" style={{ borderColor: C.rule }}>
                <svg viewBox="0 0 500 220" className="w-full h-full">
                  {/* Horizontal gridlines */}
                  {[30, 80, 130, 180].map((y) => (
                    <line
                      key={y}
                      x1="40"
                      y1={y}
                      x2="480"
                      y2={y}
                      stroke={C.rule}
                      strokeDasharray="3 3"
                      strokeWidth="0.8"
                    />
                  ))}

                  {(() => {
                    const bars = [
                      { label: 'Revenue', value: totalMonthlySubscriptionRevenue, color: '#221F1C' },
                      { label: 'Client DDC', value: totalMonthlyClientDeliveryCosts, color: '#5B5445' },
                      { label: 'Company Overhead', value: companyRecurringCost, color: '#B8452D' },
                      {
                        label: 'Net Contribution',
                        value: Math.max(0, portfolioContributionAfterCompanyRecurringCosts),
                        color: isSustainable ? '#2B6E4F' : '#A3291B',
                      },
                    ];
                    const maxVal = Math.max(...bars.map((b) => b.value), 100000) * 1.15;
                    const scaleH = (v) => (v / maxVal) * 150;

                    return bars.map((b, i) => {
                      const barWidth = 65;
                      const x = 70 + i * 105;
                      const h = scaleH(b.value);
                      const y = 180 - h;

                      return (
                        <g key={b.label}>
                          {/* Bar */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={Math.max(4, h)}
                            rx="4"
                            fill={b.color}
                            className="transition-all duration-300 hover:opacity-90"
                          />
                          {/* Value above bar */}
                          <text
                            x={x + barWidth / 2}
                            y={y - 6}
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            fill={C.ink}
                            fontFamily={FONT_MONO}
                          >
                            {fmtCurrency(b.value, symbol, 0)}
                          </text>
                          {/* Label below */}
                          <text
                            x={x + barWidth / 2}
                            y="200"
                            fontSize="10"
                            textAnchor="middle"
                            fill="#5B5445"
                            fontFamily={FONT_MONO}
                          >
                            {b.label}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-gray-600">
                <span>Direct Delivery + Company Overhead = Total Monthly Operating Costs</span>
                <span className="font-bold">{money(totalMonthlyClientDeliveryCosts + companyRecurringCost)}</span>
              </div>
            </div>
          )}

          {/* GRAPH 3: Active Clients Volume vs Contribution Curve (0..50 Clients) */}
          {(activeChartTab === 'all' || activeChartTab === 'volume') && (
            <div
              className="p-5 rounded-xl border bg-white space-y-4"
              style={{ borderColor: C.rule }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                    Graph 3: Client Volume vs Contribution Curve
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Net Contribution trajectory across 0 to 50 active client subscriptions
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-gray-500">
                  Breakeven: <span className="font-bold text-gray-900">{requiredBreakevenClients || '—'} clients</span>
                </div>
              </div>

              {/* Bespoke SVG Chart 3: Volume Curve */}
              <div className="relative w-full h-64 border rounded bg-[#FAFAF8] p-2 overflow-hidden" style={{ borderColor: C.rule }}>
                <svg viewBox="0 0 500 220" className="w-full h-full">
                  {(() => {
                    const data = clientVolumeCurveData;
                    if (!data || data.length === 0) return null;

                    const minCont = Math.min(...data.map((d) => d.contribution), -companyRecurringCost);
                    const maxCont = Math.max(...data.map((d) => d.contribution), companyRecurringCost);
                    const range = Math.max(1, maxCont - minCont);

                    const scaleX = (clients) => 40 + (clients / 50) * 440;
                    const scaleY = (cont) => 190 - ((cont - minCont) / range) * 160;

                    const zeroY = scaleY(0);

                    // Points string
                    const points = data.map((d) => `${scaleX(d.clients)},${scaleY(d.contribution)}`);
                    const pathD = `M ${points.join(' L ')}`;

                    // Current position
                    const curX = scaleX(Math.min(50, totalActiveClients));
                    const curY = scaleY(portfolioContributionAfterCompanyRecurringCosts);

                    // Breakeven position
                    const beX = requiredBreakevenClients ? scaleX(Math.min(50, requiredBreakevenClients)) : null;

                    return (
                      <>
                        {/* Zero axis (Breakeven boundary) */}
                        <line
                          x1="40"
                          y1={zeroY}
                          x2="480"
                          y2={zeroY}
                          stroke="#221F1C"
                          strokeWidth="1.2"
                        />
                        <text x="45" y={zeroY - 4} fontSize="9" fill="#5B5445" fontFamily={FONT_MONO}>
                          Zero Contribution (Breakeven Threshold)
                        </text>

                        {/* Deficit zone shading */}
                        <rect
                          x="40"
                          y={zeroY}
                          width="440"
                          height={Math.max(0, 200 - zeroY)}
                          fill="#FEE2E2"
                          fillOpacity="0.4"
                        />
                        {/* Surplus zone shading */}
                        <rect
                          x="40"
                          y="20"
                          width="440"
                          height={Math.max(0, zeroY - 20)}
                          fill="#D1FAE5"
                          fillOpacity="0.4"
                        />

                        {/* Trajectory curve */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#2B6E4F"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Breakeven Marker */}
                        {beX && (
                          <g>
                            <line
                              x1={beX}
                              y1="20"
                              x2={beX}
                              y2="200"
                              stroke="#B8452D"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                            <circle cx={beX} cy={zeroY} r="4.5" fill="#B8452D" stroke="#fff" strokeWidth="1.5" />
                            <text x={beX} y="15" fontSize="9" textAnchor="middle" fill="#B8452D" fontWeight="bold" fontFamily={FONT_MONO}>
                              Breakeven: {requiredBreakevenClients}
                            </text>
                          </g>
                        )}

                        {/* Current Position Marker */}
                        <g>
                          <circle cx={curX} cy={curY} r="6" fill="#221F1C" stroke="#fff" strokeWidth="2" />
                          <text
                            x={curX}
                            y={curY - 10}
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            fill="#221F1C"
                            fontFamily={FONT_MONO}
                          >
                            Current ({totalActiveClients})
                          </text>
                        </g>

                        {/* X-Axis labels */}
                        {[0, 10, 20, 30, 40, 50].map((clients) => (
                          <text
                            key={clients}
                            x={scaleX(clients)}
                            y="212"
                            fontSize="9"
                            textAnchor="middle"
                            fill="#5B5445"
                            fontFamily={FONT_MONO}
                          >
                            {clients}
                          </text>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-gray-600">
                <span>Green zone: Net Positive Contribution</span>
                <span>Red zone: Overhead Deficit</span>
              </div>
            </div>
          )}

          {/* GRAPH 4: Required Plans Breakeven & Target Trajectory */}
          {(activeChartTab === 'all' || activeChartTab === 'breakeven') && (
            <div
              className="p-5 rounded-xl border bg-white space-y-4"
              style={{ borderColor: C.rule }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                    Graph 4: Revenue vs Cost Breakeven Cross
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Total Revenue vs Total Operating Costs as plan volume scales
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-gray-900">{money(numTargetRev)}</span>
                  <div className="text-[10px] text-gray-500">Target Line</div>
                </div>
              </div>

              {/* Bespoke SVG Chart 4 */}
              <div className="relative w-full h-64 border rounded bg-[#FAFAF8] p-2 overflow-hidden" style={{ borderColor: C.rule }}>
                <svg viewBox="0 0 500 220" className="w-full h-full">
                  {/* Grid lines */}
                  {[30, 80, 130, 180].map((y) => (
                    <line
                      key={y}
                      x1="40"
                      y1={y}
                      x2="480"
                      y2={y}
                      stroke={C.rule}
                      strokeDasharray="3 3"
                      strokeWidth="0.8"
                    />
                  ))}

                  {(() => {
                    const data = breakevenChartData;
                    if (!data || data.length === 0) return null;

                    const maxPlans = data[data.length - 1].plans || 50;
                    const maxRevenue = Math.max(
                      ...data.map((d) => Math.max(d.revenue, d.totalCost)),
                      numTargetRev * 1.2,
                      200000
                    );

                    const scaleX = (p) => 40 + (p / maxPlans) * 440;
                    const scaleY = (val) => 190 - (val / maxRevenue) * 160;

                    const revPoints = data.map((d) => `${scaleX(d.plans)},${scaleY(d.revenue)}`);
                    const costPoints = data.map((d) => `${scaleX(d.plans)},${scaleY(d.totalCost)}`);

                    const targetY = scaleY(numTargetRev);

                    return (
                      <>
                        {/* Target Revenue Horizontal Line */}
                        <line
                          x1="40"
                          y1={targetY}
                          x2="480"
                          y2={targetY}
                          stroke={C.rust}
                          strokeDasharray="4 4"
                          strokeWidth="1.5"
                        />
                        <text x="45" y={targetY - 4} fontSize="9" fill={C.rust} fontWeight="bold" fontFamily={FONT_MONO}>
                          Target Revenue: {money(numTargetRev)}
                        </text>

                        {/* Revenue Curve */}
                        <path
                          d={`M ${revPoints.join(' L ')}`}
                          fill="none"
                          stroke="#221F1C"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Total Cost Curve */}
                        <path
                          d={`M ${costPoints.join(' L ')}`}
                          fill="none"
                          stroke="#A3291B"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          strokeLinecap="round"
                        />

                        {/* Current Volume Line */}
                        <line
                          x1={scaleX(totalActiveClients)}
                          y1="20"
                          x2={scaleX(totalActiveClients)}
                          y2="190"
                          stroke="#2B6E4F"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx={scaleX(totalActiveClients)}
                          cy={scaleY(totalMonthlySubscriptionRevenue)}
                          r="4"
                          fill="#2B6E4F"
                        />

                        {/* X-Axis labels */}
                        {data.map((d, i) => {
                          if (i % 2 !== 0) return null;
                          return (
                            <text
                              key={d.plans}
                              x={scaleX(d.plans)}
                              y="210"
                              fontSize="9"
                              textAnchor="middle"
                              fill="#5B5445"
                              fontFamily={FONT_MONO}
                            >
                              {d.plans}p
                            </text>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="flex flex-wrap items-center justify-between text-xs font-mono text-gray-600">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#221F1C]" /> Total Revenue
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#A3291B] border-t border-dashed" /> Total Costs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#B8452D] border-t border-dashed" /> Revenue Target
                  </span>
                </div>
                <span className="text-[#2B6E4F] font-bold">Green Dot: Current Portfolio</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Pure Objective Plan Performance Table (No Ranking / Best-Worst) */}
      <div
        className="rounded-xl border bg-white overflow-hidden"
        style={{ borderColor: C.rule }}
      >
        <div
          className="p-4 md:px-6 border-b flex items-center justify-between"
          style={{ background: C.paperDark, borderColor: C.rule }}
        >
          <div>
            <h2
              className="text-lg font-bold flex items-center gap-2"
              style={{ fontFamily: FONT_DISPLAY, color: C.ink }}
            >
              <Briefcase size={18} style={{ color: C.rust }} />
              Plan Performance & Benchmark Economics
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Comprehensive economic parameters per plan. All plans are independently configurable frameworks.
            </p>
          </div>
          {onNavigateToSubscription && (
            <button
              type="button"
              onClick={onNavigateToSubscription}
              className="text-xs font-mono font-medium text-amber-900 hover:underline flex items-center gap-1"
            >
              Configure Plans <ArrowRight size={12} />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b uppercase tracking-wider text-gray-500 bg-gray-50" style={{ borderColor: C.rule }}>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Reference Space</th>
                <th className="py-3 px-4 text-right">Subscription Price</th>
                <th className="py-3 px-4 text-right">Direct Delivery (DDC)</th>
                <th className="py-3 px-4 text-right">Client Contrib. (L1)</th>
                <th className="py-3 px-4 text-right">Staff Alloc. (COA)</th>
                <th className="py-3 px-4 text-right">Remaining Contrib. (L2)</th>
                <th className="py-3 px-4 text-right">Initial Inv. (60% Target)</th>
                <th className="py-3 px-4 text-center">Target Recovery</th>
                <th className="py-3 px-4 text-center">Breakeven Volume</th>
                <th className="py-3 px-4 text-center">Target Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: C.rule }}>
              {breakdown.map((row) => {
                const planId = row.planId;
                const p = plans[planId] || {};
                const econ = plansEconomics[planId] || {};
                const recovery = econ.recovery || {};

                return (
                  <tr key={planId} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold" style={{ color: C.ink }}>
                      {row.planName}
                      {p.isCustom && <span className="ml-1 text-[10px] text-amber-700">[Custom]</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-sans">
                      {p.spaceSqFt ? `~${p.spaceSqFt.toLocaleString()} sq ft` : 'Custom Site'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {money(row.monthlySubscription)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {money(row.totalMonthlyClientDeliveryCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-800">
                      {money(row.monthlyContributionBeforeOverhead)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-700">
                      {money(row.allocatedEmployeeSalary)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        econ.monthlyContribution >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}
                    >
                      {money(econ.monthlyContribution)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      <div>{money(row.initialInvestment)}</div>
                      <div className="text-[10px] text-gray-500">
                        Target: {money(row.targetRecoveryValue)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {recovery.targetReachedMonth ? (
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          Month {recovery.targetReachedMonth}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.singlePlanBreakevenClients ? (
                        <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">
                          {row.singlePlanBreakevenClients} plans
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.singlePlanTargetGapClients ? (
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                          {row.singlePlanTargetGapClients} plans
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
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
