import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Plus, Trash2, RotateCcw } from 'lucide-react';

/* -----------------------------------------------------------------------
 * Design tokens
 * ---------------------------------------------------------------------*/
const C = {
  paper: '#EDEAE2',
  paperDark: '#E2DDD0',
  ink: '#221F1C',
  inkMuted: '#5B5445',
  rule: '#CBC3B0',
  rust: '#B8452D',
  danger: '#A3291B',
};
const FONT_DISPLAY = "'Fraunces', Georgia, serif";
const FONT_BODY = "'IBM Plex Sans', -apple-system, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

/* -----------------------------------------------------------------------
 * CALCULATION ENGINE — pure, UI-agnostic, formula-driven.
 *
 * Every cost component (canvas, stretching, frame, and anything added
 * later — varnish, labour, packaging, GST, wastage...) is represented
 * the same way: { name, unit, quantity, rate, cost, enabled }. New
 * components can be added to the `extraComponents` list, or new core
 * components can be added to buildBreakdown() below, without touching
 * any rendering code.
 * ---------------------------------------------------------------------*/
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toFeet = (value, unit) => (unit === 'in' ? value / 12 : value);

function geometry(widthFt, heightFt) {
  return {
    area: widthFt * heightFt,
    perimeter: 2 * (widthFt + heightFt),
  };
}

// Stretching + structural support. Two modes:
//  - combined: one perimeter-based rate represents the whole stretching
//    system (bars + any internal support), matching the way the ₹1,200
//    benchmark was originally quoted. This is the default, and it is what
//    prevents the middle support beam from being counted twice.
//  - separate: stretching is priced purely on perimeter, and a support
//    beam is priced and added independently, only when the painting's
//    larger side reaches the configured threshold.
function stretchAndSupport(widthFt, heightFt, perimeter, s) {
  if (s.stretchMode === 'combined') {
    return {
      stretchCost: perimeter * num(s.combinedRate),
      beamLength: 0,
      beamCost: 0,
      rate: num(s.combinedRate),
    };
  }
  const stretchCost = perimeter * num(s.stretchOnlyRate);
  const larger = Math.max(widthFt, heightFt);
  const smaller = Math.min(widthFt, heightFt);
  let beamLength = 0;
  if (s.beamFormula !== 'none' && larger >= num(s.beamThreshold)) {
    beamLength =
      s.beamFormula === 'shorter' ? smaller :
      s.beamFormula === 'longer' ? larger :
      s.beamFormula === 'width' ? widthFt :
      s.beamFormula === 'height' ? heightFt : 0;
  }
  return {
    stretchCost,
    beamLength,
    beamCost: beamLength * num(s.beamRate),
    rate: num(s.stretchOnlyRate),
  };
}

function buildBreakdown(widthFt, heightFt, settings) {
  const { area, perimeter } = geometry(widthFt, heightFt);
  const rows = [];

  if (settings.canvasEnabled) {
    const rate = num(settings.canvasPrintRate);
    rows.push({
      id: 'canvas',
      name: 'Canvas Print',
      formula: `${fmtNum(area)} sq ft × ₹${fmtNum(rate, 3)}`,
      cost: area * rate,
    });
  }

  let stretch = null;
  if (settings.stretchEnabled) {
    stretch = stretchAndSupport(widthFt, heightFt, perimeter, settings);
    rows.push({
      id: 'stretch',
      name: settings.stretchMode === 'combined' ? 'Stretching + Support' : 'Stretching',
      formula: `${fmtNum(perimeter)} running ft × ₹${fmtNum(stretch.rate, 3)}`,
      cost: stretch.stretchCost,
    });
    if (settings.stretchMode === 'separate' && stretch.beamLength > 0) {
      rows.push({
        id: 'beam',
        name: 'Support Beam',
        formula: `${fmtNum(stretch.beamLength)} running ft × ₹${fmtNum(num(settings.beamRate), 3)}`,
        cost: stretch.beamCost,
      });
    }
  }

  if (settings.frameEnabled) {
    const rate = num(settings.frameRate);
    rows.push({
      id: 'frame',
      name: settings.frameType || 'External Frame',
      formula: `${fmtNum(perimeter)} running ft × ₹${fmtNum(rate, 3)}`,
      cost: perimeter * rate,
    });
  }

  (settings.extraComponents || []).forEach((c) => {
    if (!c.enabled) return;
    const q = num(c.quantity);
    const r = num(c.rate);
    rows.push({
      id: c.id,
      name: c.name || 'Custom Component',
      formula: `${fmtNum(q)} ${c.unit || 'unit'} × ₹${fmtNum(r, 3)}`,
      cost: q * r,
    });
  });

  const subtotal = rows.reduce((sum, r) => sum + r.cost, 0);
  // Transportation is a percentage of the subtotal only — never of the
  // final total, which would create a circular calculation.
  const transportCost = subtotal * (num(settings.transportPercent) / 100);
  const total = subtotal + transportCost;

  return { area, perimeter, rows, subtotal, transportCost, total, stretch };
}

/* -----------------------------------------------------------------------
 * Formatting — all rounding happens here, at display time only. Every
 * internal calculation above uses full, unrounded precision.
 * ---------------------------------------------------------------------*/
function fmtNum(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return Number(value.toFixed(decimals)).toLocaleString('en-IN');
}

function fmtCurrency(value, symbol, decimals) {
  if (!Number.isFinite(value)) return '—';
  const rounded = Number(value.toFixed(decimals));
  return `${symbol}${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/* -----------------------------------------------------------------------
 * Defaults — reproduce the 3×4 ft benchmark exactly:
 *   Canvas  12 sq ft × ₹150         = ₹1,800
 *   Stretch 14 run ft × ₹85.714     ≈ ₹1,200
 *   Frame   14 run ft × ₹171.429    ≈ ₹2,400
 *   Subtotal                        = ₹5,400
 *   Transport 2% of subtotal        = ₹108
 *   Total                           = ₹5,508  →  ₹459 / sq ft
 * ---------------------------------------------------------------------*/
const DEFAULT_SETTINGS = {
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

const DEFAULT_PRICING = {
  method: 'markup', // 'markup' | 'margin'
  markupPercent: 40,
  marginPercent: 30,
};

const STORAGE_KEY = 'artnce_painting_cost_settings_v1';

/* -----------------------------------------------------------------------
 * Small building blocks
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

function TextInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
 * Main component
 * ---------------------------------------------------------------------*/
export default function PaintingCostCalculator() {
  const [dims, setDims] = useState({ width: '3', height: '4', unit: 'ft' });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [loaded, setLoaded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load persisted settings once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (window.storage) {
          const res = await window.storage.get(STORAGE_KEY);
          if (!cancelled && res && res.value) {
            const parsed = JSON.parse(res.value);
            if (parsed.settings) setSettings((s) => ({ ...s, ...parsed.settings }));
            if (parsed.pricing) setPricing((p) => ({ ...p, ...parsed.pricing }));
          }
        }
      } catch (e) {
        /* nothing saved yet — defaults stand */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Persist settings + pricing config whenever they change.
  useEffect(() => {
    if (!loaded || !window.storage) return;
    window.storage.set(STORAGE_KEY, JSON.stringify({ settings, pricing })).catch(() => {});
  }, [settings, pricing, loaded]);

  const setField = (key) => (value) => setSettings((s) => ({ ...s, [key]: value }));

  const widthNum = parseFloat(dims.width);
  const heightNum = parseFloat(dims.height);
  const widthValid = dims.width !== '' && Number.isFinite(widthNum) && widthNum > 0;
  const heightValid = dims.height !== '' && Number.isFinite(heightNum) && heightNum > 0;
  const dimsValid = widthValid && heightValid;

  const result = useMemo(() => {
    if (!dimsValid) return null;
    const wFt = toFeet(widthNum, dims.unit);
    const hFt = toFeet(heightNum, dims.unit);
    return { ...buildBreakdown(wFt, hFt, settings), wFt, hFt };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimsValid, widthNum, heightNum, dims.unit, settings]);

  const pricingResult = useMemo(() => {
    if (!result) return null;
    const cost = result.total;
    let sellingPrice;
    if (pricing.method === 'markup') {
      sellingPrice = cost * (1 + num(pricing.markupPercent) / 100);
    } else {
      const m = Math.min(num(pricing.marginPercent), 99);
      sellingPrice = cost / (1 - m / 100);
    }
    const profit = sellingPrice - cost;
    return {
      cost,
      sellingPrice,
      profit,
      marginPct: sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0,
    };
  }, [result, pricing]);

  const symbol = settings.currencySymbol || '₹';
  const decimals = num(settings.decimals, 0);
  const money = (v) => fmtCurrency(v, symbol, decimals);

  const addExtra = () => {
    setSettings((s) => ({
      ...s,
      extraComponents: [
        ...s.extraComponents,
        { id: `extra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: '', unit: 'unit', quantity: 1, rate: 0, enabled: true },
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

  return (
    <div style={{ backgroundColor: C.paper, minHeight: '100%', fontFamily: FONT_BODY, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .pcc * { box-sizing: border-box; }
        .pcc input[type=number] { -moz-appearance: textfield; }
        .tabular { font-variant-numeric: tabular-nums; }
        .pcc table { border-collapse: collapse; width: 100%; }
      `}</style>

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

                  <div className="pt-5 flex items-center justify-between gap-4">
                    <p className="text-xs" style={{ color: C.inkMuted, maxWidth: 220 }}>
                      Rates are saved on this device for next time.
                    </p>
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
              )}
            </div>
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
                  <h2 className="text-sm font-medium mb-4" style={{ fontFamily: FONT_BODY, color: C.inkMuted }}>Dimensions Summary</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <Stat label="Width" value={`${fmtNum(result.wFt)} ft`} />
                    <Stat label="Height" value={`${fmtNum(result.hFt)} ft`} />
                    <Stat label="Area" value={`${fmtNum(result.area)} sq ft`} />
                    <Stat label="Perimeter" value={`${fmtNum(result.perimeter)} running ft`} />
                  </div>
                </div>

                <div className="mt-6 p-6" style={{ border: `1px solid ${C.rule}` }}>
                  <h2 className="text-sm font-medium mb-4" style={{ fontFamily: FONT_BODY, color: C.inkMuted }}>Cost Breakdown</h2>
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
