'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  ArrowRight,
  Sparkles,
  MapPin,
  Building,
  FolderPlus,
  FileText,
  Save,
  CheckCircle2,
  Users,
  Tag,
} from 'lucide-react';
import {
  DESIGN_TOKENS as C,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  fmtNum,
  fmtCurrency,
  findMatchingArtworkPrice,
  calculateCuratedArtworksPricing,
} from '@/lib/calculator';

export default function CurateView({
  paintings = [],
  curationContext,
  onUpdateContext,
  curatedSummary,
  selectedCount,
  onToggleSelectPainting,
  onSelectAll,
  onDeselectAll,
  settings = {},
  artworkPricing,
  curatedClients = [],
  onSaveCuratedClient,
  onSelectCuratedClient,
  onDeleteCuratedClient,
  onNavigateToSubscription,
  onNavigateToBatch,
}) {
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  const totalAvailable = paintings.length;
  const validAvailable = paintings.filter((p) => p.cost?.isValid).length;

  // Selected artworks from inventory
  const curatedArtworksList = useMemo(() => {
    const selectedSet = new Set(curationContext.selectedPaintingIds || []);
    return (paintings || []).filter((p) => selectedSet.has(p.id) && p.cost?.isValid);
  }, [paintings, curationContext.selectedPaintingIds]);

  // Size-Based Artwork Pricing Calculation (Individual evaluation, summed up)
  const sizePricingSummary = useMemo(() => {
    return calculateCuratedArtworksPricing(curatedArtworksList, artworkPricing);
  }, [curatedArtworksList, artworkPricing]);

  const effectiveArtworkInvestment =
    sizePricingSummary.totalArtworkInvestment > 0
      ? sizePricingSummary.totalArtworkInvestment
      : curatedSummary?.totalProductionCost || 0;

  const handleSaveCollection = (silentIfEmpty = false) => {
    if (!curationContext.clientName?.trim()) {
      if (!silentIfEmpty) {
        alert('Please enter a Client Name before saving.');
      }
      return false;
    }
    const clientData = {
      id: curationContext.id || undefined,
      clientName: curationContext.clientName.trim(),
      collectionName: curationContext.collectionName?.trim() || 'Client Collection',
      location: curationContext.location?.trim() || '',
      spaceSqFt: Number(curationContext.spaceSqFt) || 2000,
      artworkCount: Number(curationContext.artworkCount) || selectedCount || (sizePricingSummary.count || 3),
      selectedPaintingIds: curationContext.selectedPaintingIds || [],
      // Size-based pricing details
      totalArtworkInvestment: effectiveArtworkInvestment,
      baseArtworkValue: sizePricingSummary.totalBasePrice,
      commissionValue: sizePricingSummary.totalCommission,
      artworksPricing: sizePricingSummary.items.map((item) => ({
        id: item.id,
        title: item.title,
        width: item.width,
        height: item.height,
        unit: item.unit,
        sizeLabel: item.sizePricing?.sizeLabel,
        basePrice: item.sizePricing?.basePrice,
        commissionPercent: item.sizePricing?.commissionPercent,
        commissionAmount: item.sizePricing?.commissionAmount,
        finalPrice: item.sizePricing?.finalPrice,
      })),
      totalProductionCost: effectiveArtworkInvestment,
      notes: curationContext.notes || '',
      curatorProjectFee: Number(curationContext.curatorProjectFee) || 2000,
    };
    if (onSaveCuratedClient) {
      onSaveCuratedClient(clientData);
    }
    setSaveSuccessMsg(`Client "${clientData.clientName}" saved with size-based artwork pricing! Available in 04 SUBSCRIPTION.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
    return true;
  };

  const handleNavigateToSub = () => {
    if (curationContext.clientName?.trim()) {
      handleSaveCollection(true);
    }
    if (onNavigateToSubscription) {
      onNavigateToSubscription();
    }
  };

  return (
    <div className="space-y-8">
      {/* Curated Collection Summary Banner */}
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
                {curationContext.collectionName || 'Untitled Collection'}
              </span>
              {curationContext.clientName && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: C.paper, color: C.inkMuted }}>
                  for {curationContext.clientName}
                </span>
              )}
            </div>
          </div>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={handleNavigateToSub}
              className="flex items-center gap-1.5 text-xs px-4 py-2 font-medium shadow-sm transition-all"
              style={{ backgroundColor: C.rust, color: '#fff' }}
            >
              Model Subscription Economics <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* 5-Card Economics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Selected Artworks</div>
            <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.ink }}>
              {selectedCount} <span className="text-sm font-normal text-stone-500">of {validAvailable}</span>
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Total Curated Area</div>
            <div className="tabular mt-1 text-2xl font-semibold" style={{ fontFamily: FONT_MONO, color: C.ink }}>
              {fmtNum(curatedSummary.totalArea, 1)} <span className="text-sm font-normal text-stone-500">sq ft</span>
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Base Artwork Value</div>
            <div className="tabular mt-1 text-2xl font-semibold font-mono" style={{ color: C.ink }}>
              {money(sizePricingSummary.totalBasePrice)}
            </div>
            <span className="text-[10px] text-gray-500">Size-based baseline</span>
          </div>
          <div>
            <div className="text-xs" style={{ color: C.inkMuted }}>Commission</div>
            <div className="tabular mt-1 text-2xl font-semibold font-mono text-amber-800">
              +{money(sizePricingSummary.totalCommission)}
            </div>
            <span className="text-[10px] text-gray-500">Configured margin</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2.5 rounded bg-white/70 border" style={{ borderColor: C.rule }}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: C.rust }}>
              Total Artwork Investment
            </div>
            <div className="tabular mt-1 text-2xl font-bold" style={{ fontFamily: FONT_MONO, color: C.rust }}>
              {money(effectiveArtworkInvestment)}
            </div>
            <span className="text-[10px] text-gray-600 block">
              = Base + Commission
            </span>
          </div>
        </div>

        {/* Breakdown Rule Formula Notice */}
        {sizePricingSummary.count > 0 && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between flex-wrap gap-2 text-xs font-mono" style={{ borderColor: C.rule, color: C.inkMuted }}>
            <span>
              Size-based investment: <strong>Base Artwork Value ({money(sizePricingSummary.totalBasePrice)})</strong> + <strong>Commission ({money(sizePricingSummary.totalCommission)})</strong> = <strong>Final Artwork Value ({money(sizePricingSummary.totalArtworkInvestment)})</strong>
            </span>
            <span className="text-[11px] text-stone-600">
              Evaluated individually across {sizePricingSummary.count} artworks (never averaged)
            </span>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {saveSuccessMsg && (
        <div
          className="p-3 rounded text-xs flex items-center gap-2 border bg-emerald-50 text-emerald-800"
          style={{ borderColor: '#BBF7D0' }}
        >
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Curation Context Metadata Inputs */}
      <div className="p-6" style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 border-b gap-3" style={{ borderColor: C.rule }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                03 CURATE
              </span>
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.inkMuted }}>
                Client Collection
              </span>
            </div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 600, color: C.ink, marginTop: '2px' }}>
              Curation Context &amp; Client Specification
            </h2>
          </div>

          <button
            type="button"
            onClick={handleSaveCollection}
            className="px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-all shadow hover:shadow-md self-start sm:self-auto"
            style={{ backgroundColor: C.ink, color: C.paper }}
          >
            <Save size={14} />
            <span>✓ Save Client Collection</span>
          </button>
        </div>

        {/* Saved Curated Clients Selector */}
        {curatedClients.length > 0 && (
          <div className="mb-5 p-3 rounded border flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: C.paperDark, borderColor: C.rule }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.inkMuted }}>
                <Users size={13} /> Saved Clients:
              </span>
              {curatedClients.map((c) => {
                const isSelected = curationContext.clientName?.toLowerCase() === c.clientName?.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectCuratedClient && onSelectCuratedClient(c)}
                    className="text-xs px-2.5 py-1 rounded transition-colors font-medium border"
                    style={{
                      backgroundColor: isSelected ? C.ink : '#FFFFFF',
                      color: isSelected ? C.paper : C.ink,
                      borderColor: C.rule,
                    }}
                  >
                    {c.clientName} {c.collectionName ? `(${c.collectionName})` : ''}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                onUpdateContext('clientName', '');
                onUpdateContext('collectionName', 'New Collection');
                onUpdateContext('location', '');
                onUpdateContext('spaceSqFt', '');
                onUpdateContext('artworkCount', '');
              }}
              className="text-xs px-2.5 py-1 rounded border bg-white text-stone-700 hover:bg-stone-50"
              style={{ borderColor: C.rule }}
            >
              + New Client
            </button>
          </div>
        )}

        <p className="text-xs mt-1 mb-5" style={{ color: C.inkMuted }}>
          Specify client, collection space, and location for internal proposal identification. Saving here makes the client immediately available in <strong>04 SUBSCRIPTION</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs mb-1 font-medium" style={{ color: C.ink }}>
              <Building size={12} /> Client Name *
            </span>
            <input
              type="text"
              value={curationContext.clientName}
              onChange={(e) => onUpdateContext('clientName', e.target.value)}
              placeholder="e.g. Asiapaints / Apex Towers"
              className="w-full bg-white px-3 py-2 rounded text-sm outline-none border font-medium"
              style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-xs mb-1 font-medium" style={{ color: C.ink }}>
              <FolderPlus size={12} /> Collection Name
            </span>
            <input
              type="text"
              value={curationContext.collectionName}
              onChange={(e) => onUpdateContext('collectionName', e.target.value)}
              placeholder="e.g. Lounge / Executive Suite"
              className="w-full bg-white px-3 py-2 rounded text-sm outline-none border"
              style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
            />
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-xs mb-1 font-medium" style={{ color: C.ink }}>
              <MapPin size={12} /> Location / Space
            </span>
            <input
              type="text"
              value={curationContext.location}
              onChange={(e) => onUpdateContext('location', e.target.value)}
              placeholder="e.g. Hyderabad / Bengaluru"
              className="w-full bg-white px-3 py-2 rounded text-sm outline-none border"
              style={{ borderColor: C.rule, color: C.ink, fontFamily: FONT_BODY }}
            />
          </label>
        </div>

        {/* Project Scope & Curation Economics Inputs */}
        <div className="mt-6 pt-5 border-t" style={{ borderColor: C.rule }}>
          <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: C.inkMuted }}>
            Project Scope & Curator Workload Justification
          </div>
          <p className="text-xs mb-4" style={{ color: C.inkMuted }}>
            Curator fee is paid on-demand per project/visit (never a recurring monthly salary). Define the site parameters to justify the curation fee.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block">
              <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>
                Space Size (sq ft)
              </span>
              <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                <input
                  type="number"
                  step="any"
                  value={curationContext.spaceSqFt || ''}
                  onChange={(e) => onUpdateContext('spaceSqFt', e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                  style={{ color: C.ink }}
                />
                <span className="text-xs text-stone-400 pl-1">sq ft</span>
              </div>
            </label>

            <label className="block">
              <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>
                Target Artwork Count
              </span>
              <div className="flex items-center border-b" style={{ borderColor: C.rule }}>
                <input
                  type="number"
                  step="1"
                  value={curationContext.artworkCount || selectedCount || ''}
                  onChange={(e) => onUpdateContext('artworkCount', e.target.value)}
                  placeholder={String(selectedCount || 5)}
                  className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono"
                  style={{ color: C.ink }}
                />
                <span className="text-xs text-stone-400 pl-1">artworks</span>
              </div>
            </label>

            <label className="block">
              <span className="block text-xs mb-1" style={{ color: C.inkMuted }}>
                Curation Complexity
              </span>
              <select
                value={curationContext.curationComplexity || 'standard'}
                onChange={(e) => onUpdateContext('curationComplexity', e.target.value)}
                className="w-full bg-transparent border-b py-1.5 text-sm outline-none"
                style={{ borderColor: C.rule, color: C.ink }}
              >
                <option value="standard">Standard (Off-the-shelf catalog)</option>
                <option value="moderate">Moderate (Custom color palette matching)</option>
                <option value="complex">Complex (Architectural bespoke site curation)</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs mb-1 font-medium" style={{ color: C.rust }}>
                Curator Project Fee (Per Visit/Cycle)
              </span>
              <div className="flex items-center border-b" style={{ borderColor: C.rust }}>
                <span className="text-xs font-mono mr-1 text-stone-400">{symbol}</span>
                <input
                  type="number"
                  step="any"
                  value={curationContext.curatorProjectFee || ''}
                  onChange={(e) => onUpdateContext('curatorProjectFee', e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full bg-transparent py-1.5 text-sm outline-none tabular font-mono font-medium"
                  style={{ color: C.ink }}
                />
                <span className="text-xs text-stone-400 pl-1">/ cycle</span>
              </div>
            </label>
          </div>

          <div className="mt-3 p-2.5 rounded text-[11px] flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
            <span>
              Basis: Base fee + Artwork workload ({curationContext.artworkCount || selectedCount || 5} artworks) + Space complexity ({curationContext.spaceSqFt ? `${curationContext.spaceSqFt} sq ft` : 'Commercial site'})
            </span>
            <span className="font-mono text-stone-700">
              Paid only when curation work is performed
            </span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs mb-1" style={{ color: C.inkMuted }}>
              <FileText size={12} /> Curation Notes (Optional)
            </span>
            <input
              type="text"
              value={curationContext.notes}
              onChange={(e) => onUpdateContext('notes', e.target.value)}
              placeholder="e.g. Minimalist contemporary palette for high-traffic reception area"
              className="w-full bg-transparent border-b py-1.5 text-xs outline-none"
              style={{ borderColor: C.rule, color: C.inkMuted, fontFamily: FONT_BODY }}
            />
          </label>
        </div>
      </div>

      {/* Artworks Selection Table */}
      <div style={{ border: `1px solid ${C.rule}`, backgroundColor: C.paper }}>
        <div className="p-4 flex items-center justify-between border-b flex-wrap gap-3" style={{ borderColor: C.rule }}>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.05rem', fontWeight: 600, color: C.ink }}>
              Artwork Selection
            </h3>
            <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
              Select the paintings from your inventory to include in this client collection.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-xs px-2.5 py-1"
              style={{ border: `1px solid ${C.rule}`, color: C.ink }}
            >
              Select All Valid
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              className="text-xs px-2.5 py-1"
              style={{ border: `1px solid ${C.rule}`, color: C.inkMuted }}
            >
              Clear Selection
            </button>
          </div>
        </div>

        {paintings.length === 0 ? (
          <div className="p-12 text-center" style={{ color: C.inkMuted }}>
            <p className="text-sm">No artworks available to curate.</p>
            <button
              type="button"
              onClick={onNavigateToBatch}
              className="mt-3 inline-flex items-center gap-1 text-xs px-3 py-1.5 font-medium"
              style={{ backgroundColor: C.ink, color: C.paper }}
            >
              Go to Batch Mode to Add Artworks
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: 780 }}>
              <thead>
                <tr className="text-xs uppercase tracking-wider" style={{ borderBottom: `1px solid ${C.rule}`, color: C.inkMuted }}>
                  <th className="py-3 px-4 font-medium" style={{ width: '50px' }}>Select</th>
                  <th className="py-3 px-4 font-medium">Artwork</th>
                  <th className="py-3 px-4 font-medium">Artist / Category</th>
                  <th className="py-3 px-4 font-medium">Dimensions</th>
                  <th className="py-3 px-4 font-medium text-right">Area</th>
                  <th className="py-3 px-4 font-medium text-right">Size-Based Artwork Value</th>
                  <th className="py-3 px-4 font-medium text-right">Production Cost</th>
                </tr>
              </thead>
              <tbody>
                {paintings.map((p, index) => {
                  const isSelected = curationContext.selectedPaintingIds.includes(p.id);
                  const isCalculated = p.cost?.isValid;
                  const itemPricing = isCalculated ? findMatchingArtworkPrice(p, artworkPricing) : null;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => isCalculated && onToggleSelectPainting(p.id)}
                      className={`text-sm transition-colors ${
                        isCalculated ? 'cursor-pointer hover:bg-stone-50' : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{
                        borderBottom: `1px solid ${C.rule}`,
                        backgroundColor: isSelected ? 'rgba(184, 69, 45, 0.04)' : 'transparent',
                      }}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          disabled={!isCalculated}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCalculated) onToggleSelectPainting(p.id);
                          }}
                          className="flex items-center justify-center"
                          style={{ color: isSelected ? C.rust : C.inkMuted }}
                        >
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </td>

                      {/* Artwork Title */}
                      <td className="py-3 px-4 font-medium" style={{ color: C.ink }}>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] px-1 py-0.5 rounded font-mono font-medium border"
                            style={{
                              backgroundColor: p.source === 'artist' ? '#FBF7F0' : '#F5F5F4',
                              borderColor: p.source === 'artist' ? C.rust : C.rule,
                              color: p.source === 'artist' ? C.rust : C.inkMuted,
                            }}
                          >
                            {p.source === 'artist' ? 'ARTIST' : 'ARTNCE'}
                          </span>
                          <span>{p.title || `Artwork ${String(index + 1).padStart(2, '0')}`}</span>
                        </div>
                      </td>

                      {/* Artist / Category */}
                      <td className="py-3 px-4 text-xs" style={{ color: C.inkMuted }}>
                        {p.artist ? p.artist : '—'}
                        {p.category && <span className="text-stone-400"> ({p.category})</span>}
                      </td>

                      {/* Dimensions */}
                      <td className="py-3 px-4 text-xs tabular font-mono">
                        {p.width && p.height ? `${p.width} × ${p.height} ${p.unit}` : 'Not set'}
                      </td>

                      {/* Area */}
                      <td className="py-3 px-4 text-right tabular font-mono text-xs" style={{ color: C.inkMuted }}>
                        {isCalculated ? `${fmtNum(p.cost.areaSqFt, 1)} sq ft` : '—'}
                      </td>

                      {/* Size-Based Artwork Value (Base + Commission = Final) */}
                      <td className="py-3 px-4 text-right tabular font-mono text-xs">
                        {itemPricing ? (
                          <div>
                            <span className="font-bold text-gray-900">{money(itemPricing.finalPrice)}</span>
                            <span className="text-[10px] text-gray-500 block">
                              Base {money(itemPricing.basePrice)} + {itemPricing.commissionPercent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Production Cost */}
                      <td className="py-3 px-4 text-right tabular font-mono font-medium">
                        {isCalculated ? (
                          <span style={{ color: isSelected ? C.rust : C.ink }}>
                            {money(p.cost.totalProductionCost)}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700">Missing dimensions</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t flex items-center justify-between flex-wrap gap-4" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
          <div className="text-xs" style={{ color: C.inkMuted }}>
            Selected: <strong className="text-stone-800">{selectedCount}</strong> artworks (Total Artwork Investment: <strong className="text-stone-900 font-mono">{money(effectiveArtworkInvestment)}</strong> | Base: <span className="font-mono">{money(sizePricingSummary.totalBasePrice)}</span> + Comm: <span className="font-mono">{money(sizePricingSummary.totalCommission)}</span>)
          </div>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={handleNavigateToSub}
              className="flex items-center gap-1.5 text-xs px-4 py-2 font-medium"
              style={{ backgroundColor: C.rust, color: '#fff' }}
            >
              Continue to Subscription Model <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
