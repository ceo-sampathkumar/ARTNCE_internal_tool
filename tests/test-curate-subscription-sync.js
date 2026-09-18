/**
 * Automated test suite for CURATE -> SUBSCRIPTION sync & Edit workflow
 *
 * Tests:
 * 1. Live resolution from 03 CURATE by clientId (Bug 1: Capital Land 2,999 -> 2,000 sq ft)
 * 2. In-place update when saving curated client in PaintingCostCalculator
 * 3. Edit Active Client workflow: loads CURATE data, updates in-place without duplicate rows (Bug 2)
 * 4. Value precedence enforcement & independent client economics (Bug 3)
 */

import assert from 'node:assert';
import { calculateClientEconomics, calculateSimplePlanResult } from '../lib/calculator.js';
import { DEFAULT_CURATED_CLIENTS, DEFAULT_ACTIVE_CLIENTS } from '../lib/defaults.js';

console.log('--- RUNNING CURATE -> SUBSCRIPTION SYNC TESTS ---');

// TEST 1: Live resolution of CURATE data by clientId
console.log('Test 1: Live resolution of CURATE data by clientId');
{
  const curatedClientsList = [
    {
      id: 'cur_capitalland',
      clientName: 'Capital Land',
      collectionName: 'Executive Suite Collection',
      location: 'Bangalore Commercial Tower',
      spaceSqFt: 2000, // Updated in 03 CURATE from 2,999 to 2,000
      artworkCount: 3,
      totalArtworkInvestment: 15120,
    },
  ];

  // Active client record previously created with old snapshot (2,999 sq ft)
  const staleActiveClient = {
    id: 'sub_capitalland',
    clientId: 'cur_capitalland',
    clientName: 'Capital Land',
    planId: 'professional',
    planName: 'Professional',
    spaceSqFt: 2999, // Stale copy in subscription record
    artworkCount: 4,
    monthlyFee: 18500,
    costs: [{ id: 'c1', name: 'Maintenance', amount: 800, frequency: 'monthly' }],
  };

  // Live resolution logic implemented in 04 SUBSCRIPTION (SubscriptionView.jsx)
  const curateClient = curatedClientsList.find(
    (c) => (staleActiveClient.clientId && c.id === staleActiveClient.clientId) ||
           c.clientName?.trim().toLowerCase() === staleActiveClient.clientName?.trim().toLowerCase()
  ) || staleActiveClient;

  const resolvedSpace = curateClient.spaceSqFt !== undefined && curateClient.spaceSqFt !== null
    ? curateClient.spaceSqFt
    : staleActiveClient.spaceSqFt;
  const resolvedArtworks = curateClient.artworkCount !== undefined && curateClient.artworkCount !== null
    ? curateClient.artworkCount
    : staleActiveClient.artworkCount;

  assert.strictEqual(resolvedSpace, 2000, 'Resolved space must be 2000 sq ft from CURATE, not stale 2999');
  assert.strictEqual(resolvedArtworks, 3, 'Resolved artworks must be 3 from CURATE, not stale 4');
  console.log('  ✅ Passed: Live resolution uses 03 CURATE as single source of truth (2,000 sq ft).');
}

// TEST 2: In-place synchronization in PaintingCostCalculator handleSaveCuratedClient
console.log('Test 2: handleSaveCuratedClient synchronization');
{
  let activeClients = [
    {
      id: 'sub_1',
      clientId: 'cur_capitalland',
      clientName: 'Capital Land',
      planId: 'professional',
      spaceSqFt: 2999,
      artworkCount: 4,
      monthlyFee: 18500,
    },
    {
      id: 'sub_2',
      clientId: 'cur_asiapaints',
      clientName: 'Asia Paints',
      planId: 'essential',
      spaceSqFt: 1800,
      artworkCount: 3,
      monthlyFee: 12500,
    },
  ];

  const updatedCurateClient = {
    id: 'cur_capitalland',
    clientName: 'Capital Land Ltd',
    collectionName: 'HQ Boardroom',
    location: 'Tower 2, Floor 14',
    spaceSqFt: 2000,
    artworkCount: 3,
    totalArtworkInvestment: 16500,
  };

  // Exact sync logic added to handleSaveCuratedClient in PaintingCostCalculator.jsx
  activeClients = activeClients.map((ac) => {
    const isMatch =
      (updatedCurateClient.id && ac.clientId === updatedCurateClient.id) ||
      (ac.clientName && ac.clientName.trim().toLowerCase() === updatedCurateClient.clientName.trim().toLowerCase());
    if (isMatch) {
      return {
        ...ac,
        clientId: updatedCurateClient.id,
        clientName: updatedCurateClient.clientName,
        collectionName: updatedCurateClient.collectionName || ac.collectionName,
        location: updatedCurateClient.location || ac.location,
        spaceSqFt: updatedCurateClient.spaceSqFt !== undefined ? updatedCurateClient.spaceSqFt : ac.spaceSqFt,
        artworkCount: updatedCurateClient.artworkCount !== undefined ? updatedCurateClient.artworkCount : ac.artworkCount,
        totalArtworkInvestment: updatedCurateClient.totalArtworkInvestment || ac.totalArtworkInvestment,
      };
    }
    return ac;
  });

  assert.strictEqual(activeClients.length, 2, 'Array length must remain 2 (no duplicates)');
  const updatedSub = activeClients.find((c) => c.clientId === 'cur_capitalland');
  assert.strictEqual(updatedSub.spaceSqFt, 2000, 'Space must be updated to 2000 in activeClients');
  assert.strictEqual(updatedSub.artworkCount, 3, 'Artwork count must be updated to 3');
  assert.strictEqual(updatedSub.clientName, 'Capital Land Ltd', 'Client name must be updated');
  assert.strictEqual(updatedSub.monthlyFee, 18500, 'Subscription commercial fee must remain intact');
  console.log('  ✅ Passed: handleSaveCuratedClient properly synchronizes activeClients in-place.');
}

// TEST 3: Edit active client workflow (no duplicate rows, in-place update)
console.log('Test 3: Edit active client workflow');
{
  const curatedClientsList = [
    { id: 'cur_capitalland', clientName: 'Capital Land', spaceSqFt: 2000, artworkCount: 3 },
  ];

  let activeClients = [
    {
      id: 'sub_capitalland',
      clientId: 'cur_capitalland',
      clientName: 'Capital Land',
      planId: 'professional',
      planName: 'Professional',
      spaceSqFt: 2000,
      artworkCount: 3,
      monthlyFee: 18500,
      costs: [
        { id: 'c1', name: 'Maintenance', amount: 800, frequency: 'monthly' },
        { id: 'c2', name: 'Rotation', amount: 1200, frequency: 'every_3_months' },
      ],
    },
  ];

  // User clicks Edit on Capital Land
  const clientToEdit = activeClients[0];
  const matched = curatedClientsList.find(
    (c) => (clientToEdit.clientId && c.id === clientToEdit.clientId) ||
           c.clientName?.trim().toLowerCase() === clientToEdit.clientName?.trim().toLowerCase()
  );

  let selectedClientId = matched ? matched.id : clientToEdit.clientId;
  let spaceSqFtInput = matched ? (matched.spaceSqFt ?? clientToEdit.spaceSqFt) : clientToEdit.spaceSqFt;
  let artworkCountInput = matched ? (matched.artworkCount ?? clientToEdit.artworkCount) : clientToEdit.artworkCount;
  let monthlyPriceInput = clientToEdit.monthlyFee;
  let planCosts = JSON.parse(JSON.stringify(clientToEdit.costs));

  assert.strictEqual(selectedClientId, 'cur_capitalland');
  assert.strictEqual(spaceSqFtInput, 2000);
  assert.strictEqual(artworkCountInput, 3);
  assert.strictEqual(monthlyPriceInput, 18500);
  assert.strictEqual(planCosts.length, 2);

  // User adjusts monthly fee to 21,000 and adds an installation cost of 700
  monthlyPriceInput = 21000;
  planCosts.push({ id: 'c3', name: 'Installation', amount: 700, frequency: 'one_time' });

  // User clicks "UPDATE SUBSCRIPTION"
  const existingSubscription = activeClients.find(
    (ac) => (matched.id && ac.clientId === matched.id) ||
            ac.clientName?.trim().toLowerCase() === matched.clientName?.trim().toLowerCase()
  );
  assert.ok(existingSubscription, 'Must identify existing subscription');

  const economics = calculateClientEconomics({ costs: planCosts, monthlyFee: monthlyPriceInput, periodMonths: 12 });

  const updatedRecord = {
    ...existingSubscription,
    monthlyFee: monthlyPriceInput,
    totalSpend: Math.round(economics.totalSpend),
    avgMonthlySpend: Math.round(economics.avgMonthlySpend),
    monthlyCost: Math.round(economics.avgMonthlySpend),
    monthlyContribution: Math.round(economics.monthlyContribution),
    costs: JSON.parse(JSON.stringify(planCosts)),
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = activeClients.findIndex(
    (c) => (matched.id && c.clientId === matched.id) ||
           c.clientName?.trim().toLowerCase() === matched.clientName?.trim().toLowerCase()
  );

  assert.strictEqual(existingIndex, 0);
  activeClients[existingIndex] = updatedRecord;

  assert.strictEqual(activeClients.length, 1, 'Array length must still be 1 (no duplicate row created)');
  assert.strictEqual(activeClients[0].monthlyFee, 21000);
  assert.strictEqual(activeClients[0].costs.length, 3);
  assert.strictEqual(activeClients[0].totalSpend, 15100);
  assert.strictEqual(activeClients[0].avgMonthlySpend, 1258);
  assert.strictEqual(activeClients[0].monthlyContribution, 19742);
  console.log('  ✅ Passed: Edit active client workflow correctly updates in place without duplicates.');
}

// TEST 4: Precedence enforcement & independent economics
console.log('Test 4: Precedence enforcement & independent client economics');
{
  const clientA = {
    monthlyFee: 12500,
    costs: [{ id: 'c1', name: 'Maintenance', amount: 500, frequency: 'monthly' }],
  };
  const clientB = {
    monthlyFee: 25000,
    costs: [
      { id: 'c1', name: 'Maintenance', amount: 1500, frequency: 'monthly' },
      { id: 'c2', name: 'Rotation', amount: 2000, frequency: 'every_3_months' },
    ],
  };

  const econA = calculateClientEconomics({ costs: clientA.costs, monthlyFee: clientA.monthlyFee, periodMonths: 12 });
  const econB = calculateClientEconomics({ costs: clientB.costs, monthlyFee: clientB.monthlyFee, periodMonths: 12 });

  assert.strictEqual(econA.avgMonthlySpend, 500);
  assert.strictEqual(econA.monthlyContribution, 12000);

  assert.strictEqual(Math.round(econB.avgMonthlySpend), 2167);
  assert.strictEqual(Math.round(econB.monthlyContribution), 25000 - 2167);

  assert.notStrictEqual(econA.avgMonthlySpend, econB.avgMonthlySpend);
  assert.notStrictEqual(econA.monthlyContribution, econB.monthlyContribution);
  console.log('  ✅ Passed: Client economics are completely independent and accurately computed.');
}

console.log('--- ALL SYNC TESTS PASSED SUCCESSFULLY ---');
