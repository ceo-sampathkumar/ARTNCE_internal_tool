'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  HelpCircle,
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
  curatedSummary,
  curationContext,
  subscriptionState,
  onUpdateSubscription,
  onUpdateOperatingCost,
  subscriptionEconomics,
  settings,
  onSaveSnapshot,
  onNavigateToCurate,
}) {
  const [opCostsOpen, setOpCostsOpen] = useState(true);
  const [snapshotTitle, setSnapshotTitle] = useState('');

  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  const {
    initialInvestment,
    monthlySubscription,
    monthlyOperatingCosts,
    monthlyContribution,
    simpleRecoveryMonths,
    estimatedRecoveryMonths,
    isRecoveryAchievable,
    unachievableReason,
    scenarios,
  } = subscriptionEconomics;

  const hasCuratedArtworks = curatedSummary.validCount > 0;

  const handleSave = () => {
    onSaveSnapshot({
      type: 'subscription_plan',
      title: snapshotTitle.trim() || `${curationContext.collectionName || 'Collection'} Subscription Plan`,
    });
    setSnapshotTitle('');
  };

  return (
    <div className="space-y-8">
      {/* 1. Curated Collection Economics Top Summary */}
      <div
        className="p-6"
        style={{
          backgroundColor: C.paperDark,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
              Curated Collection Economics
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: C.ink }}>
                {curationContext.collectionName || 'Curated Artwork Collection'}
              </span>
              {curationContext.clientName && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: C.paper, color: C.inkMuted }}>
                  Client: {curationContext.clientName}
                </span>
              )}
              {curationContext.location && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: C.paper, color: C.inkMuted }}>
                  {curationContext.location}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToCurate}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5"
            style={{ border: `1px solid ${C.rule}`, color: C.ink, backgroundColor: C.paper }}
          >
            <ArrowLeft size={13} /> Edit Curated Artworks
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Curated Artworks</div>
            <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.ink }}>
              {curatedSummary.validCount}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Total Curated Area</div>
            <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.ink }}>
              {fmtNum(curatedSummary.totalArea, 1)} <span className="text-sm font-normal text-stone-500">sq ft</span>
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Initial Artwork Investment</div>
            <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.rust }}>
              {money(initialInvestment)}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Avg Investment / Artwork</div>
            <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.ink }}>
              {money(curatedSummary.avgCostPerArtwork)}
            </div>
          </div>
        </div>

        {!hasCuratedArtworks && (
          <div className="mt-4 p-3 border border-amber-300 bg-amber-50 text-amber-900 text-xs flex items-center justify-between">
            <span>No artworks selected in Curate mode. Initial investment is currently ₹0.</span>
            <button
              type="button"
              onClick={onNavigateToCurate}
              className="font-medium underline ml-2"
            >
              Select Artworks
            </button>
          </div>
        )}
      </div>

      {/* 2. Monthly Subscription Input & Core Recovery KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Subscription Fee Input */}
        <div className="lg:col-span-6 p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
            Monthly Subscription Pricing
          </h2>
          <p className="text-xs mt-1 mb-5" style={{ color: C.inkMuted }}>
            Enter proposed monthly recurring client fee. Subscription pricing is separate from artwork production cost.
          </p>

          <label className="block">
            <span className="block text-xs mb-1.5" style={{ color: C.inkMuted }}>
              Monthly Client Subscription Fee
            </span>
            <div className="flex items-center border-b-2" style={{ borderColor: C.ink }}>
              <span className="text-lg font-mono mr-1" style={{ color: C.inkMuted }}>{symbol}</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={subscriptionState.monthlySubscription}
                onChange={(e) => onUpdateSubscription('monthlySubscription', e.target.value)}
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
                onClick={() => onUpdateSubscription('monthlySubscription', preset)}
                className="text-xs px-2.5 py-1 transition-colors"
                style={{
                  border: `1px solid ${Number(subscriptionState.monthlySubscription) === preset ? C.ink : C.rule}`,
                  backgroundColor: Number(subscriptionState.monthlySubscription) === preset ? C.ink : 'transparent',
                  color: Number(subscriptionState.monthlySubscription) === preset ? C.paper : C.ink,
                  fontFamily: FONT_MONO,
                }}
              >
                {money(preset)}
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t" style={{ borderColor: C.rule }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
                <div className="text-xs" style={{ color: C.inkMuted }}>Monthly Subscription</div>
                <div className="mt-1 text-xl font-semibold tabular font-mono" style={{ color: C.ink }}>
                  {money(monthlySubscription)}
                </div>
              </div>
              <div className="p-4" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
                <div className="text-xs" style={{ color: C.inkMuted }}>Monthly Operating Costs</div>
                <div className="mt-1 text-xl font-semibold tabular font-mono" style={{ color: C.inkMuted }}>
                  {money(monthlyOperatingCosts)}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4" style={{ backgroundColor: C.ink, color: C.paper }}>
              <div className="text-xs text-stone-300">Monthly Contribution (Revenue − Operating Costs)</div>
              <div className="mt-1 text-2xl font-bold tabular font-mono" style={{ color: monthlyContribution > 0 ? C.paper : '#F87171' }}>
                {money(monthlyContribution)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recovery Analysis Cards */}
        <div className="lg:col-span-6 space-y-4">
          {/* Card A: Simple Recovery */}
          <div className="p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
                  Simple Artwork Investment Recovery
                </span>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  Initial Artwork Investment ÷ Monthly Subscription (excludes recurring operating costs)
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              {simpleRecoveryMonths !== null ? (
                <>
                  <div className="text-3xl font-semibold tabular font-mono" style={{ color: C.rust }}>
                    {Math.ceil(simpleRecoveryMonths)} {Math.ceil(simpleRecoveryMonths) === 1 ? 'Month' : 'Months'}
                  </div>
                  <div className="text-xs tabular font-mono" style={{ color: C.inkMuted }}>
                    ({fmtNum(simpleRecoveryMonths, 1)} months calculated)
                  </div>
                </>
              ) : (
                <div className="text-sm font-medium text-stone-500">
                  Enter subscription price & initial investment to calculate
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
                Initial Artwork Investment ÷ Monthly Contribution (accounts for recurring monthly expenses)
              </p>
            </div>

            <div className="mt-4">
              {isRecoveryAchievable && estimatedRecoveryMonths !== null ? (
                <div className="flex items-baseline gap-3">
                  <div className="text-3xl font-semibold tabular font-mono" style={{ color: C.ink }}>
                    {Math.ceil(estimatedRecoveryMonths)} {Math.ceil(estimatedRecoveryMonths) === 1 ? 'Month' : 'Months'}
                  </div>
                  <div className="text-xs tabular font-mono" style={{ color: C.inkMuted }}>
                    ({fmtNum(estimatedRecoveryMonths, 1)} months calculated)
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle size={14} className="text-red-700" />
                    <span>{unachievableReason || 'Investment recovery: Not achievable at current subscription price and operating costs.'}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-red-700">
                    Increase the monthly subscription fee or reduce monthly recurring operating costs to achieve recovery.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recurring Monthly Operating Costs Drawer */}
      <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
        <button
          type="button"
          onClick={() => setOpCostsOpen((o) => !o)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
                Monthly Operating Costs
              </h3>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium" style={{ backgroundColor: C.paperDark, color: C.ink }}>
                Total: {money(monthlyOperatingCosts)} / month
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
              Recurring expenses incurred every month by ARTNCE (curation, logistics, artist rev-share, maintenance, staff).
            </p>
          </div>
          <ChevronDown
            size={18}
            style={{
              color: C.inkMuted,
              transform: opCostsOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms',
            }}
          />
        </button>

        {opCostsOpen && (
          <div className="px-6 pb-6 border-t pt-5" style={{ borderColor: C.rule }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <label className="block">
                <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>Curator monthly fee / allocation</span>
                <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                  <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                  <input
                    type="number"
                    step="any"
                    value={subscriptionState.operatingCosts.curator}
                    onChange={(e) => onUpdateOperatingCost('curator', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                    style={{ color: C.ink }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>Logistics & transport allowance</span>
                <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                  <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                  <input
                    type="number"
                    step="any"
                    value={subscriptionState.operatingCosts.logistics}
                    onChange={(e) => onUpdateOperatingCost('logistics', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                    style={{ color: C.ink }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>Artist recurring stipend / royalty</span>
                <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                  <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                  <input
                    type="number"
                    step="any"
                    value={subscriptionState.operatingCosts.artistRecurring}
                    onChange={(e) => onUpdateOperatingCost('artistRecurring', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                    style={{ color: C.ink }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>Maintenance & replacement reserve</span>
                <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                  <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                  <input
                    type="number"
                    step="any"
                    value={subscriptionState.operatingCosts.maintenance}
                    onChange={(e) => onUpdateOperatingCost('maintenance', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                    style={{ color: C.ink }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>Operations / management allocation</span>
                <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                  <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                  <input
                    type="number"
                    step="any"
                    value={subscriptionState.operatingCosts.operations}
                    onChange={(e) => onUpdateOperatingCost('operations', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                    style={{ color: C.ink }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>
                  {subscriptionState.operatingCosts.otherLabel || 'Other recurring cost'}
                </span>
                <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                  <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                  <input
                    type="number"
                    step="any"
                    value={subscriptionState.operatingCosts.other}
                    onChange={(e) => onUpdateOperatingCost('other', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                    style={{ color: C.ink }}
                  />
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 4. Multi-Duration Scenario Matrix Table */}
      <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
        <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: C.rule }}>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
              Subscription Duration Scenarios
            </h3>
            <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
              Projections across 3, 6, 12, and 24-month lease terms comparing revenue, operating costs, contribution, and investment recovery.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 760 }}>
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                <th className="py-3 px-4 font-medium">Duration</th>
                <th className="py-3 px-4 font-medium text-right">Monthly Revenue</th>
                <th className="py-3 px-4 font-medium text-right">Total Revenue</th>
                <th className="py-3 px-4 font-medium text-right">Operating Costs</th>
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
                  <td className="py-3 px-4 font-medium" style={{ color: C.ink }}>
                    {sc.durationLabel}
                  </td>

                  {/* Monthly Revenue */}
                  <td className="py-3 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                    {money(sc.monthlyRevenue)}
                  </td>

                  {/* Total Revenue */}
                  <td className="py-3 px-4 text-right tabular font-mono font-medium">
                    {money(sc.totalRevenue)}
                  </td>

                  {/* Operating Costs */}
                  <td className="py-3 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                    {money(sc.operatingCostsTotal)}
                  </td>

                  {/* Total Contribution */}
                  <td className="py-3 px-4 text-right tabular font-mono font-medium" style={{ color: sc.totalContribution >= 0 ? C.ink : '#DC2626' }}>
                    {money(sc.totalContribution)}
                  </td>

                  {/* Artwork Investment */}
                  <td className="py-3 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                    {money(sc.initialInvestment)}
                  </td>

                  {/* Contribution After Initial Investment */}
                  <td className="py-3 px-4 text-right tabular font-mono font-semibold">
                    <span style={{ color: sc.contributionAfterInvestment >= 0 ? C.rust : '#DC2626' }}>
                      {money(sc.contributionAfterInvestment)}
                    </span>
                  </td>

                  {/* Recovered Status */}
                  <td className="py-3 px-4 text-center">
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

      {/* 5. Save Proposal / Subscription Snapshot */}
      <div className="p-6 border" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.inkMuted }}>
          Save Subscription Snapshot
        </h3>
        <p className="text-xs mb-4" style={{ color: C.inkMuted }}>
          Save this complete proposal including curated artworks, investment, monthly fee, recurring expenses, and duration matrix for later review.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={snapshotTitle}
            onChange={(e) => setSnapshotTitle(e.target.value)}
            placeholder={`e.g. ${curationContext.collectionName || 'Lounge Collection'} - ₹${monthlySubscription}/mo Plan`}
            className="flex-1 min-w-[240px] bg-transparent border-b py-2 text-sm outline-none"
            style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasCuratedArtworks}
            className="py-2 px-4 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            style={{
              backgroundColor: hasCuratedArtworks ? C.rust : '#A8A29E',
              color: '#fff',
              cursor: hasCuratedArtworks ? 'pointer' : 'not-allowed',
            }}
          >
            <Bookmark size={13} /> Save Subscription Snapshot
          </button>
        </div>
      </div>
    </div>
  );
}
