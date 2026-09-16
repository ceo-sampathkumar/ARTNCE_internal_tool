'use client';

import React from 'react';
import {
  Plus,
  Copy,
  Trash2,
  ArrowRight,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DESIGN_TOKENS as C,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  fmtNum,
  fmtCurrency,
} from '@/lib/calculator';
import { makeId } from '@/lib/defaults';

export default function BatchView({
  paintings,
  onUpdatePainting,
  onAddPainting,
  onDuplicatePainting,
  onRemovePainting,
  batchSummary,
  settings,
  onNavigateToCurate,
  onOpenSettings,
}) {
  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  return (
    <div className="space-y-8">
      {/* Batch Metrics Summary Banner */}
      <div
        className="p-6 transition-all"
        style={{
          backgroundColor: C.paperDark,
          border: `1px solid ${C.rule}`,
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4 pb-3 border-b" style={{ borderColor: C.rule }}>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
              Batch Production Summary
            </div>
            <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
              Aggregated across all valid paintings using central ARTNCE cost benchmarks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 transition-colors"
              style={{ border: `1px solid ${C.rule}`, color: C.ink, backgroundColor: C.paper }}
            >
              <SlidersHorizontal size={13} style={{ color: C.rust }} /> Cost Rates & Settings
            </button>
            <button
              type="button"
              onClick={onAddPainting}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium transition-colors"
              style={{ backgroundColor: C.ink, color: C.paper }}
            >
              <Plus size={13} /> Add Painting
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Artworks</div>
            <div
              className="tabular mt-1 text-2xl font-semibold"
              style={{ fontFamily: FONT_MONO, color: C.ink }}
            >
              {batchSummary.validCount} <span className="text-sm font-normal text-stone-500">/ {batchSummary.count}</span>
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Total Area</div>
            <div
              className="tabular mt-1 text-2xl font-semibold"
              style={{ fontFamily: FONT_MONO, color: C.ink }}
            >
              {fmtNum(batchSummary.totalArea, 1)} <span className="text-sm font-normal text-stone-500">sq ft</span>
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Total Production Cost</div>
            <div
              className="tabular mt-1 text-2xl font-semibold"
              style={{ fontFamily: FONT_MONO, color: C.rust }}
            >
              {money(batchSummary.totalProductionCost)}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Avg Cost / Artwork</div>
            <div
              className="tabular mt-1 text-2xl font-semibold"
              style={{ fontFamily: FONT_MONO, color: C.ink }}
            >
              {money(batchSummary.avgCostPerArtwork)}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Avg Cost / Sq Ft</div>
            <div
              className="tabular mt-1 text-2xl font-semibold"
              style={{ fontFamily: FONT_MONO, color: C.ink }}
            >
              {money(batchSummary.avgCostPerSqFt)}
            </div>
          </div>
        </div>
      </div>

      {/* Paintings Table / List */}
      <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
        <div className="p-4 flex items-center justify-between border-b flex-wrap gap-3" style={{ borderColor: C.rule }}>
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.15rem', fontWeight: 600, color: C.ink }}>
              Artwork Inventory ({paintings.length})
            </h2>
            <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
              Enter dimensions for each artwork. Production cost calculates deterministically in real time.
            </p>
          </div>
          {batchSummary.validCount > 0 && (
            <button
              type="button"
              onClick={onNavigateToCurate}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 font-medium"
              style={{ backgroundColor: C.rust, color: '#fff' }}
            >
              Curate for Client <ArrowRight size={13} />
            </button>
          )}
        </div>

        {paintings.length === 0 ? (
          <div className="p-12 text-center" style={{ color: C.inkMuted }}>
            <p className="text-sm">No artworks in the current batch.</p>
            <button
              type="button"
              onClick={onAddPainting}
              className="mt-3 inline-flex items-center gap-1 text-xs px-3 py-1.5 font-medium"
              style={{ backgroundColor: C.ink, color: C.paper }}
            >
              <Plus size={13} /> Add First Artwork
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 780 }}>
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                  <th className="py-3 px-4 font-medium" style={{ width: '40px' }}>#</th>
                  <th className="py-3 px-4 font-medium" style={{ minWidth: '180px' }}>Artwork Identification</th>
                  <th className="py-3 px-4 font-medium" style={{ minWidth: '180px' }}>Dimensions</th>
                  <th className="py-3 px-4 font-medium text-right" style={{ minWidth: '100px' }}>Area</th>
                  <th className="py-3 px-4 font-medium text-right" style={{ minWidth: '100px' }}>Perimeter</th>
                  <th className="py-3 px-4 font-medium text-right" style={{ minWidth: '130px' }}>Production Cost</th>
                  <th className="py-3 px-4 font-medium text-center" style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchSummary.calculatedPaintings.map((p, index) => {
                  const { cost } = p;
                  const hasDimensions = p.width !== '' || p.height !== '';
                  return (
                    <tr
                      key={p.id}
                      className="text-sm transition-colors hover:bg-stone-50/50"
                      style={{ borderBottom: `1px solid ${C.rule}` }}
                    >
                      {/* Row Index */}
                      <td className="py-3 px-4 tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {String(index + 1).padStart(2, '0')}
                      </td>

                      {/* Artwork Info */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) => onUpdatePainting(p.id, 'title', e.target.value)}
                            placeholder="Artwork Title"
                            className="w-full bg-transparent font-medium border-b border-transparent focus:border-stone-400 outline-none text-sm py-0.5"
                            style={{ color: C.ink, fontFamily: FONT_BODY }}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={p.artist || ''}
                              onChange={(e) => onUpdatePainting(p.id, 'artist', e.target.value)}
                              placeholder="Artist (Optional)"
                              className="w-1/2 bg-transparent border-b border-transparent focus:border-stone-300 outline-none text-xs py-0.5 text-stone-500"
                              style={{ fontFamily: FONT_BODY }}
                            />
                            <input
                              type="text"
                              value={p.category || ''}
                              onChange={(e) => onUpdatePainting(p.id, 'category', e.target.value)}
                              placeholder="Category (Optional)"
                              className="w-1/2 bg-transparent border-b border-transparent focus:border-stone-300 outline-none text-xs py-0.5 text-stone-500"
                              style={{ fontFamily: FONT_BODY }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Dimensions Input */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={p.width}
                            onChange={(e) => onUpdatePainting(p.id, 'width', e.target.value)}
                            placeholder="W"
                            className="w-16 bg-transparent border-b py-1 text-sm outline-none tabular font-mono text-center"
                            style={{ borderColor: C.rule, color: C.ink }}
                          />
                          <span className="text-xs text-stone-400">×</span>
                          <input
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={p.height}
                            onChange={(e) => onUpdatePainting(p.id, 'height', e.target.value)}
                            placeholder="H"
                            className="w-16 bg-transparent border-b py-1 text-sm outline-none tabular font-mono text-center"
                            style={{ borderColor: C.rule, color: C.ink }}
                          />
                          <div
                            className="inline-flex text-xs ml-1"
                            style={{ border: `1px solid ${C.rule}` }}
                          >
                            <button
                              type="button"
                              onClick={() => onUpdatePainting(p.id, 'unit', 'ft')}
                              className="px-1.5 py-0.5"
                              style={{
                                backgroundColor: p.unit === 'ft' ? C.ink : 'transparent',
                                color: p.unit === 'ft' ? C.paper : C.inkMuted,
                              }}
                            >
                              ft
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdatePainting(p.id, 'unit', 'in')}
                              className="px-1.5 py-0.5"
                              style={{
                                backgroundColor: p.unit === 'in' ? C.ink : 'transparent',
                                color: p.unit === 'in' ? C.paper : C.inkMuted,
                              }}
                            >
                              in
                            </button>
                          </div>
                        </div>
                        {hasDimensions && !cost.isValid && (
                          <span className="text-[10px] block mt-0.5 text-amber-700">Enter positive W & H</span>
                        )}
                      </td>

                      {/* Area */}
                      <td className="py-3 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {cost.isValid ? `${fmtNum(cost.areaSqFt, 1)} sq ft` : '—'}
                      </td>

                      {/* Perimeter */}
                      <td className="py-3 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {cost.isValid ? `${fmtNum(cost.perimeterRunningFt, 1)} ft` : '—'}
                      </td>

                      {/* Production Cost */}
                      <td className="py-3 px-4 text-right tabular font-mono font-medium text-sm">
                        {cost.isValid ? (
                          <div>
                            <span style={{ color: C.rust }}>{money(cost.totalProductionCost)}</span>
                            <span className="block text-[10px] text-stone-500 font-normal">
                              {money(cost.costPerSqFt)}/sq ft
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: C.inkMuted }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDuplicatePainting(p.id)}
                            title="Duplicate artwork"
                            className="p-1 hover:text-stone-900 transition-colors"
                            style={{ color: C.inkMuted }}
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemovePainting(p.id)}
                            title="Remove artwork"
                            className="p-1 hover:text-red-700 transition-colors"
                            style={{ color: C.inkMuted }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer actions */}
        <div className="p-4 border-t flex items-center justify-between flex-wrap gap-4" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
          <button
            type="button"
            onClick={onAddPainting}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5"
            style={{ border: `1px solid ${C.rule}`, color: C.ink, backgroundColor: C.paper }}
          >
            <Plus size={13} /> Add Another Artwork
          </button>
          <div className="text-xs" style={{ color: C.inkMuted }}>
            {batchSummary.validCount} calculated of {batchSummary.count} artworks
          </div>
        </div>
      </div>
    </div>
  );
}
