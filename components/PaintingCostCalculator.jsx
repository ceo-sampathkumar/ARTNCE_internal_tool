'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Bookmark,
  Check,
  Database,
  HardDrive,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowRight,
  Calculator,
  Calendar,
} from 'lucide-react';
import {
  DESIGN_TOKENS as C,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  num,
  toFeet,
  buildBreakdown,
  calculatePricing,
  fmtNum,
  fmtCurrency,
  calculatePaintingCost,
  calculateBatchSummary,
  calculateSubscriptionEconomics,
} from '@/lib/calculator';
import {
  DEFAULT_SETTINGS,
  DEFAULT_PRICING,
  DEFAULT_CURATION_CONTEXT,
  DEFAULT_SUBSCRIPTION,
  STORAGE_KEY,
  STORAGE_KEY_BATCH,
  STORAGE_KEY_CURATION,
  STORAGE_KEY_SUBSCRIPTION,
  STORAGE_KEY_QUOTES,
  createEmptyPainting,
  createDefaultBatch,
  makeId,
} from '@/lib/defaults';
import BatchView from './BatchView';
import CurateView from './CurateView';
import SubscriptionView from './SubscriptionView';

/* -----------------------------------------------------------------------
 * Reusable UI Building Blocks
 * ---------------------------------------------------------------------*/
function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex" style={{ border: `1px solid ${C.rule}` }}>
      {options.map((opt, i) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className="px-3.5 py-1.5 text-sm transition-colors"
          style={{
            backgroundColor: value === opt.value ? C.ink : 'transparent',
            color: value === opt.value ? C.paper : C.ink,
            borderRight: i < options.length - 1 ? `1px solid ${C.rule}` : 'none',
            fontFamily: FONT_BODY,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DimField({ label, value, onChange, suffix, error }) {
  return (
    <label className="block">
      <span className="block text-sm mb-1.5" style={{ color: C.inkMuted }}>{label}</span>
      <div className="flex items-center border-b-2" style={{ borderColor: error ? C.danger : C.ink }}>
        <input
          type="number"
          step="any"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-2 text-xl outline-none tabular"
          style={{ color: C.ink, fontFamily: FONT_MONO }}
          placeholder="0"
        />
        <span className="text-sm pl-2" style={{ color: C.inkMuted }}>{suffix}</span>
      </div>
      <div style={{ height: 16 }}>
        {error && <span className="block text-xs mt-1" style={{ color: C.danger }}>{error}</span>}
      </div>
    </label>
  );
}

function RateInput({ label, value, onChange, suffix }) {
  return (
    <label className="block">
      <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>{label}</span>
      <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-1.5 text-sm outline-none tabular"
          style={{ color: C.ink, fontFamily: FONT_MONO }}
        />
        {suffix && <span className="text-xs pl-2 whitespace-nowrap" style={{ color: C.inkMuted }}>{suffix}</span>}
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="block">
      <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b py-1.5 text-sm outline-none"
        style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
      />
    </label>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: C.rust, width: 15, height: 15 }}
      />
      <span className="text-xs" style={{ color: C.inkMuted }}>{label}</span>
    </label>
  );
}

function SettingsGroup({ title, note, right, children }) {
  return (
    <div className="py-5 border-t" style={{ borderColor: C.rule }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-medium" style={{ color: C.ink, fontFamily: FONT_BODY }}>{title}</h3>
          {note && <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>{note}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, size = 'md' }) {
  return (
    <div>
      <div className="text-xs" style={{ color: C.inkMuted }}>{label}</div>
      <div
        className="tabular"
        style={{ fontFamily: FONT_MONO, color: C.ink, fontSize: size === 'lg' ? '1.15rem' : '1rem', marginTop: 2 }}
      >
        {value}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------
 * Main Unified Application Component
 * ---------------------------------------------------------------------*/
export default function PaintingCostCalculator() {
  // Navigation stage: 'cost' | 'batch' | 'curate' | 'subscription'
  const [activeTab, setActiveTab] = useState('cost');

  // Single painting state (Stage 01 COST)
  const [dims, setDims] = useState({ width: '3', height: '4', unit: 'ft' });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);

  // Batch inventory state (Stage 02 BATCH)
  // Initialized with 5 editable starter rows with sensible placeholder titles and empty dimensions
  const [paintings, setPaintings] = useState(createDefaultBatch);

  // Curation state (Stage 03 CURATE)
  const [curationContext, setCurationContext] = useState(DEFAULT_CURATION_CONTEXT);

  // Subscription model state (Stage 04 SUBSCRIPTION)
  const [subscriptionState, setSubscriptionState] = useState(DEFAULT_SUBSCRIPTION);

  // General & persistence state
  const [loaded, setLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [quoteTitle, setQuoteTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [quotesList, setQuotesList] = useState([]);
  const [showSavedQuotes, setShowSavedQuotes] = useState(false);

  // 1. Initial Load: Read from browser localStorage first, then sync from API if DB configured
  useEffect(() => {
    let cancelled = false;

    const loadInitialState = async () => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          // Load settings & pricing
          const localSettings = window.localStorage.getItem(STORAGE_KEY);
          if (localSettings) {
            const parsed = JSON.parse(localSettings);
            if (parsed.settings) setSettings((s) => ({ ...s, ...parsed.settings }));
            if (parsed.pricing) setPricing((p) => ({ ...p, ...parsed.pricing }));
          }

          // Load batch inventory
          const localBatch = window.localStorage.getItem(STORAGE_KEY_BATCH);
          if (localBatch) {
            const parsedBatch = JSON.parse(localBatch);
            if (Array.isArray(parsedBatch) && parsedBatch.length > 0) {
              setPaintings(parsedBatch);
            }
          }

          // Load curation context
          const localCuration = window.localStorage.getItem(STORAGE_KEY_CURATION);
          if (localCuration) {
            const parsedCuration = JSON.parse(localCuration);
            setCurationContext((prev) => ({ ...prev, ...parsedCuration }));
          }

          // Load subscription state
          const localSubscription = window.localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
          if (localSubscription) {
            const parsedSubscription = JSON.parse(localSubscription);
            setSubscriptionState((prev) => ({
              ...prev,
              ...parsedSubscription,
              operatingCosts: {
                ...prev.operatingCosts,
                ...(parsedSubscription.operatingCosts || {}),
              },
            }));
          }

          // Load quotes list
          const savedQuotesLocal = window.localStorage.getItem(STORAGE_KEY_QUOTES);
          if (savedQuotesLocal) {
            setQuotesList(JSON.parse(savedQuotesLocal));
          }
        }
      } catch (err) {
        console.warn('LocalStorage read error:', err);
      }

      // Sync settings from Database API if available
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setDbConnected(Boolean(data.dbConnected));
            if (data.dbConnected && data.settings) {
              setSettings((s) => ({ ...s, ...data.settings }));
            }
            if (data.dbConnected && data.pricing) {
              setPricing((p) => ({ ...p, ...data.pricing }));
            }
          }
        }

        if (res.ok) {
          const quotesRes = await fetch('/api/quotes');
          if (quotesRes.ok) {
            const qData = await quotesRes.json();
            if (!cancelled && qData.quotes) {
              setQuotesList(qData.quotes);
            }
          }
        }
      } catch {
        // Standalone local mode continues seamlessly
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadInitialState();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Persist to localStorage whenever state changes
  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, pricing }));
      window.localStorage.setItem(STORAGE_KEY_BATCH, JSON.stringify(paintings));
      window.localStorage.setItem(STORAGE_KEY_CURATION, JSON.stringify(curationContext));
      window.localStorage.setItem(STORAGE_KEY_SUBSCRIPTION, JSON.stringify(subscriptionState));
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  }, [settings, pricing, paintings, curationContext, subscriptionState, loaded]);

  // Settings update helper
  const setField = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }));

  // Extra line items helpers
  const addExtra = () => {
    setSettings((s) => ({
      ...s,
      extraComponents: [
        ...s.extraComponents,
        {
          id: `extra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: '',
          unit: 'unit',
          quantity: 1,
          rate: 0,
          enabled: true,
        },
      ],
    }));
  };

  const updateExtra = (id, key, value) => {
    setSettings((s) => ({
      ...s,
      extraComponents: s.extraComponents.map((c) => (c.id === id ? { ...c, [key]: value } : c)),
    }));
  };

  const removeExtra = (id) => {
    setSettings((s) => ({ ...s, extraComponents: s.extraComponents.filter((c) => c.id !== id) }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setPricing(DEFAULT_PRICING);
  };

  // Cloud sync settings to DB
  const saveSettingsToCloud = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, pricing }),
      });
      if (res.ok) {
        const data = await res.json();
        setDbConnected(Boolean(data.dbConnected));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2500);
      } else {
        setSaveStatus('');
      }
    } catch {
      setSaveStatus('');
    }
  };

  /* -----------------------------------------------------------------------
   * CENTRALIZED ENGINE: Calculations for each layer
   * ---------------------------------------------------------------------*/

  // 1. Single Artwork calculation (COST Stage)
  const singleResult = useMemo(() => {
    return calculatePaintingCost(dims, settings);
  }, [dims, settings]);

  const pricingResult = useMemo(() => {
    if (!singleResult.isValid) return null;
    return calculatePricing(singleResult.totalProductionCost, pricing);
  }, [singleResult, pricing]);

  // 2. Batch summary calculation (BATCH Stage)
  const batchSummary = useMemo(() => {
    return calculateBatchSummary(paintings, settings);
  }, [paintings, settings]);

  // 3. Curated summary calculation (CURATE Stage)
  const curatedPaintings = useMemo(() => {
    const selectedSet = new Set(curationContext.selectedPaintingIds);
    return batchSummary.calculatedPaintings.filter((p) => selectedSet.has(p.id) && p.cost.isValid);
  }, [batchSummary, curationContext.selectedPaintingIds]);

  const curatedSummary = useMemo(() => {
    return calculateBatchSummary(curatedPaintings, settings);
  }, [curatedPaintings, settings]);

  // 4. Subscription economics calculation (SUBSCRIPTION Stage)
  const subscriptionEconomics = useMemo(() => {
    return calculateSubscriptionEconomics({
      initialInvestment: curatedSummary.totalProductionCost,
      monthlySubscription: subscriptionState.monthlySubscription,
      operatingCosts: subscriptionState.operatingCosts,
    });
  }, [curatedSummary.totalProductionCost, subscriptionState]);

  const symbol = settings.currencySymbol || '₹';
  const decimals = num(settings.decimals, 0);
  const money = (v) => fmtCurrency(v, symbol, decimals);

  /* -----------------------------------------------------------------------
   * Batch Management Handlers
   * ---------------------------------------------------------------------*/
  const handleUpdatePainting = (id, field, value) => {
    setPaintings((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddPainting = () => {
    setPaintings((prev) => [...prev, createEmptyPainting(prev.length + 1)]);
  };

  const handleDuplicatePainting = (id) => {
    const target = paintings.find((p) => p.id === id);
    if (!target) return;
    const copy = {
      ...target,
      id: makeId('p'),
      title: `${target.title || 'Artwork'} (Copy)`,
    };
    setPaintings((prev) => [...prev, copy]);
  };

  const handleRemovePainting = (id) => {
    setPaintings((prev) => prev.filter((p) => p.id !== id));
    setCurationContext((prev) => ({
      ...prev,
      selectedPaintingIds: prev.selectedPaintingIds.filter((selId) => selId !== id),
    }));
  };

  /* -----------------------------------------------------------------------
   * Curation Management Handlers
   * ---------------------------------------------------------------------*/
  const handleUpdateCurationContext = (field, value) => {
    setCurationContext((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSelectPainting = (id) => {
    setCurationContext((prev) => {
      const isSelected = prev.selectedPaintingIds.includes(id);
      return {
        ...prev,
        selectedPaintingIds: isSelected
          ? prev.selectedPaintingIds.filter((x) => x !== id)
          : [...prev.selectedPaintingIds, id],
      };
    });
  };

  const handleSelectAllValid = () => {
    const validIds = batchSummary.calculatedPaintings
      .filter((p) => p.cost.isValid)
      .map((p) => p.id);
    setCurationContext((prev) => ({ ...prev, selectedPaintingIds: validIds }));
  };

  const handleDeselectAll = () => {
    setCurationContext((prev) => ({ ...prev, selectedPaintingIds: [] }));
  };

  /* -----------------------------------------------------------------------
   * Subscription Management Handlers
   * ---------------------------------------------------------------------*/
  const handleUpdateSubscription = (field, value) => {
    setSubscriptionState((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateOperatingCost = (key, value) => {
    setSubscriptionState((prev) => ({
      ...prev,
      operatingCosts: {
        ...prev.operatingCosts,
        [key]: value,
      },
    }));
  };

  /* -----------------------------------------------------------------------
   * Unified Snapshot Saving
   * ---------------------------------------------------------------------*/
  const saveSnapshot = async (extraPayload = {}) => {
    let snapshotItem;

    if (extraPayload.type === 'subscription_plan') {
      snapshotItem = {
        id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'subscription_plan',
        title: extraPayload.title || `${curationContext.collectionName || 'Collection'} Subscription`,
        clientName: curationContext.clientName || null,
        status: 'draft',
        createdAt: new Date().toISOString(),
        curationContext,
        curatedPaintingsCount: curatedSummary.validCount,
        curatedTotalArea: curatedSummary.totalArea,
        initialInvestment: subscriptionEconomics.initialInvestment,
        monthlySubscription: subscriptionEconomics.monthlySubscription,
        monthlyOperatingCosts: subscriptionEconomics.monthlyOperatingCosts,
        monthlyContribution: subscriptionEconomics.monthlyContribution,
        simpleRecoveryMonths: subscriptionEconomics.simpleRecoveryMonths,
        estimatedRecoveryMonths: subscriptionEconomics.estimatedRecoveryMonths,
        scenarios: subscriptionEconomics.scenarios,
        settingsSnapshot: { ...settings },
      };
    } else {
      // Single artwork quote (maintains 100% backward compatibility)
      if (!singleResult.isValid || !pricingResult) return;
      snapshotItem = {
        id: `quote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'single_artwork',
        title: quoteTitle.trim() || `Quote for ${dims.width}×${dims.height} ${dims.unit}`,
        clientName: clientName.trim() || null,
        status: 'draft',
        width: singleResult.width,
        height: singleResult.height,
        unit: dims.unit,
        widthFt: singleResult.wFt,
        heightFt: singleResult.hFt,
        areaSqFt: singleResult.areaSqFt,
        perimeterFt: singleResult.perimeterRunningFt,
        subtotalCost: singleResult.subtotal,
        transportCost: singleResult.transportationCost,
        totalCost: singleResult.totalProductionCost,
        costPerSqFt: singleResult.costPerSqFt,
        pricingMethod: pricing.method,
        pricingMarkupPct: pricing.method === 'markup' ? num(pricing.markupPercent) : null,
        pricingMarginPct: pricing.method === 'margin' ? num(pricing.marginPercent) : null,
        profit: pricingResult.profit,
        sellingPrice: pricingResult.sellingPrice,
        breakdownSnapshot: singleResult.rows,
        settingsSnapshot: { ...settings, pricing },
        createdAt: new Date().toISOString(),
      };
    }

    if (dbConnected && snapshotItem.type === 'single_artwork') {
      try {
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshotItem),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.quote) {
            setQuotesList((prev) => [data.quote, ...prev]);
          }
        }
      } catch (err) {
        console.warn('DB quote save error:', err);
      }
    } else {
      const updatedList = [snapshotItem, ...quotesList];
      setQuotesList(updatedList);
      try {
        window.localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Failed to save quote locally:', e);
      }
    }

    if (extraPayload.type !== 'subscription_plan') {
      setQuoteTitle('');
      setClientName('');
    }
    alert('Snapshot saved successfully!');
  };

  return (
    <div style={{ backgroundColor: C.paper, minHeight: '100vh', fontFamily: FONT_BODY, color: C.ink }}>
      <div className="pcc max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Top App Header */}
        <header className="flex items-start justify-between gap-4 flex-wrap pb-6 mb-8 border-b" style={{ borderColor: C.rule }}>
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Painting Production Cost Calculator
            </h1>
            <p className="mt-1 text-sm max-w-xl" style={{ color: C.inkMuted }}>
              Internal ARTNCE tool for artwork costing, batch evaluation, collection curation, and subscription-model planning.
            </p>
          </div>
          <div style={{ fontFamily: FONT_MONO, textAlign: 'right' }}>
            <div className="text-xs font-semibold" style={{ color: C.ink }}>ARTNCE</div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Internal Business Planning</div>
            <div className="mt-2 flex items-center justify-end gap-2 text-xs">
              {dbConnected ? (
                <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                  <Database size={12} /> PostgreSQL Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded text-[11px]">
                  <HardDrive size={12} /> Local Storage Mode
                </span>
              )}
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="flex items-center gap-1 text-xs px-2 py-0.5 transition-colors font-sans"
                style={{ border: `1px solid ${C.rule}`, color: C.ink, backgroundColor: C.paperDark }}
              >
                <SlidersHorizontal size={11} style={{ color: C.rust }} /> Settings
              </button>
            </div>
          </div>
        </header>

        {/* Primary Pipeline Navigation: 01 COST → 02 BATCH → 03 CURATE → 04 SUBSCRIPTION */}
        <nav className="mb-10 overflow-x-auto">
          <div
            className="inline-flex items-center gap-1 sm:gap-2 p-1.5 rounded"
            style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}`, minWidth: '600px' }}
          >
            {/* Step 01: COST */}
            <button
              type="button"
              onClick={() => setActiveTab('cost')}
              className="flex-1 px-4 py-2 text-left rounded transition-colors text-xs flex items-center justify-between gap-3"
              style={{
                backgroundColor: activeTab === 'cost' ? C.ink : 'transparent',
                color: activeTab === 'cost' ? C.paper : C.ink,
              }}
            >
              <div>
                <span className="font-mono text-[10px] block opacity-70">01 COST</span>
                <span className="font-medium text-sm">Single Artwork</span>
              </div>
            </button>

            <span className="text-stone-400 font-mono text-xs px-1">→</span>

            {/* Step 02: BATCH */}
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className="flex-1 px-4 py-2 text-left rounded transition-colors text-xs flex items-center justify-between gap-3"
              style={{
                backgroundColor: activeTab === 'batch' ? C.ink : 'transparent',
                color: activeTab === 'batch' ? C.paper : C.ink,
              }}
            >
              <div>
                <span className="font-mono text-[10px] block opacity-70">02 BATCH</span>
                <span className="font-medium text-sm">Artwork Pool</span>
              </div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: activeTab === 'batch' ? 'rgba(255,255,255,0.15)' : C.paper,
                  color: activeTab === 'batch' ? C.paper : C.inkMuted,
                }}
              >
                {batchSummary.validCount}
              </span>
            </button>

            <span className="text-stone-400 font-mono text-xs px-1">→</span>

            {/* Step 03: CURATE */}
            <button
              type="button"
              onClick={() => setActiveTab('curate')}
              className="flex-1 px-4 py-2 text-left rounded transition-colors text-xs flex items-center justify-between gap-3"
              style={{
                backgroundColor: activeTab === 'curate' ? C.ink : 'transparent',
                color: activeTab === 'curate' ? C.paper : C.ink,
              }}
            >
              <div>
                <span className="font-mono text-[10px] block opacity-70">03 CURATE</span>
                <span className="font-medium text-sm">Client Collection</span>
              </div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: activeTab === 'curate' ? 'rgba(255,255,255,0.15)' : C.paper,
                  color: activeTab === 'curate' ? C.paper : C.inkMuted,
                }}
              >
                {curationContext.selectedPaintingIds.length}
              </span>
            </button>

            <span className="text-stone-400 font-mono text-xs px-1">→</span>

            {/* Step 04: SUBSCRIPTION */}
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className="flex-1 px-4 py-2 text-left rounded transition-colors text-xs flex items-center justify-between gap-3"
              style={{
                backgroundColor: activeTab === 'subscription' ? C.ink : 'transparent',
                color: activeTab === 'subscription' ? C.paper : C.ink,
              }}
            >
              <div>
                <span className="font-mono text-[10px] block opacity-70">04 SUBSCRIPTION</span>
                <span className="font-medium text-sm">Lease Economics</span>
              </div>
            </button>
          </div>
        </nav>

        {/* Global Cost Settings Drawer */}
        {settingsOpen && (
          <div className="mb-10 p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paperDark }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
              <div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.2rem', fontWeight: 600 }}>Central Cost Settings</h2>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  Changes here automatically propagate across Single Artwork, Batch, Curated Selection, and Subscription Investment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="text-xs px-3 py-1.5 font-medium"
                style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}
              >
                Done
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <SettingsGroup title="General">
                  <div className="grid grid-cols-2 gap-4">
                    <TextInput label="Currency symbol" value={settings.currencySymbol} onChange={setField('currencySymbol')} />
                    <div>
                      <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>Display precision</span>
                      <Segmented
                        options={[{ value: 0, label: 'Whole ₹' }, { value: 2, label: '₹.xx' }]}
                        value={num(settings.decimals, 0)}
                        onChange={setField('decimals')}
                      />
                    </div>
                  </div>
                </SettingsGroup>

                <SettingsGroup
                  title="Canvas Printing"
                  right={<Toggle checked={settings.canvasEnabled} onChange={setField('canvasEnabled')} label="Include" />}
                >
                  <RateInput label="Print rate" value={settings.canvasPrintRate} onChange={setField('canvasPrintRate')} suffix="/ sq ft" />
                </SettingsGroup>

                <SettingsGroup
                  title="External Frame"
                  right={<Toggle checked={settings.frameEnabled} onChange={setField('frameEnabled')} label="Include" />}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <TextInput label="Frame type" value={settings.frameType} onChange={setField('frameType')} />
                    <RateInput label="Frame rate" value={settings.frameRate} onChange={setField('frameRate')} suffix="/ running ft" />
                  </div>
                </SettingsGroup>
              </div>

              <div>
                <SettingsGroup
                  title="Stretching & Support"
                  note="Combined avoids double-counting the middle support beam"
                  right={<Toggle checked={settings.stretchEnabled} onChange={setField('stretchEnabled')} label="Include" />}
                >
                  <div className="mb-4">
                    <Segmented
                      options={[{ value: 'combined', label: 'Combined' }, { value: 'separate', label: 'Separate' }]}
                      value={settings.stretchMode}
                      onChange={setField('stretchMode')}
                    />
                  </div>
                  {settings.stretchMode === 'combined' ? (
                    <RateInput label="Stretching + support rate" value={settings.combinedRate} onChange={setField('combinedRate')} suffix="/ running ft" />
                  ) : (
                    <div className="space-y-4">
                      <RateInput label="Stretching rate" value={settings.stretchOnlyRate} onChange={setField('stretchOnlyRate')} suffix="/ running ft" />
                      <RateInput label="Support beam rate" value={settings.beamRate} onChange={setField('beamRate')} suffix="/ running ft" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>Beam spans</span>
                          <select
                            value={settings.beamFormula}
                            onChange={(e) => setField('beamFormula')(e.target.value)}
                            className="w-full bg-transparent border-b py-1.5 text-sm outline-none"
                            style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_MONO }}
                          >
                            <option value="shorter">Shorter side</option>
                            <option value="longer">Longer side</option>
                            <option value="width">Width</option>
                            <option value="height">Height</option>
                            <option value="none">No beam</option>
                          </select>
                        </div>
                        <RateInput label="Required when larger side ≥" value={settings.beamThreshold} onChange={setField('beamThreshold')} suffix="ft" />
                      </div>
                    </div>
                  )}
                </SettingsGroup>

                <SettingsGroup title="Transportation" note="Applied to subtotal, never to final total">
                  <RateInput label="Transport rate" value={settings.transportPercent} onChange={setField('transportPercent')} suffix="% of subtotal" />
                </SettingsGroup>
              </div>
            </div>

            {/* Additional Components */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: C.rule }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkMuted }}>
                  Additional Cost Components
                </span>
                <button
                  type="button"
                  onClick={addExtra}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: C.rust }}
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {settings.extraComponents.map((c) => (
                  <div key={c.id} className="grid gap-2" style={{ gridTemplateColumns: '1fr 70px 70px 80px 24px' }}>
                    <input
                      value={c.name}
                      onChange={(e) => updateExtra(c.id, 'name', e.target.value)}
                      placeholder="e.g. Varnish"
                      className="bg-transparent border-b py-1 text-sm outline-none"
                      style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
                    />
                    <input
                      value={c.unit}
                      onChange={(e) => updateExtra(c.id, 'unit', e.target.value)}
                      placeholder="unit"
                      className="bg-transparent border-b py-1 text-sm outline-none"
                      style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
                    />
                    <input
                      type="number"
                      step="any"
                      value={c.quantity}
                      onChange={(e) => updateExtra(c.id, 'quantity', e.target.value)}
                      className="bg-transparent border-b py-1 text-sm outline-none tabular font-mono"
                      style={{ borderColor: C.rule, color: C.ink }}
                    />
                    <input
                      type="number"
                      step="any"
                      value={c.rate}
                      onChange={(e) => updateExtra(c.id, 'rate', e.target.value)}
                      className="bg-transparent border-b py-1 text-sm outline-none tabular font-mono"
                      style={{ borderColor: C.rule, color: C.ink }}
                    />
                    <button type="button" onClick={() => removeExtra(c.id)} style={{ color: C.inkMuted }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-4 border-t flex items-center justify-between flex-wrap gap-4" style={{ borderColor: C.rule }}>
              <div className="text-xs" style={{ color: C.inkMuted }}>
                Rates are saved locally. {dbConnected ? 'Database cloud sync active.' : ''}
              </div>
              <div className="flex items-center gap-2">
                {dbConnected && (
                  <button
                    type="button"
                    onClick={saveSettingsToCloud}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium"
                    style={{ backgroundColor: C.ink, color: C.paper }}
                  >
                    {saveStatus === 'saving' ? (
                      'Saving...'
                    ) : saveStatus === 'saved' ? (
                      <>
                        <Check size={13} /> Saved to DB
                      </>
                    ) : (
                      <>
                        <Save size={13} /> Save to Cloud DB
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={resetSettings}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5"
                  style={{ border: `1px solid ${C.rule}`, color: C.inkMuted, backgroundColor: C.paper }}
                >
                  <RotateCcw size={13} /> Reset to defaults
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
         * STAGE 01: COST (Single Artwork Calculator - Fully Preserved)
         * -----------------------------------------------------------------*/}
        {activeTab === 'cost' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Input & Settings Button */}
            <div className="lg:col-span-5">
              <div className="p-6" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600 }}>Painting Dimensions</h2>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <DimField
                    label="Width"
                    value={dims.width}
                    onChange={(v) => setDims((d) => ({ ...d, width: v }))}
                    suffix={dims.unit}
                    error={dims.width !== '' && !singleResult.isValid && (!Number.isFinite(parseFloat(dims.width)) || parseFloat(dims.width) <= 0) ? 'Must be > 0' : null}
                  />
                  <DimField
                    label="Height"
                    value={dims.height}
                    onChange={(v) => setDims((d) => ({ ...d, height: v }))}
                    suffix={dims.unit}
                    error={dims.height !== '' && !singleResult.isValid && (!Number.isFinite(parseFloat(dims.height)) || parseFloat(dims.height) <= 0) ? 'Must be > 0' : null}
                  />
                </div>
                <div className="mt-2">
                  <span className="block text-sm mb-1.5" style={{ color: C.inkMuted }}>Unit</span>
                  <Segmented
                    options={[{ value: 'ft', label: 'Feet' }, { value: 'in', label: 'Inches' }]}
                    value={dims.unit}
                    onChange={(u) => setDims((d) => ({ ...d, unit: u }))}
                  />
                </div>
                {(dims.width === '' || dims.height === '') && (
                  <p className="mt-4 text-xs" style={{ color: C.inkMuted }}>Enter width and height to calculate production cost.</p>
                )}
              </div>

              {/* Quick Jump to Batch */}
              <div className="mt-4 p-4 border flex items-center justify-between" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
                <div>
                  <div className="text-xs font-semibold" style={{ color: C.ink }}>Need to cost multiple artworks?</div>
                  <div className="text-xs" style={{ color: C.inkMuted }}>Use Batch mode to calculate a collection inventory</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('batch')}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 font-medium"
                  style={{ backgroundColor: C.ink, color: C.paper }}
                >
                  Batch Mode <ArrowRight size={12} />
                </button>
              </div>

              {/* Saved Quotes Trigger */}
              {quotesList.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowSavedQuotes(!showSavedQuotes)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs"
                    style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}`, color: C.ink }}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Bookmark size={14} style={{ color: C.rust }} /> Saved History ({quotesList.length})
                    </span>
                    <ChevronDown
                      size={14}
                      style={{ transform: showSavedQuotes ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
                    />
                  </button>

                  {showSavedQuotes && (
                    <div className="p-4 border-t-0 space-y-3 max-h-64 overflow-y-auto" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
                      {quotesList.map((q) => (
                        <div key={q.id} className="text-xs p-2.5 bg-stone-100/80 border border-stone-200">
                          <div className="flex items-center justify-between font-medium">
                            <span>{q.title || 'Untitled Snapshot'}</span>
                            <span style={{ color: C.rust, fontFamily: FONT_MONO }}>
                              {money(q.sellingPrice || q.totalCost || q.initialInvestment)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between" style={{ color: C.inkMuted }}>
                            <span>
                              {q.type === 'subscription_plan'
                                ? `Subscription Plan (${q.curatedPaintingsCount || 0} Artworks)`
                                : `${q.width}×${q.height} ${q.unit} (${fmtNum(q.areaSqFt)} sq ft)`}
                            </span>
                            <span className="text-[10px]">{new Date(q.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Single Results */}
            <div className="lg:col-span-7">
              {!singleResult.isValid ? (
                <div
                  className="p-8 flex items-center justify-center text-center"
                  style={{ border: `1px dashed ${C.rule}`, minHeight: 240 }}
                >
                  <p style={{ color: C.inkMuted }}>Enter valid painting dimensions on the left to see the costing.</p>
                </div>
              ) : (
                <>
                  <div className="p-6" style={{ border: `1px solid ${C.rule}` }}>
                    <h2 className="text-sm font-medium mb-4" style={{ fontFamily: FONT_BODY, color: C.inkMuted }}>
                      Dimensions Summary
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <Stat label="Width" value={`${fmtNum(singleResult.wFt)} ft`} />
                      <Stat label="Height" value={`${fmtNum(singleResult.hFt)} ft`} />
                      <Stat label="Area" value={`${fmtNum(singleResult.areaSqFt)} sq ft`} />
                      <Stat label="Perimeter" value={`${fmtNum(singleResult.perimeterRunningFt)} running ft`} />
                    </div>
                  </div>

                  <div className="mt-6 p-6" style={{ border: `1px solid ${C.rule}` }}>
                    <h2 className="text-sm font-medium mb-4" style={{ fontFamily: FONT_BODY, color: C.inkMuted }}>
                      Cost Breakdown
                    </h2>
                    <table>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
                          <th className="text-left text-xs font-medium pb-2" style={{ color: C.inkMuted }}>Component</th>
                          <th className="text-left text-xs font-medium pb-2" style={{ color: C.inkMuted }}>Calculation</th>
                          <th className="text-right text-xs font-medium pb-2" style={{ color: C.inkMuted }}>Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {singleResult.rows.map((r) => (
                          <tr key={r.id} style={{ borderBottom: `1px solid ${C.rule}` }}>
                            <td className="py-2.5 text-sm">{r.name}</td>
                            <td className="py-2.5 text-xs tabular" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>{r.formula}</td>
                            <td className="py-2.5 text-sm text-right tabular" style={{ fontFamily: FONT_MONO }}>{money(r.cost)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
                          <td className="py-2.5 text-sm" style={{ color: C.inkMuted }}>Subtotal</td>
                          <td className="py-2.5 text-xs" style={{ color: C.inkMuted }}>Before transportation</td>
                          <td className="py-2.5 text-sm text-right tabular" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>{money(singleResult.subtotal)}</td>
                        </tr>
                        <tr style={{ borderBottom: `1px dashed ${C.rule}` }}>
                          <td className="py-2.5 text-sm">Transportation</td>
                          <td className="py-2.5 text-xs tabular" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>
                            {fmtNum(num(settings.transportPercent), 2)}% of subtotal
                          </td>
                          <td className="py-2.5 text-sm text-right tabular" style={{ fontFamily: FONT_MONO }}>{money(singleResult.transportationCost)}</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-base font-semibold" style={{ fontFamily: FONT_DISPLAY }}>Total Production Cost</td>
                          <td></td>
                          <td className="py-3 text-lg text-right font-semibold tabular" style={{ color: C.rust, fontFamily: FONT_MONO }}>
                            {money(singleResult.totalProductionCost)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-6" style={{ backgroundColor: C.ink }}>
                      <div className="text-xs" style={{ color: C.paperDark }}>Total Production Cost</div>
                      <div className="mt-1 tabular" style={{ fontFamily: FONT_MONO, color: C.paper, fontSize: '1.9rem', fontWeight: 600 }}>
                        {money(singleResult.totalProductionCost)}
                      </div>
                    </div>
                    <div className="p-6" style={{ border: `1px solid ${C.rule}` }}>
                      <div className="text-xs" style={{ color: C.inkMuted }}>Cost per Sq Ft</div>
                      <div className="mt-1 tabular" style={{ fontFamily: FONT_MONO, color: C.ink, fontSize: '1.9rem', fontWeight: 600 }}>
                        {money(singleResult.costPerSqFt)}
                      </div>
                    </div>
                  </div>

                  {/* Pricing (Markup / Gross Margin) */}
                  <div className="mt-10 pt-8" style={{ borderTop: `2px solid ${C.rust}` }}>
                    <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600 }}>Client Selling Pricing</h2>
                    <p className="text-sm mt-1 mb-5" style={{ color: C.inkMuted }}>
                      Set a one-time purchase price from production cost. This never feeds back into costing.
                    </p>

                    <div className="flex flex-wrap items-end gap-6 mb-6">
                      <div>
                        <span className="block text-xs mb-1.5" style={{ color: C.inkMuted }}>Pricing Method</span>
                        <Segmented
                          options={[{ value: 'markup', label: 'Markup' }, { value: 'margin', label: 'Gross Margin' }]}
                          value={pricing.method}
                          onChange={(v) => setPricing((p) => ({ ...p, method: v }))}
                        />
                      </div>
                      {pricing.method === 'markup' ? (
                        <RateInput
                          label="Markup"
                          value={pricing.markupPercent}
                          onChange={(v) => setPricing((p) => ({ ...p, markupPercent: v }))}
                          suffix="%"
                        />
                      ) : (
                        <RateInput
                          label="Gross margin"
                          value={pricing.marginPercent}
                          onChange={(v) => setPricing((p) => ({ ...p, marginPercent: v }))}
                          suffix="%"
                        />
                      )}
                    </div>

                    {pricingResult && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
                        <Stat label="Production Cost" value={money(pricingResult.cost)} />
                        <Stat label="Profit" value={money(pricingResult.profit)} />
                        <Stat label="Selling Price" value={money(pricingResult.sellingPrice)} size="lg" />
                        <Stat label="Margin" value={`${fmtNum(pricingResult.marginPct, 1)}%`} />
                      </div>
                    )}

                    {/* Save Quote Box */}
                    <div className="mt-6 p-4 border" style={{ borderColor: C.rule }}>
                      <h3 className="text-xs font-semibold mb-2" style={{ color: C.inkMuted }}>SAVE THIS QUOTE</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <TextInput
                          label="Quote Title (Optional)"
                          value={quoteTitle}
                          onChange={setQuoteTitle}
                          placeholder="e.g. Gallery Landscape"
                        />
                        <TextInput
                          label="Client Name (Optional)"
                          value={clientName}
                          onChange={setClientName}
                          placeholder="e.g. Client X"
                        />
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => saveSnapshot()}
                            className="w-full py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            style={{ backgroundColor: C.rust, color: '#fff' }}
                          >
                            <Bookmark size={13} /> Save Snapshot
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
         * STAGE 02: BATCH (Artwork Pool Inventory)
         * -----------------------------------------------------------------*/}
        {activeTab === 'batch' && (
          <BatchView
            paintings={paintings}
            onUpdatePainting={handleUpdatePainting}
            onAddPainting={handleAddPainting}
            onDuplicatePainting={handleDuplicatePainting}
            onRemovePainting={handleRemovePainting}
            batchSummary={batchSummary}
            settings={settings}
            onNavigateToCurate={() => setActiveTab('curate')}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        {/* -------------------------------------------------------------------
         * STAGE 03: CURATE (Client Collection Selection)
         * -----------------------------------------------------------------*/}
        {activeTab === 'curate' && (
          <CurateView
            paintings={batchSummary.calculatedPaintings}
            curationContext={curationContext}
            onUpdateContext={handleUpdateCurationContext}
            curatedSummary={curatedSummary}
            selectedCount={curatedPaintings.length}
            onToggleSelectPainting={handleToggleSelectPainting}
            onSelectAll={handleSelectAllValid}
            onDeselectAll={handleDeselectAll}
            settings={settings}
            onNavigateToSubscription={() => setActiveTab('subscription')}
            onNavigateToBatch={() => setActiveTab('batch')}
          />
        )}

        {/* -------------------------------------------------------------------
         * STAGE 04: SUBSCRIPTION (Lease Economics & Recovery Scenarios)
         * -----------------------------------------------------------------*/}
        {activeTab === 'subscription' && (
          <SubscriptionView
            curatedSummary={curatedSummary}
            curationContext={curationContext}
            subscriptionState={subscriptionState}
            onUpdateSubscription={handleUpdateSubscription}
            onUpdateOperatingCost={handleUpdateOperatingCost}
            subscriptionEconomics={subscriptionEconomics}
            settings={settings}
            onSaveSnapshot={saveSnapshot}
            onNavigateToCurate={() => setActiveTab('curate')}
          />
        )}
      </div>
    </div>
  );
}
