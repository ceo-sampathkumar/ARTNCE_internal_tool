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
  X,
} from 'lucide-react';
import {
  DESIGN_TOKENS as C,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  DEFAULT_SETTINGS,
  DEFAULT_PRICING,
  STORAGE_KEY,
  num,
  toFeet,
  buildBreakdown,
  calculatePricing,
  fmtNum,
  fmtCurrency,
} from '@/lib/calculator';

/* -----------------------------------------------------------------------
 * Reusable UI Building Blocks (Matching Original Design)
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
 * Main Painting Cost Calculator Component
 * ---------------------------------------------------------------------*/
export default function PaintingCostCalculator() {
  const [dims, setDims] = useState({ width: '3', height: '4', unit: 'ft' });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [loaded, setLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', ''
  const [quoteTitle, setQuoteTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [quotesList, setQuotesList] = useState([]);
  const [showSavedQuotes, setShowSavedQuotes] = useState(false);

  // 1. Initial Load: Read from browser localStorage first, then sync from API if DB configured
  useEffect(() => {
    let cancelled = false;

    const loadInitialState = async () => {
      // Step A: Load from localStorage immediately (fastest, zero-latency)
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = window.localStorage.getItem(STORAGE_KEY);
          if (localData) {
            const parsed = JSON.parse(localData);
            if (parsed.settings) setSettings((s) => ({ ...s, ...parsed.settings }));
            if (parsed.pricing) setPricing((p) => ({ ...p, ...parsed.pricing }));
          }
          const savedQuotesLocal = window.localStorage.getItem('artnce_saved_quotes_v1');
          if (savedQuotesLocal) {
            setQuotesList(JSON.parse(savedQuotesLocal));
          }
        }
      } catch (err) {
        console.warn('LocalStorage read error:', err);
      }

      // Step B: Fetch from Database API if available
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
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

        // Fetch quotes if DB is connected
        if (data.dbConnected) {
          const quotesRes = await fetch('/api/quotes');
          if (quotesRes.ok) {
            const qData = await quotesRes.json();
            if (!cancelled && qData.quotes) {
              setQuotesList(qData.quotes);
            }
          }
        }
      } catch (e) {
        // Database not configured or network offline — standalone mode stands
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    loadInitialState();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Persist to localStorage whenever settings or pricing changes
  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, pricing }));
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  }, [settings, pricing, loaded]);

  // Helper to update specific settings field
  const setField = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }));

  // Validation
  const widthNum = parseFloat(dims.width);
  const heightNum = parseFloat(dims.height);
  const widthValid = dims.width !== '' && Number.isFinite(widthNum) && widthNum > 0;
  const heightValid = dims.height !== '' && Number.isFinite(heightNum) && heightNum > 0;
  const dimsValid = widthValid && heightValid;

  // Cost calculation results (pure engine)
  const result = useMemo(() => {
    if (!dimsValid) return null;
    const wFt = toFeet(widthNum, dims.unit);
    const hFt = toFeet(heightNum, dims.unit);
    return { ...buildBreakdown(wFt, hFt, settings), wFt, hFt };
  }, [dimsValid, widthNum, heightNum, dims.unit, settings]);

  // Pricing calculation results (pure engine)
  const pricingResult = useMemo(() => {
    if (!result) return null;
    return calculatePricing(result.total, pricing);
  }, [result, pricing]);

  const symbol = settings.currencySymbol || '₹';
  const decimals = num(settings.decimals, 0);
  const money = (v) => fmtCurrency(v, symbol, decimals);

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

  // Cloud sync settings to DB if available
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

  // Save current quote snapshot (to DB or localStorage)
  const saveCurrentQuote = async () => {
    if (!result || !pricingResult) return;

    const newQuote = {
      id: `quote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: quoteTitle.trim() || `Quote for ${dims.width}×${dims.height} ${dims.unit}`,
      clientName: clientName.trim() || null,
      status: 'draft',
      width: widthNum,
      height: heightNum,
      unit: dims.unit,
      widthFt: result.wFt,
      heightFt: result.hFt,
      areaSqFt: result.area,
      perimeterFt: result.perimeter,
      subtotalCost: result.subtotal,
      transportCost: result.transportCost,
      totalCost: result.total,
      costPerSqFt: result.total / result.area,
      pricingMethod: pricing.method,
      pricingMarkupPct: pricing.method === 'markup' ? num(pricing.markupPercent) : null,
      pricingMarginPct: pricing.method === 'margin' ? num(pricing.marginPercent) : null,
      profit: pricingResult.profit,
      sellingPrice: pricingResult.sellingPrice,
      breakdownSnapshot: result.rows,
      settingsSnapshot: { ...settings, pricing },
      createdAt: new Date().toISOString(),
    };

    if (dbConnected) {
      try {
        const res = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newQuote),
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
      // Local storage fallback
      const updatedList = [newQuote, ...quotesList];
      setQuotesList(updatedList);
      try {
        window.localStorage.setItem('artnce_saved_quotes_v1', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Failed to save quote locally:', e);
      }
    }

    setQuoteTitle('');
    setClientName('');
    alert('Quote saved successfully!');
  };

  return (
    <div style={{ backgroundColor: C.paper, minHeight: '100vh', fontFamily: FONT_BODY, color: C.ink }}>
      <div className="pcc max-w-5xl mx-auto px-5 sm:px-8 py-10 md:py-14">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
              Painting Production Cost Calculator
            </h1>
            <p className="mt-2 text-sm max-w-md" style={{ color: C.inkMuted }}>
              Enter painting dimensions to calculate complete production costing.
            </p>
          </div>
          <div style={{ fontFamily: FONT_MONO, textAlign: 'right' }}>
            <div className="text-xs font-medium" style={{ color: C.ink }}>ARTNCE</div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Internal costing tool</div>
            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs" style={{ color: C.inkMuted }}>
              {dbConnected ? (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded text-[11px]">
                  <Database size={12} /> PostgreSQL Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-600 bg-stone-200/70 px-2 py-0.5 rounded text-[11px]">
                  <HardDrive size={12} /> Local Storage Mode
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: inputs + settings */}
          <div className="lg:col-span-5">
            <div className="p-6" style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600 }}>Painting Dimensions</h2>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <DimField
                  label="Width"
                  value={dims.width}
                  onChange={(v) => setDims((d) => ({ ...d, width: v }))}
                  suffix={dims.unit}
                  error={dims.width !== '' && !widthValid ? 'Must be greater than 0' : null}
                />
                <DimField
                  label="Height"
                  value={dims.height}
                  onChange={(v) => setDims((d) => ({ ...d, height: v }))}
                  suffix={dims.unit}
                  error={dims.height !== '' && !heightValid ? 'Must be greater than 0' : null}
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
                <p className="mt-4 text-xs" style={{ color: C.inkMuted }}>Enter both width and height to see the costing.</p>
              )}
            </div>

            {/* Cost settings */}
            <div className="mt-6" style={{ border: `1px solid ${C.rule}` }}>
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span>
                  <span className="block text-sm font-medium" style={{ fontFamily: FONT_BODY }}>Cost Settings</span>
                  <span className="block text-xs mt-0.5" style={{ color: C.inkMuted }}>
                    Adjust rates, stretching mode, frame and transport
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  style={{ color: C.inkMuted, transform: settingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
                />
              </button>

              {settingsOpen && (
                <div className="px-6 pb-6">
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

                  <SettingsGroup
                    title="External Frame"
                    right={<Toggle checked={settings.frameEnabled} onChange={setField('frameEnabled')} label="Include" />}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <TextInput label="Frame type" value={settings.frameType} onChange={setField('frameType')} />
                      <RateInput label="Frame rate" value={settings.frameRate} onChange={setField('frameRate')} suffix="/ running ft" />
                    </div>
                  </SettingsGroup>

                  <SettingsGroup title="Transportation" note="Applied to the subtotal, never to the final total">
                    <RateInput label="Transport rate" value={settings.transportPercent} onChange={setField('transportPercent')} suffix="% of subtotal" />
                  </SettingsGroup>

                  <SettingsGroup title="Additional Cost Components" note="Varnish, labour, packaging, GST — add any line item">
                    <div className="overflow-x-auto">
                      <div style={{ minWidth: 420 }}>
                        {settings.extraComponents.length > 0 && (
                          <div className="grid gap-2 mb-1.5" style={{ gridTemplateColumns: '1fr 70px 70px 80px 24px' }}>
                            {['Name', 'Unit', 'Qty', 'Rate', ''].map((h) => (
                              <span key={h} className="text-xs" style={{ color: C.inkMuted }}>{h}</span>
                            ))}
                          </div>
                        )}
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
                                className="bg-transparent border-b py-1 text-sm outline-none tabular"
                                style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_MONO }}
                              />
                              <input
                                type="number"
                                step="any"
                                value={c.rate}
                                onChange={(e) => updateExtra(c.id, 'rate', e.target.value)}
                                className="bg-transparent border-b py-1 text-sm outline-none tabular"
                                style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_MONO }}
                              />
                              <button type="button" onClick={() => removeExtra(c.id)} style={{ color: C.inkMuted }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addExtra}
                      className="flex items-center gap-1.5 text-xs mt-3"
                      style={{ color: C.rust, fontFamily: FONT_BODY }}
                    >
                      <Plus size={14} /> Add component
                    </button>
                  </SettingsGroup>

                  <div className="pt-5 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-xs" style={{ color: C.inkMuted, maxWidth: 220 }}>
                      Rates are saved locally. {dbConnected ? 'Sync to database available.' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      {dbConnected && (
                        <button
                          type="button"
                          onClick={saveSettingsToCloud}
                          disabled={saveStatus === 'saving'}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 whitespace-nowrap font-medium"
                          style={{
                            backgroundColor: C.ink,
                            color: C.paper,
                          }}
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
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 whitespace-nowrap"
                        style={{ border: `1px solid ${C.rule}`, color: C.inkMuted }}
                      >
                        <RotateCcw size={13} /> Reset to defaults
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                    <Bookmark size={14} style={{ color: C.rust }} /> Saved Quotes History ({quotesList.length})
                  </span>
                  <ChevronDown
                    size={14}
                    style={{ transform: showSavedQuotes ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
                  />
                </button>

                {showSavedQuotes && (
                  <div className="p-4 border-t-0 space-y-3 max-h-60 overflow-y-auto" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
                    {quotesList.map((q) => (
                      <div key={q.id} className="text-xs p-2.5 bg-stone-100/80 border border-stone-200">
                        <div className="flex items-center justify-between font-medium">
                          <span>{q.title || 'Untitled Quote'}</span>
                          <span style={{ color: C.rust, fontFamily: FONT_MONO }}>{money(q.sellingPrice || q.totalCost)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between" style={{ color: C.inkMuted }}>
                          <span>
                            {q.width}×{q.height} {q.unit} ({fmtNum(q.areaSqFt)} sq ft)
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

          {/* RIGHT: results */}
          <div className="lg:col-span-7">
            {!result ? (
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
                    <Stat label="Width" value={`${fmtNum(result.wFt)} ft`} />
                    <Stat label="Height" value={`${fmtNum(result.hFt)} ft`} />
                    <Stat label="Area" value={`${fmtNum(result.area)} sq ft`} />
                    <Stat label="Perimeter" value={`${fmtNum(result.perimeter)} running ft`} />
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
                      {result.rows.map((r) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${C.rule}` }}>
                          <td className="py-2.5 text-sm">{r.name}</td>
                          <td className="py-2.5 text-xs tabular" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>{r.formula}</td>
                          <td className="py-2.5 text-sm text-right tabular" style={{ fontFamily: FONT_MONO }}>{money(r.cost)}</td>
                        </tr>
                      ))}
                      <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
                        <td className="py-2.5 text-sm" style={{ color: C.inkMuted }}>Subtotal</td>
                        <td className="py-2.5 text-xs" style={{ color: C.inkMuted }}>Before transportation</td>
                        <td className="py-2.5 text-sm text-right tabular" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>{money(result.subtotal)}</td>
                      </tr>
                      <tr style={{ borderBottom: `1px dashed ${C.rule}` }}>
                        <td className="py-2.5 text-sm">Transportation</td>
                        <td className="py-2.5 text-xs tabular" style={{ color: C.inkMuted, fontFamily: FONT_MONO }}>
                          {fmtNum(num(settings.transportPercent), 2)}% of subtotal
                        </td>
                        <td className="py-2.5 text-sm text-right tabular" style={{ fontFamily: FONT_MONO }}>{money(result.transportCost)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-base font-semibold" style={{ fontFamily: FONT_DISPLAY }}>Total Production Cost</td>
                        <td></td>
                        <td className="py-3 text-lg text-right font-semibold tabular" style={{ color: C.rust, fontFamily: FONT_MONO }}>
                          {money(result.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-6" style={{ backgroundColor: C.ink }}>
                    <div className="text-xs" style={{ color: C.paperDark }}>Total Production Cost</div>
                    <div className="mt-1 tabular" style={{ fontFamily: FONT_MONO, color: C.paper, fontSize: '1.9rem', fontWeight: 600 }}>
                      {money(result.total)}
                    </div>
                  </div>
                  <div className="p-6" style={{ border: `1px solid ${C.rule}` }}>
                    <div className="text-xs" style={{ color: C.inkMuted }}>Cost per Sq Ft</div>
                    <div className="mt-1 tabular" style={{ fontFamily: FONT_MONO, color: C.ink, fontSize: '1.9rem', fontWeight: 600 }}>
                      {money(result.total / result.area)}
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8" style={{ borderTop: `2px solid ${C.rust}` }}>
                  <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600 }}>Pricing</h2>
                  <p className="text-sm mt-1 mb-5" style={{ color: C.inkMuted }}>
                    Set a selling price from the production cost above. This never feeds back into the costing.
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
                          onClick={saveCurrentQuote}
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
      </div>
    </div>
  );
}
