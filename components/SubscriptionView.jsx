'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Users,
  Plus,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import {
  DESIGN_TOKENS as C,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_MONO,
  fmtNum,
  fmtCurrency,
  normalizeCostFrequency,
  calculatePeriodCost,
  calculateSimplePlanCosts,
  calculateSimplePlanResult,
  calculateClientEconomics,
  calculateCompanyTargetPerformance,
} from '@/lib/calculator';
import {
  DEFAULT_SIMPLE_PLANS,
  DEFAULT_COMPANY_MONTHLY_EXPENSES,
  DEFAULT_ACTIVE_CLIENTS,
  SUPPORTED_COST_FREQUENCIES,
  STORAGE_KEY_ACTIVE_CLIENTS,
  STORAGE_KEY_COMPANY_EXPENSES,
  STORAGE_KEY_SIMPLE_PLANS,
  STORAGE_KEY_CURATED_CLIENTS,
  DEFAULT_CURATED_CLIENTS,
} from '@/lib/defaults';

/* -----------------------------------------------------------------------
 * Plan Tab Definitions (Exactly 5 selectable plan options)
 * ---------------------------------------------------------------------*/
const PLAN_TABS = [
  { id: 'essential', label: 'Essential' },
  { id: 'professional', label: 'Professional' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'signature', label: 'Signature' },
  { id: 'custom', label: 'Custom Plan' },
];

/* -----------------------------------------------------------------------
 * Helper: Format Real Cost and Frequency (No artificial monthly averaging)
 * ---------------------------------------------------------------------*/
function formatActualCostFrequency(amount, frequency, symbol = '₹') {
  const formattedAmt = `${symbol}${Number(amount || 0).toLocaleString('en-IN')}`;
  switch (frequency) {
    case 'monthly':
      return `${formattedAmt} / Month`;
    case 'one_time':
      return `${formattedAmt} One Time`;
    case 'every_3_months':
      return `${formattedAmt} Every 3 Months`;
    case 'every_6_months':
      return `${formattedAmt} Every 6 Months`;
    case 'every_12_months':
      return `${formattedAmt} Every 12 Months`;
    case 'per_rotation':
      return `${formattedAmt} Per Rotation`;
    case 'per_installation':
      return `${formattedAmt} Per Installation`;
    default:
      return `${formattedAmt} (${frequency || 'monthly'})`;
  }
}

export default function SubscriptionView({
  settings = {},
  artworkPricing,
  onUpdateArtworkPricing,
  screen,
  initialScreen = 'calculator', // 'calculator' | 'performance'
  curatedClients: propCuratedClients,
  onSaveCuratedClient,
  onSelectCuratedClient,
  activeClients: propActiveClients,
  onUpdateActiveClients,
  currentCurateClientName,
  plans: propPlans,
  onUpdatePlans,
  companyExpenses: propCompanyExpenses,
  onUpdateCompanyExpenses,
  onNavigateToCurate,
  onNavigateToSubscription,
  onNavigateToBatch,
}) {
  const symbol = settings.currencySymbol || '₹';
  const decimals = settings.decimals || 0;
  const money = (v) => fmtCurrency(v, symbol, decimals);

  // Active screen determined by screen prop or initialScreen
  const activeScreen = screen || initialScreen;

  /* -----------------------------------------------------------------------
   * Persistent State Initialization
   * ---------------------------------------------------------------------*/
  const [localPlans, setLocalPlans] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_SIMPLE_PLANS);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load simple plans from storage:', e);
      }
    }
    return DEFAULT_SIMPLE_PLANS;
  });

  const plans = propPlans !== undefined ? propPlans : localPlans;
  const setPlans = onUpdatePlans || setLocalPlans;

  // Local active clients fallback if not provided via props
  const [localActiveClients, setLocalActiveClients] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_ACTIVE_CLIENTS);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load active clients from storage:', e);
      }
    }
    return DEFAULT_ACTIVE_CLIENTS;
  });

  const activeClients = propActiveClients !== undefined ? propActiveClients : localActiveClients;
  const updateActiveClients = onUpdateActiveClients || setLocalActiveClients;

  // Local curated clients fallback if not provided via props (Source of Truth from 03 CURATE)
  const [localCuratedClients] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_CURATED_CLIENTS);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load curated clients from storage:', e);
      }
    }
    return DEFAULT_CURATED_CLIENTS;
  });

  const rawCuratedList = propCuratedClients !== undefined ? propCuratedClients : localCuratedClients;
  const curatedClientsList = useMemo(() => {
    if (!Array.isArray(rawCuratedList)) return [];
    return rawCuratedList.map((c, idx) => {
      const fallbackId = (c.clientName && c.clientName.trim())
        ? `cur_${c.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
        : `cur_client_${idx}`;
      return {
        ...c,
        id: (c.id && c.id !== 'undefined') ? c.id : fallbackId,
      };
    });
  }, [rawCuratedList]);

  const [localCompanyExpenses, setLocalCompanyExpenses] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_COMPANY_EXPENSES);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load company expenses from storage:', e);
      }
    }
    return DEFAULT_COMPANY_MONTHLY_EXPENSES;
  });

  const companyExpenses = propCompanyExpenses !== undefined ? propCompanyExpenses : localCompanyExpenses;
  const setCompanyExpenses = onUpdateCompanyExpenses || setLocalCompanyExpenses;

  // Persist state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_SIMPLE_PLANS, JSON.stringify(plans));
        window.localStorage.setItem(STORAGE_KEY_ACTIVE_CLIENTS, JSON.stringify(activeClients));
        window.localStorage.setItem(STORAGE_KEY_COMPANY_EXPENSES, JSON.stringify(companyExpenses));
      } catch (e) {
        console.warn('Failed to persist subscription data:', e);
      }
    }
  }, [plans, activeClients, companyExpenses]);

  /* -----------------------------------------------------------------------
   * Screen 1: Plan & Client Selection State (Source: 03 CURATE)
   * ---------------------------------------------------------------------*/
  const [selectedPlanId, setSelectedPlanId] = useState('essential');
  const [toastMessage, setToastMessage] = useState('');
  const [viewingClient, setViewingClient] = useState(null);

  // Selected curated client ID
  const [selectedClientId, setSelectedClientId] = useState(() => {
    if (currentCurateClientName) {
      const match = curatedClientsList?.find(
        (c) => c.clientName?.toLowerCase() === currentCurateClientName.trim().toLowerCase()
      );
      if (match) return match.id;
    }
    return curatedClientsList?.[0]?.id || '';
  });

  // Currently selected curated client object
  const selectedCuratedClient = useMemo(() => {
    if (!curatedClientsList || curatedClientsList.length === 0) return null;
    if (selectedClientId === '') return null;
    return (
      curatedClientsList.find((c) => c.id === selectedClientId) ||
      curatedClientsList.find(
        (c) => c.clientName && selectedClientId && c.clientName.trim().toLowerCase() === selectedClientId.trim().toLowerCase()
      ) ||
      curatedClientsList[0] ||
      null
    );
  }, [curatedClientsList, selectedClientId]);

  // Sync when currentCurateClientName prop changes (e.g. navigation from 03 CURATE)
  useEffect(() => {
    if (currentCurateClientName && curatedClientsList.length > 0) {
      const match = curatedClientsList.find(
        (c) => c.clientName?.trim().toLowerCase() === currentCurateClientName.trim().toLowerCase()
      );
      if (match && match.id !== selectedClientId) {
        handleSelectClientFromDropdown(match.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCurateClientName, curatedClientsList]);

  // Check if selected curated client already exists in active subscriptions
  const existingSubscription = useMemo(() => {
    if (!selectedCuratedClient) return null;
    return (
      activeClients.find(
        (ac) =>
          (selectedCuratedClient.id && ac.clientId === selectedCuratedClient.id) ||
          ac.clientName?.trim().toLowerCase() === selectedCuratedClient.clientName?.trim().toLowerCase()
      ) || null
    );
  }, [selectedCuratedClient, activeClients]);

  // Currently active plan template
  const currentPlanTemplate = plans[selectedPlanId] || DEFAULT_SIMPLE_PLANS[selectedPlanId] || DEFAULT_SIMPLE_PLANS.essential;

  // Client's Size-Based Artwork Investment Breakdown
  const clientArtworkInvestment = useMemo(() => {
    if (!selectedCuratedClient) return { total: 0, base: 0, commission: 0, count: 0 };
    if (selectedCuratedClient.totalArtworkInvestment) {
      return {
        total: selectedCuratedClient.totalArtworkInvestment,
        base: selectedCuratedClient.baseArtworkValue || 0,
        commission: selectedCuratedClient.commissionValue || 0,
        count: selectedCuratedClient.artworkCount || 0,
      };
    }
    const count = Number(selectedCuratedClient.artworkCount) || 3;
    const defaultTier = artworkPricing?.sizes?.find((s) => s.id === 'sz_18x24') || artworkPricing?.sizes?.[2] || { basePrice: 4200, commissionPercent: 20 };
    const base = defaultTier.basePrice * count;
    const commission = Math.round(base * ((defaultTier.commissionPercent || 20) / 100));
    const total = base + commission;
    return { total, base, commission, count };
  }, [selectedCuratedClient, artworkPricing]);

  // Recalculate artwork investment using current Price Settings
  const handleRecalculateArtworkInvestment = () => {
    if (!selectedCuratedClient) return;
    const count = Number(selectedCuratedClient.artworkCount) || 3;
    const defaultTier = artworkPricing?.sizes?.find((s) => s.id === 'sz_18x24') || artworkPricing?.sizes?.[2] || { basePrice: 4200, commissionPercent: 20 };
    const base = defaultTier.basePrice * count;
    const commission = Math.round(base * ((defaultTier.commissionPercent || 20) / 100));
    const total = base + commission;

    setArtPriceInput(total);

    if (onSaveCuratedClient) {
      onSaveCuratedClient({
        ...selectedCuratedClient,
        totalArtworkInvestment: total,
        baseArtworkValue: base,
        commissionValue: commission,
      });
      showToast(`Recalculated artwork investment for "${selectedCuratedClient.clientName}" using current Price Settings.`);
    }
  };

  // Active client form inputs
  const [spaceSqFtInput, setSpaceSqFtInput] = useState(() => {
    return selectedCuratedClient?.spaceSqFt || currentPlanTemplate.spaceSqFt || 2000;
  });
  const [artworkCountInput, setArtworkCountInput] = useState(() => {
    return selectedCuratedClient?.artworkCount || currentPlanTemplate.artworkCount || 3;
  });
  const [artPriceInput, setArtPriceInput] = useState(() => {
    return selectedCuratedClient?.totalArtworkInvestment ?? clientArtworkInvestment.total ?? 15120;
  });
  const [monthlyPriceInput, setMonthlyPriceInput] = useState(() => {
    return currentPlanTemplate.monthlySubscription || 12500;
  });
  const [planCosts, setPlanCosts] = useState(() => {
    return currentPlanTemplate.costs ? JSON.parse(JSON.stringify(currentPlanTemplate.costs)) : [];
  });

  // Section C View Mode: 'monthly' (Cash flow / month) or 'annual' (12-month total term)
  const [planResultViewMode, setPlanResultViewMode] = useState('monthly');

  // Live sync inputs when selectedCuratedClient is updated in 03 CURATE
  useEffect(() => {
    if (selectedCuratedClient) {
      if (selectedCuratedClient.spaceSqFt !== undefined && selectedCuratedClient.spaceSqFt !== null) {
        setSpaceSqFtInput(selectedCuratedClient.spaceSqFt);
      }
      if (selectedCuratedClient.artworkCount !== undefined && selectedCuratedClient.artworkCount !== null) {
        setArtworkCountInput(selectedCuratedClient.artworkCount);
      }
      if (selectedCuratedClient.totalArtworkInvestment) {
        setArtPriceInput(selectedCuratedClient.totalArtworkInvestment);
      } else if (clientArtworkInvestment.total) {
        setArtPriceInput(clientArtworkInvestment.total);
      }
    }
  }, [selectedCuratedClient, clientArtworkInvestment.total]);

  // Sync inputs whenever client selection changes
  const handleSelectClientFromDropdown = (clientId) => {
    setSelectedClientId(clientId);
    if (!clientId) return;

    const target = curatedClientsList.find(
      (c) => c.id === clientId || (c.clientName && c.clientName.trim().toLowerCase() === clientId.trim().toLowerCase())
    );
    if (!target) return;

    if (onSelectCuratedClient) {
      onSelectCuratedClient(target);
    }

    // Check if this client already has an active subscription
    const existing = activeClients.find(
      (ac) =>
        (target.id && ac.clientId === target.id) ||
        ac.clientName?.trim().toLowerCase() === target.clientName?.trim().toLowerCase()
    );

    if (existing) {
      setSelectedPlanId(existing.planId || 'essential');
      setMonthlyPriceInput(existing.monthlyFee || 12500);
      // 03 CURATE is single source of truth for spaceSqFt and artworkCount
      setSpaceSqFtInput(target.spaceSqFt ?? existing.spaceSqFt ?? 2000);
      setArtworkCountInput(target.artworkCount ?? existing.artworkCount ?? 3);
      setArtPriceInput(existing.totalArtworkInvestment ?? target.totalArtworkInvestment ?? clientArtworkInvestment.total ?? 15120);
      setPlanCosts(existing.costs ? JSON.parse(JSON.stringify(existing.costs)) : []);
      showToast(`Loaded active subscription for "${target.clientName}".`);
    } else {
      const tpl = plans[selectedPlanId] || DEFAULT_SIMPLE_PLANS[selectedPlanId] || DEFAULT_SIMPLE_PLANS.essential;
      setSpaceSqFtInput(target.spaceSqFt ?? tpl.spaceSqFt ?? 2000);
      setArtworkCountInput(target.artworkCount ?? tpl.artworkCount ?? 3);
      setArtPriceInput(target.totalArtworkInvestment ?? clientArtworkInvestment.total ?? 15120);
      setMonthlyPriceInput(tpl.monthlySubscription || 12500);

      // Load client-specific activities from 03 CURATE data
      let initialCosts = tpl.costs ? JSON.parse(JSON.stringify(tpl.costs)) : [];
      if (target.curatorProjectFee) {
        const curatorIdx = initialCosts.findIndex((c) => c.name.toLowerCase().includes('curator'));
        if (curatorIdx >= 0) {
          initialCosts[curatorIdx] = {
            ...initialCosts[curatorIdx],
            amount: Number(target.curatorProjectFee),
          };
        } else {
          initialCosts.push({
            id: `cost_curator_${target.id || 'client'}`,
            name: 'Curator Fee',
            amount: Number(target.curatorProjectFee),
            frequency: 'every_3_months',
          });
        }
      }
      setPlanCosts(initialCosts);
      showToast(`Selected "${target.clientName}" from 03 CURATE.`);
    }
  };

  // When selected plan changes, load template price and costs, keep client scope
  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    const tpl = plans[planId] || DEFAULT_SIMPLE_PLANS[planId];
    if (tpl) {
      setMonthlyPriceInput(tpl.monthlySubscription || 12500);
      let initialCosts = tpl.costs ? JSON.parse(JSON.stringify(tpl.costs)) : [];
      if (selectedCuratedClient?.curatorProjectFee) {
        const curatorIdx = initialCosts.findIndex((c) => c.name.toLowerCase().includes('curator'));
        if (curatorIdx >= 0) {
          initialCosts[curatorIdx] = {
            ...initialCosts[curatorIdx],
            amount: Number(selectedCuratedClient.curatorProjectFee),
          };
        } else {
          initialCosts.push({
            id: `cost_curator_${selectedCuratedClient.id || 'client'}`,
            name: 'Curator Fee',
            amount: Number(selectedCuratedClient.curatorProjectFee),
            frequency: 'every_3_months',
          });
        }
      }
      setPlanCosts(initialCosts);
      if (!selectedCuratedClient?.spaceSqFt) {
        setSpaceSqFtInput(tpl.spaceSqFt || 2000);
      }
      if (!selectedCuratedClient?.artworkCount) {
        setArtworkCountInput(tpl.artworkCount || 3);
      }
    }
  };

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  /* -----------------------------------------------------------------------
   * Screen 1: Calculations (Client Pay - Delivery Cost - Art Price = Net Contribution)
   * ---------------------------------------------------------------------*/
  const effectiveArtPrice = Math.max(0, Number(artPriceInput) || 0);

  const planResult = useMemo(() => {
    return calculateSimplePlanResult({
      monthlySubscription: Number(monthlyPriceInput) || 0,
      costs: planCosts,
      artPrice: effectiveArtPrice,
    });
  }, [monthlyPriceInput, planCosts, effectiveArtPrice]);

  // Client-specific economics based on actual frequencies over 12-month period
  const clientEconomics = useMemo(() => {
    return calculateClientEconomics({
      costs: planCosts,
      monthlyFee: Number(monthlyPriceInput) || 0,
      periodMonths: 12,
      artPrice: effectiveArtPrice,
    });
  }, [planCosts, monthlyPriceInput, effectiveArtPrice]);

  // Handle adding a new cost row
  const handleAddCost = () => {
    const newId = `cost_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    setPlanCosts((prev) => [
      ...prev,
      { id: newId, name: 'New Cost', amount: 500, frequency: 'monthly' },
    ]);
  };

  // Handle updating a cost row
  const handleUpdateCost = (id, field, value) => {
    setPlanCosts((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            [field]: field === 'amount' ? Math.max(0, Number(value) || 0) : value,
          };
        }
        return c;
      })
    );
  };

  // Handle deleting a cost row
  const handleDeleteCost = (id) => {
    setPlanCosts((prev) => prev.filter((c) => c.id !== id));
  };

  // Save current plan template values back to plan presets
  const handleSavePlanPreset = () => {
    setPlans((prev) => ({
      ...prev,
      [selectedPlanId]: {
        ...prev[selectedPlanId],
        spaceSqFt: Number(spaceSqFtInput) || 0,
        artworkCount: Number(artworkCountInput) || 0,
        monthlySubscription: Number(monthlyPriceInput) || 0,
        costs: JSON.parse(JSON.stringify(planCosts)),
      },
    }));
    showToast(`Saved current configuration to ${currentPlanTemplate.name} preset.`);
  };

  // Submit / Update Subscription for Selected Client
  // Single source of truth: 03 CURATE is client DB, 04 SUBSCRIPTION stores subscription relationship
  // Never creates duplicates for the same client
  const handleSubmitSubscription = () => {
    if (!selectedCuratedClient) {
      alert('Please select a client from 03 CURATE first.');
      return;
    }

    const monthlyFee = Number(monthlyPriceInput) || 0;
    const clientEcon = calculateClientEconomics({
      costs: planCosts,
      monthlyFee,
      periodMonths: 12,
      artPrice: effectiveArtPrice,
    });
    const totalSpend = Math.round(clientEcon.totalSpend);
    const avgMonthlySpend = Math.round(clientEcon.avgMonthlySpend);
    const monthlyCost = avgMonthlySpend;
    const monthlyContrib = Math.round(clientEcon.monthlyContribution);
    const monthlyContribBeforeArt = Math.round(clientEcon.monthlyContributionBeforeArt);
    const totalNetContrib = Math.round(clientEcon.totalNetContribution);

    const subRecord = {
      id: existingSubscription ? existingSubscription.id : `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      clientId: selectedCuratedClient.id,
      clientName: selectedCuratedClient.clientName,
      collectionName: selectedCuratedClient.collectionName || 'Client Collection',
      location: selectedCuratedClient.location || '',
      planId: selectedPlanId,
      planName: currentPlanTemplate.name,
      spaceSqFt: Number(spaceSqFtInput) || selectedCuratedClient.spaceSqFt || 0,
      artworkCount: Number(artworkCountInput) || selectedCuratedClient.artworkCount || 0,
      monthlyFee,
      totalSpend,
      avgMonthlySpend,
      monthlyCost,
      monthlyContribution: monthlyContrib,
      monthlyContributionBeforeArt: monthlyContribBeforeArt,
      totalArtworkInvestment: effectiveArtPrice,
      baseArtworkValue: clientArtworkInvestment.base,
      commissionValue: clientArtworkInvestment.commission,
      monthlyArtCost: Math.round(clientEcon.monthlyArtCost),
      totalNetContribution: totalNetContrib,
      recoveryMonths: clientEcon.recoveryMonths,
      costs: JSON.parse(JSON.stringify(planCosts)),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = activeClients.findIndex(
      (c) =>
        (selectedCuratedClient.id && c.clientId === selectedCuratedClient.id) ||
        c.clientName?.trim().toLowerCase() === selectedCuratedClient.clientName?.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing subscription in place (no duplicate)
      const updated = [...activeClients];
      updated[existingIndex] = subRecord;
      updateActiveClients(updated);
      showToast(`Updated subscription for "${selectedCuratedClient.clientName}" (${currentPlanTemplate.name} • ${money(monthlyFee)}/mo).`);
    } else {
      // Assign new subscription to client
      updateActiveClients([subRecord, ...activeClients]);
      showToast(`Assigned ${currentPlanTemplate.name} plan to "${selectedCuratedClient.clientName}". Added to Active Clients & Plans.`);
    }

    // If space, artwork count, or art price was customized during subscription setup, sync back to 03 CURATE master
    if (onSaveCuratedClient && (
      (Number(spaceSqFtInput) && Number(spaceSqFtInput) !== selectedCuratedClient.spaceSqFt) ||
      (Number(artworkCountInput) && Number(artworkCountInput) !== selectedCuratedClient.artworkCount) ||
      (effectiveArtPrice && effectiveArtPrice !== selectedCuratedClient.totalArtworkInvestment)
    )) {
      onSaveCuratedClient({
        ...selectedCuratedClient,
        spaceSqFt: Number(spaceSqFtInput) || selectedCuratedClient.spaceSqFt || 0,
        artworkCount: Number(artworkCountInput) || selectedCuratedClient.artworkCount || 0,
        totalArtworkInvestment: effectiveArtPrice,
      });
    }
  };

  // Load client from table into calculator
  const handleEditActiveClient = (client) => {
    const matched = curatedClientsList.find(
      (c) =>
        (client.clientId && c.id === client.clientId) ||
        c.clientName?.trim().toLowerCase() === client.clientName?.trim().toLowerCase()
    );
    if (matched) {
      setSelectedClientId(matched.id);
      if (onSelectCuratedClient) {
        onSelectCuratedClient(matched);
      }
      setSpaceSqFtInput(matched.spaceSqFt ?? client.spaceSqFt ?? 2000);
      setArtworkCountInput(matched.artworkCount ?? client.artworkCount ?? 3);
      setArtPriceInput(client.totalArtworkInvestment ?? matched.totalArtworkInvestment ?? 15120);
    } else {
      if (client.clientId) {
        setSelectedClientId(client.clientId);
      }
      setSpaceSqFtInput(client.spaceSqFt ?? 2000);
      setArtworkCountInput(client.artworkCount ?? 3);
      setArtPriceInput(client.totalArtworkInvestment ?? 15120);
    }
    setSelectedPlanId(client.planId || 'essential');
    setMonthlyPriceInput(client.monthlyFee || 12500);
    setPlanCosts(client.costs ? JSON.parse(JSON.stringify(client.costs)) : []);

    // Scroll smoothly to top of calculator
    const el = document.getElementById('calculator-top');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    showToast(`Loaded subscription for "${client.clientName}". Edit values and click Update Subscription.`);
  };

  // Delete subscription record (Unassigns plan from client, keeping curated client intact in 03 CURATE)
  const handleDeleteActiveClient = (id) => {
    const target = activeClients.find((c) => c.id === id);
    if (
      target &&
      confirm(
        `Remove "${target.clientName}" from Active Clients & Plans?\n\nNote: The client record will remain safely in 03 CURATE. Only the active subscription relationship is removed.`
      )
    ) {
      updateActiveClients(activeClients.filter((c) => c.id !== id));
      showToast(`Removed subscription for "${target.clientName}".`);
    }
  };

  // Active clients table totals
  const clientTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalArtPrice = 0;
    let totalContribution = 0;

    for (const c of activeClients) {
      const fee = Number(c.monthlyFee) || 0;
      let spend = c.avgMonthlySpend;
      if (spend === undefined || spend === null) {
        spend = c.costs && c.costs.length > 0
          ? Math.round(calculateClientEconomics({ costs: c.costs, monthlyFee: fee, periodMonths: 12 }).avgMonthlySpend)
          : (Number(c.monthlyCost) || 0);
      }
      const art = Number(c.totalArtworkInvestment) || 0;
      const contrib = c.monthlyContribution !== undefined && c.monthlyContribution !== null
        ? Number(c.monthlyContribution)
        : (fee - spend - Math.round(art / 12));

      totalRevenue += fee;
      totalCost += spend;
      totalArtPrice += art;
      totalContribution += contrib;
    }

    const marginPct = totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : 0;

    return {
      count: activeClients.length,
      totalRevenue,
      totalCost,
      totalDeliveryCost: totalCost,
      totalArtPrice,
      totalContribution,
      marginPct,
    };
  }, [activeClients]);

  /* -----------------------------------------------------------------------
   * Screen 2: Company Performance State & Calculations
   * ---------------------------------------------------------------------*/
  const [additionalPlanType, setAdditionalPlanType] = useState('essential');
  const [customPlanContribOverride, setCustomPlanContribOverride] = useState('');
  const [showActiveClientsModal, setShowActiveClientsModal] = useState(false);

  // Compute contribution of each of the 5 plans based on current configured values
  const planContributions = useMemo(() => {
    const contribs = {};
    for (const tab of PLAN_TABS) {
      const p = plans[tab.id] || DEFAULT_SIMPLE_PLANS[tab.id];
      if (p) {
        const res = calculateSimplePlanResult({
          monthlySubscription: p.monthlySubscription,
          costs: p.costs,
        });
        contribs[tab.id] = Math.max(0, res.monthlyContribution);
      } else {
        contribs[tab.id] = 0;
      }
    }
    return contribs;
  }, [plans]);

  const selectedPlanContrib = planContributions[additionalPlanType] || 0;
  const effectivePlanContrib =
    customPlanContribOverride !== '' && !isNaN(Number(customPlanContribOverride)) && Number(customPlanContribOverride) >= 0
      ? Number(customPlanContribOverride)
      : selectedPlanContrib;

  const isTechOneTime = companyExpenses.technologyIsOneTime !== undefined
    ? !!companyExpenses.technologyIsOneTime
    : (Number(companyExpenses.technologySoftware) >= 50000);

  const effectiveCompanyExpenses = useMemo(() => {
    return {
      ...companyExpenses,
      technologyIsOneTime: isTechOneTime,
    };
  }, [companyExpenses, isTechOneTime]);

  // Screen 2 Performance Engine
  const performance = useMemo(() => {
    return calculateCompanyTargetPerformance({
      companyExpenses: effectiveCompanyExpenses,
      activeClients,
      selectedPlanContribution: effectivePlanContrib,
    });
  }, [effectiveCompanyExpenses, activeClients, effectivePlanContrib]);

  // Handle updating company monthly expense items
  const handleUpdateCompanyExpense = (field, value) => {
    const val = value === '' ? '' : Math.max(0, Number(value) || 0);
    setCompanyExpenses((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleToggleTechnologyOneTime = (forcedVal) => {
    const nextVal = forcedVal !== undefined ? forcedVal : !isTechOneTime;
    setCompanyExpenses((prev) => ({
      ...prev,
      technologyIsOneTime: nextVal,
    }));
  };

  const handleExpenseBlur = (field) => {
    setCompanyExpenses((prev) => {
      if (prev[field] === '') {
        return { ...prev, [field]: 0 };
      }
      return prev;
    });
  };

  const currentOtherExpenses =
    companyExpenses.otherExpenses === ''
      ? ''
      : (Number(companyExpenses.otherExpenses) || 0) + (Number(companyExpenses.otherInvestments) || 0);

  const handleUpdateOtherExpense = (value) => {
    const val = value === '' ? '' : Math.max(0, Number(value) || 0);
    setCompanyExpenses((prev) => ({
      ...prev,
      otherExpenses: val,
      otherInvestments: 0,
    }));
  };

  const handleAddCustomExpense = () => {
    const newItem = {
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: 'Custom Overhead',
      amount: 10000,
    };
    setCompanyExpenses((prev) => ({
      ...prev,
      customItems: [...(prev.customItems || []), newItem],
    }));
    setToastMessage('Added custom overhead expense');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleUpdateCustomExpense = (id, field, value) => {
    setCompanyExpenses((prev) => ({
      ...prev,
      customItems: (prev.customItems || []).map((item) => {
        if (item.id !== id) return item;
        if (field === 'amount') {
          return { ...item, amount: value === '' ? '' : Math.max(0, Number(value) || 0) };
        }
        return { ...item, [field]: value };
      }),
    }));
  };

  const handleCustomExpenseBlur = (id) => {
    setCompanyExpenses((prev) => ({
      ...prev,
      customItems: (prev.customItems || []).map((item) => {
        if (item.id === id && item.amount === '') {
          return { ...item, amount: 0 };
        }
        return item;
      }),
    }));
  };

  const handleRemoveCustomExpense = (id) => {
    setCompanyExpenses((prev) => ({
      ...prev,
      customItems: (prev.customItems || []).filter((item) => item.id !== id),
    }));
    setToastMessage('Removed custom overhead expense');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleResetCompanyExpenses = () => {
    setCompanyExpenses(DEFAULT_COMPANY_MONTHLY_EXPENSES);
    setToastMessage('Reset company expenses to defaults (₹4,60,000)');
    setTimeout(() => setToastMessage(''), 2500);
  };

  return (
    <div className="w-full pb-20" style={{ fontFamily: FONT_BODY, color: C.ink }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded shadow-lg text-sm flex items-center gap-3 transition-all transform translate-y-0"
          style={{ backgroundColor: C.ink, color: C.paper, border: `1px solid ${C.rule}` }}
        >
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================
       * HEADER: Clean single-navigation heading (No secondary duplicate tabs)
       * 04 SUBSCRIPTION: Plan & Clients
       * 05 PERFORMANCE: Company Performance
       * ===================================================================*/}
      <div className="mb-8 border-b pb-6" style={{ borderColor: C.rule }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
            {activeScreen === 'calculator' ? '04 SUBSCRIPTION' : '05 PERFORMANCE'}
          </span>
        </div>
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ fontFamily: FONT_DISPLAY, color: C.ink }}
        >
          {activeScreen === 'calculator' ? 'SUBSCRIPTION' : 'COMPANY PERFORMANCE & TARGET'}
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: C.inkMuted }}>
          {activeScreen === 'calculator'
            ? 'Plan & Client Calculator'
            : 'Understand whether current subscription clients cover company monthly requirement'}
        </p>
      </div>

      {/* ===================================================================
       * SCREEN 1 — PLAN & CLIENT CALCULATOR
       * ===================================================================*/}
      {activeScreen === 'calculator' && (
        <div id="calculator-top" className="space-y-8 animate-fadeIn">
          {/* Active Subscription Status Banner */}
          {existingSubscription && (
            <div
              className="p-4 rounded border flex items-center justify-between"
              style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-600" />
                <span className="text-xs sm:text-sm font-medium">
                  Active subscription loaded for: <strong>{selectedCuratedClient?.clientName}</strong> ({existingSubscription.planName} • {money(existingSubscription.monthlyFee)}/mo). Editing will update the subscription without creating duplicates.
                </span>
              </div>
            </div>
          )}

          {/* -----------------------------------------------------------------
           * 1. PLAN SELECTION (Horizontal selector with exactly 5 options)
           * ---------------------------------------------------------------*/}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: C.inkMuted }}>
              Select Subscription Plan Type
            </label>
            <div
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded"
              style={{ backgroundColor: C.paperDark, border: `1px solid ${C.rule}` }}
            >
              {PLAN_TABS.map((tab) => {
                const isActive = selectedPlanId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectPlan(tab.id)}
                    className="py-3 px-3 rounded text-center transition-all font-medium text-xs sm:text-sm"
                    style={{
                      backgroundColor: isActive ? C.ink : 'transparent',
                      color: isActive ? C.paper : C.ink,
                      boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.12)' : 'none',
                    }}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * 2. CLIENT + PLAN DETAILS (Section A)
           * ---------------------------------------------------------------*/}
          <div
            className="p-6 rounded border shadow-sm"
            style={{ backgroundColor: C.paper, borderColor: C.rule }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-5 border-b gap-2" style={{ borderColor: C.rule }}>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded mr-2" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                  SECTION A
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkMuted }}>
                  Selected Plan &amp; Client
                </span>
                <h2 className="text-lg sm:text-xl font-bold mt-0.5" style={{ fontFamily: FONT_DISPLAY }}>
                  Plan: {currentPlanTemplate.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToCurate && (
                  <button
                    type="button"
                    onClick={onNavigateToCurate}
                    className="text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-1.5 bg-white hover:bg-stone-50"
                    style={{ borderColor: C.rule, color: C.ink }}
                    title="Go to 03 CURATE to add or edit client collections"
                  >
                    <Users size={13} />
                    <span>03 CURATE (Manage Clients) &rarr;</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSavePlanPreset}
                  className="text-xs px-3 py-1.5 rounded border transition-colors"
                  style={{ borderColor: C.rule, color: C.inkMuted }}
                  title="Save this space and monthly price as the default template for this plan"
                >
                  Update {currentPlanTemplate.name} Preset
                </button>
              </div>
            </div>

            {/* Client Dropdown & Auto-Populated Information */}
            <div className="mb-6 p-4 rounded border" style={{ backgroundColor: C.paperDark, borderColor: C.rule }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.ink }}>
                    Client (Source: 03 CURATE &rarr; Client Collection)
                  </span>
                  {existingSubscription ? (
                    <span className="text-[11px] px-2 py-0.5 rounded font-medium border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-amber-600" /> Active Subscription ({existingSubscription.planName})
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded font-medium border bg-blue-50 text-blue-800 border-blue-200">
                      New Subscription Assignment
                    </span>
                  )}
                </div>

                {curatedClientsList.length === 0 && (
                  <span className="text-xs text-red-600">
                    No clients found in 03 CURATE. Please create and save a client in 03 CURATE first.
                  </span>
                )}
              </div>

              {/* The "Select Client ▼" dropdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.ink }}>
                    Select Client ▼
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCuratedClient ? selectedCuratedClient.id : ''}
                      onChange={(e) => handleSelectClientFromDropdown(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded text-sm outline-none border font-medium cursor-pointer appearance-none bg-white shadow-sm"
                      style={{ borderColor: C.rule, color: C.ink }}
                    >
                      <option value="">Select Client ▼</option>
                      {curatedClientsList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.clientName} {c.collectionName ? `— ${c.collectionName}` : ''} {c.location ? `(${c.location})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                  <span className="text-[11px] mt-1 block" style={{ color: C.inkMuted }}>
                    Clients created &amp; saved in 03 CURATE
                  </span>
                </div>

                {/* Auto-populated details badges */}
                {selectedCuratedClient ? (
                  <div className="lg:col-span-2 space-y-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 block">Client Name</span>
                        <strong className="text-xs sm:text-sm font-semibold text-stone-900 block truncate" title={selectedCuratedClient.clientName}>
                          {selectedCuratedClient.clientName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 block">Collection Name</span>
                        <span className="text-xs sm:text-sm text-stone-800 block truncate" title={selectedCuratedClient.collectionName}>
                          {selectedCuratedClient.collectionName || 'Default'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 block">Location / Space</span>
                        <span className="text-xs sm:text-sm text-stone-800 block truncate" title={selectedCuratedClient.location}>
                          {selectedCuratedClient.location || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 block">Curated Artworks</span>
                        <span className="text-xs sm:text-sm font-mono text-stone-800 block">
                          {selectedCuratedClient.artworkCount || 0} pcs ({fmtNum(selectedCuratedClient.spaceSqFt || 0)} sq ft)
                        </span>
                      </div>
                    </div>

                    {/* Artwork Investment Badge & Recalculate Button */}
                    <div className="p-2.5 rounded bg-stone-50 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono" style={{ borderColor: C.rule }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-200 text-stone-800">
                          ARTWORK INVESTMENT
                        </span>
                        <strong className="text-stone-900 font-bold">{money(clientArtworkInvestment.total)}</strong>
                        <span className="text-gray-500 text-[11px]">
                          (Base: {money(clientArtworkInvestment.base)} + Comm: {money(clientArtworkInvestment.commission)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRecalculateArtworkInvestment}
                        className="text-[11px] font-sans px-2 py-0.5 rounded border bg-white text-stone-700 hover:bg-stone-100 transition-colors self-start sm:self-auto flex items-center gap-1"
                        style={{ borderColor: C.rule }}
                        title="Update artwork investment based on current Price Settings matrix"
                      >
                        <RotateCcw size={11} /> Recalculate using current pricing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-2 p-3 rounded bg-white border flex items-center justify-center text-xs text-gray-500 text-center" style={{ borderColor: C.rule }}>
                    Choose a client from the dropdown above to load and configure their subscription details.
                  </div>
                )}
              </div>
            </div>

            {/* Plan-specific Values: Space, Artwork Count, Art Price, Monthly Subscription Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Space / Area */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.ink }}>
                  Space / Area
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="2000"
                    value={spaceSqFtInput}
                    onChange={(e) => setSpaceSqFtInput(e.target.value)}
                    className="w-full px-3.5 py-2 pr-14 rounded text-sm outline-none transition-colors border font-mono bg-white"
                    style={{ borderColor: C.rule, color: C.ink }}
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono" style={{ color: C.inkMuted }}>
                    sq ft
                  </span>
                </div>
                <span className="text-[11px] mt-1 block" style={{ color: C.inkMuted }}>
                  Total area serviced for this client
                </span>
              </div>

              {/* Artwork Count */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.ink }}>
                  Artwork Count
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="3"
                  value={artworkCountInput}
                  onChange={(e) => setArtworkCountInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded text-sm outline-none transition-colors border font-mono bg-white"
                  style={{ borderColor: C.rule, color: C.ink }}
                />
                <span className="text-[11px] mt-1 block" style={{ color: C.inkMuted }}>
                  Number of paintings installed
                </span>
              </div>

              {/* Art Price (Artwork Investment) */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.ink }}>
                  Art Price (Artwork Value)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-mono font-medium" style={{ color: C.ink }}>
                    {symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="15120"
                    value={artPriceInput}
                    onChange={(e) => setArtPriceInput(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 rounded text-sm outline-none transition-colors border font-mono font-bold bg-white text-amber-900"
                    style={{ borderColor: C.rule }}
                  />
                </div>
                <span className="text-[11px] mt-1 block" style={{ color: C.inkMuted }}>
                  Artwork value from 03 CURATE / Size Pricing
                </span>
              </div>

              {/* Monthly Subscription Price */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.ink }}>
                  Monthly Subscription Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-mono font-medium" style={{ color: C.ink }}>
                    {symbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="12500"
                    value={monthlyPriceInput}
                    onChange={(e) => setMonthlyPriceInput(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 rounded text-sm outline-none transition-colors border font-mono font-bold bg-white"
                    style={{ borderColor: C.rule, color: C.ink }}
                  />
                </div>
                <span className="text-[11px] mt-1 block" style={{ color: C.inkMuted }}>
                  Amount client pays per month
                </span>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * 3. COST CALCULATOR (Section B)
           * ---------------------------------------------------------------*/}
          <div
            className="p-6 rounded border shadow-sm"
            style={{ backgroundColor: C.paper, borderColor: C.rule }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b gap-3" style={{ borderColor: C.rule }}>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded mr-2" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                  SECTION B
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkMuted }}>
                  Monthly &amp; Direct Delivery Costs
                </span>
                <h2 className="text-lg sm:text-xl font-bold mt-0.5" style={{ fontFamily: FONT_DISPLAY }}>
                  Plan Delivery Costs
                </h2>
                <p className="text-xs mt-1" style={{ color: C.inkMuted }}>
                  Each delivery &amp; service activity respects its individual billing frequency. Total spend over 12 months divides into avg. monthly delivery cost.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <div className="px-3 py-1.5 rounded text-xs font-mono border bg-white text-stone-700 hidden sm:block" style={{ borderColor: C.rule }}>
                  Avg. Delivery: <strong className="text-stone-900">{money(clientEconomics.avgMonthlySpend)}</strong>/mo
                </div>
                <button
                  type="button"
                  onClick={handleAddCost}
                  className="px-3.5 py-2 rounded text-xs font-medium transition-colors flex items-center gap-1.5 border"
                  style={{
                    backgroundColor: C.paperDark,
                    borderColor: C.rule,
                    color: C.ink,
                  }}
                >
                  <Plus size={14} />
                  <span>+ Add Cost</span>
                </button>
              </div>
            </div>

            {/* Cost Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b text-[11px] uppercase tracking-wider" style={{ borderColor: C.rule, color: C.inkMuted }}>
                    <th className="pb-2.5 font-semibold">COST / ACTIVITY</th>
                    <th className="pb-2.5 font-semibold w-48">ACTUAL COST</th>
                    <th className="pb-2.5 font-semibold w-60">WHEN IT HAPPENS</th>
                    <th className="pb-2.5 font-semibold w-16 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: C.rule }}>
                  {planCosts.map((cost) => {
                    return (
                      <tr key={cost.id} className="hover:bg-black/5 transition-colors">
                        {/* COST / ACTIVITY */}
                        <td className="py-2.5 pr-3">
                          <input
                            type="text"
                            value={cost.name}
                            onChange={(e) => handleUpdateCost(cost.id, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded text-xs sm:text-sm bg-white border outline-none font-medium"
                            style={{ borderColor: C.rule, color: C.ink }}
                            placeholder="Cost / Activity (e.g. Maintenance)"
                          />
                        </td>

                        {/* ACTUAL COST */}
                        <td className="py-2.5 pr-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs font-mono font-medium" style={{ color: C.inkMuted }}>
                              {symbol}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={cost.amount}
                              onChange={(e) => handleUpdateCost(cost.id, 'amount', e.target.value)}
                              className="w-full pl-6 pr-2 py-1.5 rounded text-xs sm:text-sm bg-white border outline-none font-mono font-bold"
                              style={{ borderColor: C.rule, color: C.ink }}
                              placeholder="0"
                            />
                          </div>
                        </td>

                        {/* WHEN IT HAPPENS */}
                        <td className="py-2.5 pr-3">
                          <select
                            value={cost.frequency}
                            onChange={(e) => handleUpdateCost(cost.id, 'frequency', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded text-xs sm:text-sm bg-white border outline-none font-medium cursor-pointer"
                            style={{ borderColor: C.rule, color: C.ink }}
                          >
                            {SUPPORTED_COST_FREQUENCIES.map((freq) => (
                              <option key={freq.id} value={freq.id}>
                                {freq.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteCost(cost.id)}
                            className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove activity"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {planCosts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-gray-500">
                        No costs configured. Click <strong>+ Add Cost</strong> above to add cost items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * 4. PLAN RESULT (Section C: 4 Simple Cards + Waterfall Equation)
           * CLIENT PAYS − DELIVERY COST − ART PRICE = NET CONTRIBUTION
           * ---------------------------------------------------------------*/}
          <div
            className="p-6 rounded border shadow-sm"
            style={{ backgroundColor: C.paper, borderColor: C.rule }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b gap-3" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                    SECTION C
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkMuted }}>
                    Plan Result
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold mt-0.5" style={{ fontFamily: FONT_DISPLAY }}>
                  Contribution &amp; Plan Result Summary
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle: Monthly vs 12-Month Total */}
                <div className="inline-flex rounded border bg-white p-0.5 text-xs font-mono" style={{ borderColor: C.rule }}>
                  <button
                    type="button"
                    onClick={() => setPlanResultViewMode('monthly')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      planResultViewMode === 'monthly'
                        ? 'bg-stone-900 text-white font-semibold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Monthly Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanResultViewMode('annual')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      planResultViewMode === 'annual'
                        ? 'bg-stone-900 text-white font-semibold shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    12-Month Total
                  </button>
                </div>

                <div className="hidden sm:inline-flex px-3 py-1 rounded text-xs font-mono font-medium border" style={{ backgroundColor: C.paperDark, borderColor: C.rule }}>
                  CLIENT PAYS − DELIVERY COST − ART PRICE = NET CONTRIBUTION
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Client Pay */}
              <div
                className="p-4 rounded border bg-white flex flex-col justify-between"
                style={{ borderColor: C.rule }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: C.inkMuted }}>
                      1. Client Pay
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 uppercase font-semibold">
                      {planResultViewMode === 'annual' ? '12-Mo Total' : 'Monthly Fee'}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mt-2 font-mono" style={{ color: C.ink }}>
                    {money(planResultViewMode === 'annual' ? (clientEconomics.monthlyFee || Number(monthlyPriceInput)) * 12 : (clientEconomics.monthlyFee || Number(monthlyPriceInput)))}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-[11px] text-gray-500" style={{ borderColor: C.rule }}>
                  {planResultViewMode === 'annual'
                    ? `${money(clientEconomics.monthlyFee || Number(monthlyPriceInput))}/mo × 12 months`
                    : `12-mo total: ${money((clientEconomics.monthlyFee || Number(monthlyPriceInput)) * 12)}`}
                </div>
              </div>

              {/* Card 2: Delivery Cost */}
              <div
                className="p-4 rounded border bg-white flex flex-col justify-between"
                style={{ borderColor: C.rule }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider block text-red-800">
                      2. Delivery Cost
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700 uppercase font-semibold">
                      {planResultViewMode === 'annual' ? 'Total Spend' : 'Avg / Mo'}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mt-2 font-mono text-stone-800">
                    {money(planResultViewMode === 'annual' ? clientEconomics.totalSpend : clientEconomics.avgMonthlySpend)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-[11px] text-gray-500" style={{ borderColor: C.rule }}>
                  {planResultViewMode === 'annual'
                    ? `Sum of plan costs over 12 mo`
                    : `12-mo total: ${money(clientEconomics.totalSpend)}`}
                </div>
              </div>

              {/* Card 3: Art Price */}
              <div
                className="p-4 rounded border bg-white flex flex-col justify-between"
                style={{ borderColor: C.rule }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider block text-amber-800">
                      3. Art Price
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 uppercase font-semibold">
                      {planResultViewMode === 'annual' ? 'Full Value' : 'Amortized'}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold mt-2 font-mono text-amber-900">
                    {money(planResultViewMode === 'annual' ? effectiveArtPrice : clientEconomics.monthlyArtCost)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-[11px] text-gray-500" style={{ borderColor: C.rule }}>
                  {planResultViewMode === 'annual'
                    ? `Amortized: ${money(clientEconomics.monthlyArtCost)}/mo`
                    : `Total art value: ${money(effectiveArtPrice)}`}
                </div>
              </div>

              {/* Card 4: Net Contribution */}
              <div
                className="p-4 rounded border flex flex-col justify-between"
                style={{
                  backgroundColor: clientEconomics.monthlyContribution >= 0 ? '#F0FDF4' : '#FEF2F2',
                  borderColor: clientEconomics.monthlyContribution >= 0 ? '#BBF7D0' : '#FECACA',
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: clientEconomics.monthlyContribution >= 0 ? '#166534' : '#991B1B' }}>
                      Net Contribution
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/90 shadow-xs" style={{ color: clientEconomics.monthlyContribution >= 0 ? '#15803D' : '#DC2626' }}>
                      {clientEconomics.contributionPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="text-xl sm:text-2xl font-bold mt-2 font-mono"
                    style={{ color: clientEconomics.monthlyContribution >= 0 ? '#15803D' : '#DC2626' }}
                  >
                    {money(planResultViewMode === 'annual' ? clientEconomics.totalNetContribution : clientEconomics.monthlyContribution)}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t text-[11px]" style={{ borderColor: clientEconomics.monthlyContribution >= 0 ? '#BBF7D0' : '#FECACA', color: clientEconomics.monthlyContribution >= 0 ? '#166534' : '#991B1B' }}>
                  {planResultViewMode === 'annual'
                    ? `12-mo Net Cash = Client Pay − Delivery − Art`
                    : `Monthly Net = Fee − Delivery/mo − Art/mo`}
                </div>
              </div>
            </div>

            {/* Visual Waterfall Equation Bar */}
            <div className="mt-4 p-4 rounded border bg-white" style={{ borderColor: C.rule }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-3 border-b text-xs font-mono" style={{ borderColor: C.rule }}>
                <span className="font-semibold uppercase tracking-wider text-stone-700">
                  Plan Result Calculation ({planResultViewMode === 'annual' ? '12-Month Annual Total' : 'Monthly Cash Flow'})
                </span>
                {clientEconomics.recoveryMonths !== null && clientEconomics.recoveryMonths > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px]">
                    Art Price Recouped In: <strong>{clientEconomics.recoveryMonths} months</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-7 items-center text-center gap-2 font-mono py-1">
                {/* 1. Client Pay */}
                <div className="p-2.5 rounded bg-stone-50 border sm:col-span-2" style={{ borderColor: C.rule }}>
                  <span className="text-[10px] uppercase font-semibold text-gray-500 block">1. Client Pay</span>
                  <div className="text-base font-bold text-stone-900 mt-0.5">
                    {money(planResultViewMode === 'annual' ? (clientEconomics.monthlyFee || Number(monthlyPriceInput)) * 12 : (clientEconomics.monthlyFee || Number(monthlyPriceInput)))}
                  </div>
                  <span className="text-[10px] text-gray-500">{planResultViewMode === 'annual' ? '12 mo subscription' : 'per month'}</span>
                </div>

                {/* Operator - */}
                <div className="text-xl font-bold text-stone-400 select-none hidden sm:block">−</div>

                {/* 2. Delivery Cost */}
                <div className="p-2.5 rounded bg-red-50/50 border border-red-100 sm:col-span-1">
                  <span className="text-[10px] uppercase font-semibold text-red-700 block">2. Delivery Cost</span>
                  <div className="text-base font-bold text-stone-800 mt-0.5">
                    {money(planResultViewMode === 'annual' ? clientEconomics.totalSpend : clientEconomics.avgMonthlySpend)}
                  </div>
                  <span className="text-[10px] text-gray-500">{planResultViewMode === 'annual' ? 'all activities' : 'avg/mo'}</span>
                </div>

                {/* Operator - */}
                <div className="text-xl font-bold text-stone-400 select-none hidden sm:block">−</div>

                {/* 3. Art Price */}
                <div className="p-2.5 rounded bg-amber-50/50 border border-amber-100 sm:col-span-1">
                  <span className="text-[10px] uppercase font-semibold text-amber-800 block">3. Art Price</span>
                  <div className="text-base font-bold text-amber-900 mt-0.5">
                    {money(planResultViewMode === 'annual' ? effectiveArtPrice : clientEconomics.monthlyArtCost)}
                  </div>
                  <span className="text-[10px] text-gray-500">{planResultViewMode === 'annual' ? 'full artwork' : 'amortized'}</span>
                </div>

                {/* Operator = & 4. Net Contribution */}
                <div className="p-2.5 rounded sm:col-span-1 border" style={{
                  backgroundColor: clientEconomics.monthlyContribution >= 0 ? '#F0FDF4' : '#FEF2F2',
                  borderColor: clientEconomics.monthlyContribution >= 0 ? '#BBF7D0' : '#FECACA',
                }}>
                  <span className="text-[10px] uppercase font-semibold block" style={{ color: clientEconomics.monthlyContribution >= 0 ? '#166534' : '#991B1B' }}>
                    = Net Contribution
                  </span>
                  <div className="text-base font-bold mt-0.5" style={{ color: clientEconomics.monthlyContribution >= 0 ? '#15803D' : '#DC2626' }}>
                    {money(planResultViewMode === 'annual' ? clientEconomics.totalNetContribution : clientEconomics.monthlyContribution)}
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: clientEconomics.monthlyContribution >= 0 ? '#15803D' : '#DC2626' }}>
                    {clientEconomics.contributionPercent.toFixed(1)}% margin
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-gray-500 gap-1" style={{ borderColor: C.rule }}>
                <span>
                  Operating Contribution (before Art Price): <strong className="text-stone-800 font-mono">{money(planResultViewMode === 'annual' ? ((clientEconomics.monthlyFee || Number(monthlyPriceInput)) * 12 - clientEconomics.totalSpend) : clientEconomics.monthlyContributionBeforeArt)}</strong>
                </span>
                <span>
                  Total Costs (Delivery + Art): <strong className="text-stone-800 font-mono">{money(planResultViewMode === 'annual' ? clientEconomics.totalCostOverPeriod : clientEconomics.avgMonthlyTotalCost)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * 5. SUBMIT / UPDATE SUBSCRIPTION (Section D)
           * ---------------------------------------------------------------*/}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded border" style={{ backgroundColor: C.paperDark, borderColor: C.rule }}>
            <div>
              <span className="text-sm font-bold block" style={{ color: C.ink }}>
                {existingSubscription ? 'Update Existing Subscription' : 'Assign Subscription Plan to Client'}
              </span>
              <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                {existingSubscription
                  ? `Updates subscription for "${selectedCuratedClient?.clientName}" to ${currentPlanTemplate.name} (${money(monthlyPriceInput)}/mo). Will not create a duplicate client.`
                  : `Assigns ${currentPlanTemplate.name} plan to "${selectedCuratedClient?.clientName || 'selected client'}" and saves to Active Clients & Plans below.`}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmitSubscription}
                disabled={!selectedCuratedClient}
                className="flex-1 sm:flex-none px-6 py-3 rounded text-xs sm:text-sm font-semibold tracking-wide transition-all shadow hover:shadow-md flex items-center justify-center gap-2"
                style={{
                  backgroundColor: C.ink,
                  color: C.paper,
                  opacity: selectedCuratedClient ? 1 : 0.5,
                  cursor: selectedCuratedClient ? 'pointer' : 'not-allowed',
                }}
              >
                {existingSubscription ? (
                  <>
                    <Check size={16} className="text-emerald-400" />
                    <span>UPDATE SUBSCRIPTION</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-amber-400" />
                    <span>SUBMIT SUBSCRIPTION</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
           * 6. ACTIVE CLIENTS & PLANS (Section E)
           * Table: Client | Plan | Monthly Fee | Monthly Cost | Contribution | Actions
           * ---------------------------------------------------------------*/}
          <div
            className="p-6 rounded border shadow-sm"
            style={{ backgroundColor: C.paper, borderColor: C.rule }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b gap-2" style={{ borderColor: C.rule }}>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded mr-2" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                  SECTION E
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.inkMuted }}>
                  Active Portfolio
                </span>
                <h2 className="text-lg sm:text-xl font-bold mt-0.5" style={{ fontFamily: FONT_DISPLAY }}>
                  ACTIVE CLIENTS &amp; PLANS
                </h2>
                <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                  Clients from 03 CURATE that have been assigned an active subscription plan.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded self-start sm:self-auto" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                {activeClients.length} Active Subscription{activeClients.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Clients Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b text-[11px] uppercase tracking-wider" style={{ borderColor: C.rule, color: C.inkMuted }}>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Plan</th>
                    <th className="pb-3 font-semibold text-right">Space</th>
                    <th className="pb-3 font-semibold text-right">Paintings</th>
                    <th className="pb-3 font-semibold text-right">Client Pay</th>
                    <th className="pb-3 font-semibold text-right">Delivery Cost</th>
                    <th className="pb-3 font-semibold text-right">Art Price</th>
                    <th className="pb-3 font-semibold text-right">Net Contribution</th>
                    <th className="pb-3 font-semibold text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: C.rule }}>
                  {activeClients.map((client) => {
                    const isSelected = existingSubscription && existingSubscription.id === client.id;
                    // Resolve live from 03 CURATE (Single Source of Truth)
                    const curateClient = curatedClientsList?.find(
                      (c) =>
                        (client.clientId && c.id === client.clientId) ||
                        c.clientName?.trim().toLowerCase() === client.clientName?.trim().toLowerCase()
                    ) || client;

                    const displayClientName = curateClient.clientName || client.clientName;
                    const displayCollection = curateClient.collectionName !== undefined ? curateClient.collectionName : client.collectionName;
                    const displayLocation = curateClient.location !== undefined ? curateClient.location : client.location;
                    const displaySpace = curateClient.spaceSqFt !== undefined && curateClient.spaceSqFt !== null
                      ? curateClient.spaceSqFt
                      : client.spaceSqFt;
                    const displayArtworks = curateClient.artworkCount !== undefined && curateClient.artworkCount !== null
                      ? curateClient.artworkCount
                      : client.artworkCount;

                    const clientArtPrice = client.totalArtworkInvestment !== undefined
                      ? client.totalArtworkInvestment
                      : (curateClient.totalArtworkInvestment || 0);

                    const clientTotalSpend = client.totalSpend !== undefined
                      ? client.totalSpend
                      : (client.costs && client.costs.length > 0
                          ? calculateClientEconomics({ costs: client.costs, monthlyFee: client.monthlyFee, periodMonths: 12, artPrice: clientArtPrice }).totalSpend
                          : ((client.monthlyCost || 0) * 12));
                    const clientAvgSpend = client.avgMonthlySpend !== undefined
                      ? client.avgMonthlySpend
                      : Math.round(clientTotalSpend / 12);
                    const clientContrib = client.monthlyContribution !== undefined
                      ? client.monthlyContribution
                      : (client.monthlyFee - clientAvgSpend - Math.round(clientArtPrice / 12));

                    return (
                      <tr
                        key={client.id}
                        className={`transition-colors ${isSelected ? 'bg-amber-50/60' : 'hover:bg-black/5'}`}
                      >
                        {/* Client Name */}
                        <td className="py-3 pr-2 font-medium">
                          <div className="font-semibold" style={{ color: C.ink }}>
                            {displayClientName}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            {displayCollection ? `${displayCollection} • ` : ''}{displayLocation || ''}
                          </div>
                        </td>

                        {/* Plan Name */}
                        <td className="py-3 pr-2">
                          <span
                            className="inline-block px-2.5 py-0.5 rounded text-[11px] font-medium border"
                            style={{
                              backgroundColor: C.paperDark,
                              borderColor: C.rule,
                              color: C.ink,
                            }}
                          >
                            {client.planName || client.planId}
                          </span>
                        </td>

                        {/* Space (Live from 03 CURATE) */}
                        <td className="py-3 text-right font-mono text-xs pr-2" style={{ color: C.ink }}>
                          {displaySpace ? `${displaySpace.toLocaleString('en-IN')} sq ft` : '—'}
                        </td>

                        {/* Paintings (Live from 03 CURATE) */}
                        <td className="py-3 text-right font-mono text-xs pr-2" style={{ color: C.ink }}>
                          {displayArtworks || 0} pcs
                        </td>

                        {/* Client Pay (Monthly Fee) */}
                        <td className="py-3 text-right font-mono font-bold pr-2" style={{ color: C.ink }}>
                          {money(client.monthlyFee)}
                        </td>

                        {/* Delivery Cost (Monthly & 12-mo) */}
                        <td className="py-3 text-right font-mono text-stone-700 pr-2">
                          <div className="font-semibold text-red-800">{money(clientAvgSpend)}</div>
                          <span className="text-[10px] text-gray-400 font-sans">12 mo: {money(clientTotalSpend)}</span>
                        </td>

                        {/* Art Price (Total & Amortized) */}
                        <td className="py-3 text-right font-mono text-stone-700 pr-2">
                          <div className="font-semibold text-amber-900">{money(clientArtPrice)}</div>
                          <span className="text-[10px] text-gray-400 font-sans">{money(Math.round(clientArtPrice / 12))}/mo</span>
                        </td>

                        {/* Net Contribution */}
                        <td className="py-3 text-right font-mono font-bold pr-2" style={{ color: clientContrib >= 0 ? '#15803D' : '#DC2626' }}>
                          <div>{money(clientContrib)}</div>
                          <span className="text-[10px] font-sans font-normal" style={{ color: clientContrib >= 0 ? '#166534' : '#991B1B' }}>
                            {client.monthlyFee > 0 ? ((clientContrib / client.monthlyFee) * 100).toFixed(1) : 0}%
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingClient(client)}
                              className="p-1.5 rounded hover:bg-black/10 text-gray-700 transition-colors"
                              title="View details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditActiveClient(client)}
                              className="p-1.5 rounded hover:bg-black/10 text-blue-700 transition-colors"
                              title="Edit subscription"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActiveClient(client.id)}
                              className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                              title="Unassign subscription"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {activeClients.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-gray-500">
                        No active subscription clients yet. Select a client from 03 CURATE above, choose a plan, and click{' '}
                        <strong>SUBMIT SUBSCRIPTION</strong> to assign their subscription.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Table Footer Totals */}
                {activeClients.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 font-semibold text-xs sm:text-sm" style={{ borderColor: C.ink, backgroundColor: C.paperDark }}>
                      <td colSpan={4} className="py-3 pl-3">
                        TOTALS ({clientTotals.count} Clients)
                        <span className="ml-2 text-[11px] font-normal text-gray-600">
                          Margin: {clientTotals.marginPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-sm sm:text-base font-bold pr-2" style={{ color: C.ink }}>
                        {money(clientTotals.totalRevenue)}
                      </td>
                      <td className="py-3 text-right font-mono text-sm sm:text-base text-red-800 pr-2">
                        {money(clientTotals.totalCost)}
                      </td>
                      <td className="py-3 text-right font-mono text-sm sm:text-base text-amber-900 pr-2">
                        {money(clientTotals.totalArtPrice)}
                      </td>
                      <td className="py-3 text-right font-mono text-sm sm:text-base font-bold pr-2" style={{ color: '#15803D' }}>
                        {money(clientTotals.totalContribution)}
                      </td>
                      <td className="py-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
       * SCREEN 2 — COMPANY PERFORMANCE & TARGET (TRUE ONE-SCREEN DASHBOARD)
       * ===================================================================*/}
      {activeScreen === 'performance' && (
        <div className="space-y-4 animate-fadeIn">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b gap-1" style={{ borderColor: C.rule }}>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                COMPANY PERFORMANCE &amp; TARGET
              </h2>
              <p className="text-xs" style={{ color: C.inkMuted }}>
                Live executive dashboard tracking active subscription contribution against company operational requirement.
              </p>
            </div>
            <div>
              {performance.isTargetReached ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>TARGET REACHED ✓</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold shadow-xs">
                  <AlertCircle size={14} className="text-amber-700" />
                  <span>TARGET NOT REACHED</span>
                </div>
              )}
            </div>
          </div>

          {/* TOP STAT CARDS (4 cards in one row) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: ACTIVE CLIENTS */}
            <div className="p-3.5 rounded border bg-white shadow-xs flex flex-col justify-between" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    ACTIVE CLIENTS
                  </span>
                  <Users size={14} className="text-gray-400" />
                </div>
                <div className="text-2xl font-bold mt-1 font-mono text-stone-900">
                  {performance.totalActiveClients}
                </div>
                <span className="text-[10px] text-gray-500 block">Current subscriber accounts</span>
              </div>
              <div className="mt-2.5 pt-2 border-t flex items-center justify-between" style={{ borderColor: C.rule }}>
                <button
                  type="button"
                  onClick={() => setShowActiveClientsModal(true)}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <Eye size={12} />
                  <span>View Clients ({performance.totalActiveClients})</span>
                </button>
                {onNavigateToSubscription && (
                  <button
                    type="button"
                    onClick={onNavigateToSubscription}
                    className="text-[10px] text-gray-500 hover:text-stone-800 flex items-center gap-0.5"
                    title="Go to 04 SUBSCRIPTION"
                  >
                    <span>04 SUBSCRIPTION</span>
                    <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: MONTHLY REVENUE */}
            <div className="p-3.5 rounded border bg-white shadow-xs" style={{ borderColor: C.rule }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  MONTHLY REVENUE
                </span>
                <Building2 size={14} className="text-gray-400" />
              </div>
              <div className="text-2xl font-bold mt-1 font-mono text-stone-900">
                {money(performance.totalMonthlySubscriptionRevenue)}
              </div>
              <span className="text-[10px] text-gray-500 block">Total subscriber billings</span>
            </div>

            {/* Card 3: MONTHLY CONTRIBUTION */}
            <div
              className="p-3.5 rounded border shadow-xs"
              style={{
                backgroundColor: performance.totalMonthlyContribution >= 0 ? '#F0FDF4' : '#FEF2F2',
                borderColor: performance.totalMonthlyContribution >= 0 ? '#BBF7D0' : '#FECACA',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                  MONTHLY CONTRIBUTION
                </span>
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-bold mt-1 font-mono text-emerald-700">
                {money(performance.totalMonthlyContribution)}
              </div>
              <span className="text-[10px] text-emerald-700 block">Total net operating contribution</span>
            </div>

            {/* Card 4: COMPANY REQUIREMENT */}
            <div className="p-3.5 rounded border bg-white shadow-xs flex flex-col justify-between" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    COMPANY REQUIREMENT
                  </span>
                  <ShieldCheck size={14} className="text-gray-400" />
                </div>
                <div className="text-2xl font-bold mt-1 font-mono text-stone-900">
                  {money(performance.totalCompanyMonthlyRequirement)}
                </div>
                <span className="text-[10px] text-gray-500 block">Total monthly expenses</span>
              </div>
              <div className="mt-2.5 pt-2 border-t flex items-center justify-between" style={{ borderColor: C.rule }}>
                <a
                  href="#company-monthly-expenses"
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  <Edit2 size={11} />
                  <span>Edit Expenses ↓</span>
                </a>
                <span className="text-[10px] text-gray-400 font-mono">
                  {6 + ((companyExpenses.customItems || []).length)} categories
                </span>
              </div>
            </div>
          </div>

          {/* MAIN DASHBOARD AREA (2 columns side by side) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* LEFT: CONTRIBUTION vs COMPANY REQUIREMENT visual graph */}
            <div className="lg:col-span-7 p-4 rounded border bg-white shadow-xs flex flex-col justify-between" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-900">
                    CONTRIBUTION vs COMPANY REQUIREMENT
                  </span>
                  <span className="text-xs font-mono font-bold" style={{ color: performance.isTargetReached ? '#15803D' : '#B45309' }}>
                    {performance.rawProgressPercent.toFixed(1)}% covered
                  </span>
                </div>

                <div className="space-y-3 mt-3">
                  {/* Company Requirement Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Company Requirement</span>
                      <span className="font-mono font-bold text-stone-900">{money(performance.totalCompanyMonthlyRequirement)}</span>
                    </div>
                    <div className="w-full h-5 rounded bg-stone-100 border overflow-hidden" style={{ borderColor: C.rule }}>
                      <div className="w-full h-full rounded" style={{ backgroundColor: C.ink }} />
                    </div>
                  </div>

                  {/* Current Contribution Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Current Contribution</span>
                      <span className="font-mono font-bold" style={{ color: performance.isTargetReached ? '#15803D' : '#D97706' }}>
                        {money(performance.totalMonthlyContribution)}
                      </span>
                    </div>
                    <div className="w-full h-5 rounded bg-stone-100 border overflow-hidden" style={{ borderColor: C.rule }}>
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{
                          width: `${Math.min(performance.rawProgressPercent, 100)}%`,
                          backgroundColor: performance.isTargetReached ? '#16A34A' : '#D97706',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono" style={{ borderColor: C.rule, color: C.inkMuted }}>
                <span>Baseline shortfall: {money(performance.remainingRequirement)}</span>
                <span>{performance.isTargetReached ? 'Target exceeded by ' + money(performance.surplus) + '/mo' : 'Deficit to breakeven'}</span>
              </div>
            </div>

            {/* RIGHT: REMAINING REQUIREMENT, ADDITIONAL PLANS NEEDED, TARGET STATUS */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {/* Remaining Requirement Card */}
              <div
                className="p-3 rounded border flex items-center justify-between"
                style={{
                  backgroundColor: performance.remainingRequirement === 0 ? '#F0FDF4' : '#FFFBEB',
                  borderColor: performance.remainingRequirement === 0 ? '#BBF7D0' : '#FDE68A',
                }}
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: performance.remainingRequirement === 0 ? '#166534' : '#92400E' }}>
                    REMAINING REQUIREMENT
                  </span>
                  <div className="text-xl font-bold font-mono mt-0.5" style={{ color: performance.remainingRequirement === 0 ? '#15803D' : '#B45309' }}>
                    {money(performance.remainingRequirement)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] block" style={{ color: performance.remainingRequirement === 0 ? '#166534' : '#92400E' }}>
                    {performance.remainingRequirement === 0 ? 'Surplus: ' + money(performance.surplus) : 'To reach breakeven'}
                  </span>
                </div>
              </div>

              {/* Additional Plans Needed Card */}
              <div className="p-3 rounded border bg-stone-900 text-white flex items-center justify-between" style={{ borderColor: C.ink }}>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block opacity-75">
                    ADDITIONAL PLANS NEEDED
                  </span>
                  <div className="text-2xl font-bold font-mono mt-0.5">
                    {performance.additionalPlansNeeded}{' '}
                    <span className="text-xs font-normal opacity-75">
                      {PLAN_TABS.find((t) => t.id === additionalPlanType)?.label || 'Plan'}s
                    </span>
                  </div>
                </div>
                <div className="text-right text-[10px] opacity-75 font-mono">
                  @ {money(selectedPlanContrib)}/mo contrib
                </div>
              </div>

              {/* Target Status Card */}
              <div
                className="p-2.5 rounded border text-center flex items-center justify-center gap-2"
                style={{
                  backgroundColor: performance.isTargetReached ? '#DCFCE7' : '#FEF3C7',
                  borderColor: performance.isTargetReached ? '#86EFAC' : '#FCD34D',
                  color: performance.isTargetReached ? '#166534' : '#92400E',
                }}
              >
                {performance.isTargetReached ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span className="font-bold text-xs uppercase tracking-wider">
                  TARGET STATUS: {performance.isTargetReached ? 'TARGET REACHED' : 'TARGET NOT REACHED'}
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM COMPACT AREA (2 columns side by side) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* LEFT: COMPANY MONTHLY EXPENSES (FULLY EDITABLE) */}
            <div
              id="company-monthly-expenses"
              className="lg:col-span-7 p-3.5 rounded border bg-white shadow-xs flex flex-col justify-between"
              style={{ borderColor: C.rule }}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between mb-2.5 gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-900 block">
                        COMPANY MONTHLY EXPENSES ({isTechOneTime ? `Recurring: ${money(performance.totalCompanyMonthlyRequirement)}` : `Total: ${money(performance.totalCompanyMonthlyRequirement)}`})
                      </span>
                      {isTechOneTime && Number(companyExpenses.technologySoftware) > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200 shadow-2xs">
                          + {money(companyExpenses.technologySoftware)} One-Time Tech Investment
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {isTechOneTime
                        ? 'Recurring operational overhead sets your monthly break-even target. Technology is tracked as one-time capital.'
                        : 'Direct overhead — edit any category below to recalculate targets live'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddCustomExpense}
                      className="px-2 py-1 rounded text-[10px] font-semibold border flex items-center gap-1 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
                      style={{ borderColor: C.rule }}
                      title="Add custom overhead expense item"
                    >
                      <Plus size={12} />
                      <span>Add Expense</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCompanyExpenses}
                      className="px-2 py-1 rounded text-[10px] font-semibold border flex items-center gap-1 bg-white hover:bg-stone-50 text-stone-700 transition-colors"
                      style={{ borderColor: C.rule }}
                      title="Reset expenses to default ₹4,60,000"
                    >
                      <RotateCcw size={12} />
                      <span>Reset Defaults</span>
                    </button>
                  </div>
                </div>

                {/* 6 Standard Direct Overhead Categories */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {/* Salary */}
                  <div className="p-2 rounded bg-stone-50 border flex flex-col justify-between gap-1" style={{ borderColor: C.rule }}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 text-[11px] font-semibold">Salary</span>
                      <span className="text-[9px] text-emerald-700 font-sans font-medium">Recurring Team</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={companyExpenses.employeeSalaries ?? ''}
                        onChange={(e) => handleUpdateCompanyExpense('employeeSalaries', e.target.value)}
                        onBlur={() => handleExpenseBlur('employeeSalaries')}
                        className="w-full pl-5 pr-1.5 py-1 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none focus:border-stone-500 transition-colors"
                        style={{ borderColor: C.rule }}
                        placeholder="300000"
                      />
                    </div>
                  </div>

                  {/* Rent */}
                  <div className="p-2 rounded bg-stone-50 border flex flex-col justify-between gap-1" style={{ borderColor: C.rule }}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 text-[11px] font-semibold">Rent</span>
                      <span className="text-[9px] text-emerald-700 font-sans font-medium">Recurring Office</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={companyExpenses.officeRent ?? ''}
                        onChange={(e) => handleUpdateCompanyExpense('officeRent', e.target.value)}
                        onBlur={() => handleExpenseBlur('officeRent')}
                        className="w-full pl-5 pr-1.5 py-1 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none focus:border-stone-500 transition-colors"
                        style={{ borderColor: C.rule }}
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  {/* Travel */}
                  <div className="p-2 rounded bg-stone-50 border flex flex-col justify-between gap-1" style={{ borderColor: C.rule }}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 text-[11px] font-semibold">Travel</span>
                      <span className="text-[9px] text-emerald-700 font-sans font-medium">Recurring Ops</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={companyExpenses.petrolTravel ?? ''}
                        onChange={(e) => handleUpdateCompanyExpense('petrolTravel', e.target.value)}
                        onBlur={() => handleExpenseBlur('petrolTravel')}
                        className="w-full pl-5 pr-1.5 py-1 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none focus:border-stone-500 transition-colors"
                        style={{ borderColor: C.rule }}
                        placeholder="15000"
                      />
                    </div>
                  </div>

                  {/* Technology (Toggle between One-Time CapEx and Recurring OpEx) */}
                  <div
                    className="p-2 rounded border flex flex-col justify-between gap-1 transition-all"
                    style={{
                      borderColor: isTechOneTime ? '#93c5fd' : C.rule,
                      backgroundColor: isTechOneTime ? '#eff6ff' : '#fafaf9',
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-900 text-[11px] font-bold">Technology</span>
                        <span className="text-[9px] text-gray-500 font-sans">Software</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleTechnologyOneTime()}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight uppercase border transition-colors shadow-2xs"
                        style={{
                          backgroundColor: isTechOneTime ? '#1e40af' : '#ffffff',
                          color: isTechOneTime ? '#ffffff' : '#475569',
                          borderColor: isTechOneTime ? '#1e40af' : '#cbd5e1',
                        }}
                        title={isTechOneTime ? 'Switch to Monthly Recurring' : 'Switch to One-Time Investment'}
                      >
                        {isTechOneTime ? 'One-Time' : 'Recurring'}
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={companyExpenses.technologySoftware ?? ''}
                        onChange={(e) => handleUpdateCompanyExpense('technologySoftware', e.target.value)}
                        onBlur={() => handleExpenseBlur('technologySoftware')}
                        className="w-full pl-5 pr-1.5 py-1 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none focus:border-stone-500 transition-colors"
                        style={{ borderColor: isTechOneTime ? '#bfdbfe' : C.rule }}
                        placeholder="500000"
                      />
                    </div>

                    <span
                      className="text-[9px] leading-tight block truncate font-sans"
                      style={{ color: isTechOneTime ? '#1d4ed8' : '#64748b' }}
                      title={isTechOneTime ? 'One-time investment (CapEx) — excluded from monthly recurring requirement, recovered via Stage 06 GROWTH.' : 'Recurring OpEx — included in monthly break-even requirement.'}
                    >
                      {isTechOneTime ? '★ One-time investment (CapEx)' : 'Monthly recurring overhead'}
                    </span>
                  </div>

                  {/* Marketing */}
                  <div className="p-2 rounded bg-stone-50 border flex flex-col justify-between gap-1" style={{ borderColor: C.rule }}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 text-[11px] font-semibold">Marketing</span>
                      <span className="text-[9px] text-emerald-700 font-sans font-medium">Recurring Growth</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={companyExpenses.marketing ?? ''}
                        onChange={(e) => handleUpdateCompanyExpense('marketing', e.target.value)}
                        onBlur={() => handleExpenseBlur('marketing')}
                        className="w-full pl-5 pr-1.5 py-1 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none focus:border-stone-500 transition-colors"
                        style={{ borderColor: C.rule }}
                        placeholder="35000"
                      />
                    </div>
                  </div>

                  {/* Other */}
                  <div className="p-2 rounded bg-stone-50 border flex flex-col justify-between gap-1" style={{ borderColor: C.rule }}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 text-[11px] font-semibold">Other</span>
                      <span className="text-[9px] text-emerald-700 font-sans font-medium">Recurring Misc</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={currentOtherExpenses}
                        onChange={(e) => handleUpdateOtherExpense(e.target.value)}
                        onBlur={() => handleExpenseBlur('otherExpenses')}
                        className="w-full pl-5 pr-1.5 py-1 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none focus:border-stone-500 transition-colors"
                        style={{ borderColor: C.rule }}
                        placeholder="40000"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Overhead Expenses (if any) */}
                {Array.isArray(companyExpenses.customItems) && companyExpenses.customItems.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t space-y-2" style={{ borderColor: C.rule }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                      Custom Overhead Items ({companyExpenses.customItems.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {companyExpenses.customItems.map((item) => (
                        <div key={item.id} className="p-1.5 rounded bg-stone-50 border flex items-center gap-1.5" style={{ borderColor: C.rule }}>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateCustomExpense(item.id, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 rounded text-xs bg-white border outline-none text-stone-900 font-medium"
                            style={{ borderColor: C.rule }}
                            placeholder="Expense name"
                          />
                          <div className="relative w-24">
                            <span className="absolute left-1.5 top-1 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                            <input
                              type="number"
                              min="0"
                              value={item.amount ?? ''}
                              onChange={(e) => handleUpdateCustomExpense(item.id, 'amount', e.target.value)}
                              onBlur={() => handleCustomExpenseBlur(item.id)}
                              className="w-full pl-4 pr-1 py-1 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none"
                              style={{ borderColor: C.rule }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomExpense(item.id)}
                            className="p-1 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                            title="Remove custom expense"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: ADDITIONAL PLAN SELECTOR (SCENARIO MODELING) */}
            <div className="lg:col-span-5 p-3.5 rounded border bg-white shadow-xs flex flex-col justify-between" style={{ borderColor: C.rule }}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-900">
                    ADDITIONAL PLAN SELECTOR
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Scenario Modeling</span>
                </div>

                <div className="flex items-center gap-2 mb-2.5">
                  <div className="relative flex-1">
                    <select
                      value={additionalPlanType}
                      onChange={(e) => {
                        setAdditionalPlanType(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 rounded text-xs bg-stone-50 border outline-none font-bold cursor-pointer appearance-none pr-8"
                      style={{ borderColor: C.rule, color: C.ink }}
                    >
                      {PLAN_TABS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label} Plan
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Editable Contribution per Plan with Plan Default Reset */}
                <div className="p-2.5 rounded bg-stone-50 border mb-2" style={{ borderColor: C.rule }}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-600 font-medium">
                      Contribution per {PLAN_TABS.find((t) => t.id === additionalPlanType)?.label}:
                    </span>
                    {customPlanContribOverride !== '' && (
                      <button
                        type="button"
                        onClick={() => setCustomPlanContribOverride('')}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                        title="Revert to configured plan contribution"
                      >
                        <RotateCcw size={10} />
                        <span>Reset ({money(selectedPlanContrib)})</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs font-mono font-medium text-gray-400 pointer-events-none">{symbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={customPlanContribOverride !== '' ? customPlanContribOverride : selectedPlanContrib}
                      onChange={(e) => setCustomPlanContribOverride(e.target.value)}
                      className="w-full pl-6 pr-3 py-1.5 rounded text-xs font-mono font-bold bg-white border text-stone-900 outline-none focus:border-stone-500 transition-colors"
                      style={{ borderColor: C.rule }}
                      placeholder={String(selectedPlanContrib)}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {customPlanContribOverride !== '' ? '⚡ Custom scenario contribution active' : 'Computed from 04 SUBSCRIPTION plan cost model'}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t flex items-center justify-between text-xs font-mono" style={{ borderColor: C.rule }}>
                <span className="text-gray-600">Plans needed to breakeven:</span>
                <strong className="text-stone-900 text-sm sm:text-base font-bold">
                  {performance.additionalPlansNeeded}{' '}
                  <span className="text-xs font-normal text-gray-500">
                    {PLAN_TABS.find((t) => t.id === additionalPlanType)?.label || 'Plan'}s
                  </span>
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
       * CLIENT VIEW DETAILS MODAL
       * ===================================================================*/}
      {viewingClient && (() => {
        const viewingCurated = curatedClientsList?.find(
          (c) =>
            (viewingClient.clientId && c.id === viewingClient.clientId) ||
            c.clientName?.trim().toLowerCase() === viewingClient.clientName?.trim().toLowerCase()
        ) || viewingClient;
        const viewName = viewingCurated.clientName || viewingClient.clientName;
        const viewSpace = viewingCurated.spaceSqFt !== undefined && viewingCurated.spaceSqFt !== null ? viewingCurated.spaceSqFt : viewingClient.spaceSqFt;
        const viewArtworks = viewingCurated.artworkCount !== undefined && viewingCurated.artworkCount !== null ? viewingCurated.artworkCount : viewingClient.artworkCount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div
              className="w-full max-w-2xl rounded-lg shadow-xl overflow-hidden animate-fadeIn"
              style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}
            >
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: C.rule }}>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                    CLIENT PROFILE
                  </span>
                  <h3 className="text-xl font-bold mt-1" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                    {viewName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingClient(null)}
                  className="p-1.5 rounded hover:bg-black/10 transition-colors text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">Plan</span>
                    <span className="text-sm font-bold mt-0.5 block">{viewingClient.planName}</span>
                  </div>
                  <div className="p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">Space / Area</span>
                    <span className="text-sm font-bold font-mono mt-0.5 block">
                      {viewSpace ? `${viewSpace.toLocaleString('en-IN')} sq ft` : '—'}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">Artworks</span>
                    <span className="text-sm font-bold font-mono mt-0.5 block">{viewArtworks}</span>
                  </div>
                  <div className="p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">Monthly Fee</span>
                    <span className="text-sm font-bold font-mono mt-0.5 block">{money(viewingClient.monthlyFee)}</span>
                  </div>
                </div>

              {/* Financial Metrics */}
              <div className="p-4 rounded border bg-white" style={{ borderColor: C.rule }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Client Economics Breakdown
                  </div>
                  <div className="text-[11px] font-mono text-gray-500">
                    Client Pay − Delivery Cost − Art Price = Net Contribution
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-semibold">1. Client Pay</span>
                    <span className="text-base font-bold text-stone-900">{money(viewingClient.monthlyFee)}</span>
                    <span className="text-[10px] text-gray-400 block font-sans">12 mo: {money((viewingClient.monthlyFee || 0) * 12)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-red-700 block uppercase font-semibold">2. Delivery Cost</span>
                    <span className="text-base font-bold text-red-800">
                      {money(viewingClient.avgMonthlySpend ?? viewingClient.monthlyCost)}/mo
                    </span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      12 mo: {money(viewingClient.totalSpend ?? ((viewingClient.monthlyCost || 0) * 12))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-700 block uppercase font-semibold">3. Art Price</span>
                    <span className="text-base font-bold text-amber-900">
                      {money(viewingClient.totalArtworkInvestment || viewingCurated.totalArtworkInvestment || 0)}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      Amortized: {money(Math.round((viewingClient.totalArtworkInvestment || viewingCurated.totalArtworkInvestment || 0) / 12))}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 block uppercase font-semibold">Net Contribution</span>
                    <span className="text-base font-bold text-emerald-700">{money(viewingClient.monthlyContribution)}/mo</span>
                    <span className="text-[10px] text-gray-400 block font-sans">
                      12 mo: {money(viewingClient.totalNetContribution ?? ((viewingClient.monthlyContribution || 0) * 12))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Costs Breakdown */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.inkMuted }}>
                  Cost Items Breakdown ({viewingClient.costs?.length || 0})
                </h4>
                <div className="border rounded overflow-hidden bg-white" style={{ borderColor: C.rule }}>
                  <table className="w-full text-xs text-left">
                    <thead className="border-b text-[11px] uppercase tracking-wider" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
                      <tr>
                        <th className="py-2 px-3 font-semibold">COST / ACTIVITY</th>
                        <th className="py-2 px-3 font-semibold">ACTUAL COST</th>
                        <th className="py-2 px-3 font-semibold">WHEN IT HAPPENS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: C.rule }}>
                      {(viewingClient.costs || []).map((c, idx) => {
                        const freqLabel = SUPPORTED_COST_FREQUENCIES.find((f) => f.id === c.frequency)?.label || c.frequency?.replace(/_/g, ' ');
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium">{c.name}</td>
                            <td className="py-2 px-3 font-mono font-bold">{money(c.amount)}</td>
                            <td className="py-2 px-3 font-medium">{freqLabel}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
              <button
                type="button"
                onClick={() => setViewingClient(null)}
                className="px-4 py-1.5 rounded text-xs font-medium border bg-white transition-colors"
                style={{ borderColor: C.rule, color: C.ink }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ===================================================================
       * ACTIVE SUBSCRIPTION CLIENTS MODAL (FROM SCREEN 2)
       * ===================================================================*/}
      {showActiveClientsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-4xl rounded-lg shadow-xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]"
            style={{ backgroundColor: C.paper, border: `1px solid ${C.rule}` }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: C.rule }}>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: C.paperDark, color: C.inkMuted }}>
                  PORTFOLIO SUBSCRIBERS
                </span>
                <h3 className="text-xl font-bold mt-1" style={{ fontFamily: FONT_DISPLAY, color: C.ink }}>
                  Active Clients &amp; Revenue Sources
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Accounts generating {money(performance.totalMonthlySubscriptionRevenue)} in billings and {money(performance.totalMonthlyContribution)} net contribution.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowActiveClientsModal(false)}
                className="p-1.5 rounded hover:bg-black/10 transition-colors text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Subscribers</span>
                  <span className="text-lg font-bold font-mono text-stone-900 mt-0.5 block">{activeClients.length}</span>
                </div>
                <div className="p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold block">Monthly Billings</span>
                  <span className="text-lg font-bold font-mono text-stone-900 mt-0.5 block">{money(performance.totalMonthlySubscriptionRevenue)}</span>
                </div>
                <div className="p-3 rounded bg-white border" style={{ borderColor: C.rule }}>
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">Net Contribution</span>
                  <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">{money(performance.totalMonthlyContribution)}</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded border bg-white" style={{ borderColor: C.rule }}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-[10px] uppercase tracking-wider bg-stone-50" style={{ borderColor: C.rule, color: C.inkMuted }}>
                      <th className="py-2.5 px-3 font-semibold">Client</th>
                      <th className="py-2.5 px-3 font-semibold">Plan</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Fee / Mo</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Spend / Mo</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Contribution</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: C.rule }}>
                    {activeClients.map((client) => {
                      const fee = Number(client.monthlyFee) || 0;
                      let spend = client.avgMonthlySpend;
                      if (spend === undefined || spend === null) {
                        spend = client.costs && client.costs.length > 0
                          ? Math.round(calculateClientEconomics({ costs: client.costs, monthlyFee: fee, periodMonths: 12 }).avgMonthlySpend)
                          : (Number(client.monthlyCost) || 0);
                      }
                      const contrib = client.monthlyContribution !== undefined && client.monthlyContribution !== null
                        ? Number(client.monthlyContribution)
                        : (fee - spend);

                      return (
                        <tr key={client.id} className="hover:bg-black/5 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-stone-900">{client.clientName}</td>
                          <td className="py-2.5 px-3 font-medium text-stone-700">{client.planName}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">{money(fee)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-600">{money(spend)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: contrib >= 0 ? '#15803D' : '#DC2626' }}>
                            {money(contrib)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowActiveClientsModal(false);
                                  setViewingClient(client);
                                }}
                                className="p-1 rounded hover:bg-stone-100 text-stone-600 transition-colors"
                                title="View details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowActiveClientsModal(false);
                                  handleEditActiveClient(client);
                                  if (onNavigateToSubscription) onNavigateToSubscription();
                                }}
                                className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                                title="Edit in 04 SUBSCRIPTION"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteActiveClient(client.id)}
                                className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
                                title="Unassign subscription"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {activeClients.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-gray-500">
                          No active subscriptions assigned yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: C.rule, backgroundColor: C.paperDark }}>
              <div>
                {onNavigateToSubscription && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActiveClientsModal(false);
                      onNavigateToSubscription();
                    }}
                    className="px-3 py-1.5 rounded text-xs font-semibold border bg-stone-900 text-white flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
                  >
                    <span>Manage Full Portfolio (04 SUBSCRIPTION)</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowActiveClientsModal(false)}
                className="px-4 py-1.5 rounded text-xs font-medium border bg-white text-stone-800 hover:bg-stone-50 transition-colors"
                style={{ borderColor: C.rule }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
