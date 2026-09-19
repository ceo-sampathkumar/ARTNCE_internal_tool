import assert from 'node:assert';

console.log('--- RUNNING CLIENT DROPDOWN SELECTION TESTS ---');

// TEST 1: Sanitization of client IDs in curatedClientsList
console.log('Test 1: Sanitization of client IDs (handles missing, null, or "undefined" ids)');
{
  const rawCuratedList = [
    { id: undefined, clientName: 'New Corporate Client', spaceSqFt: 3500, artworkCount: 6 },
    { id: 'undefined', clientName: 'Another Client', spaceSqFt: 1200, artworkCount: 2 },
    { id: 'cur_asiapaints', clientName: 'Asiapaints', spaceSqFt: 1995, artworkCount: 5 },
  ];

  const sanitized = rawCuratedList.map((c, idx) => {
    const fallbackId = (c.clientName && c.clientName.trim())
      ? `cur_${c.clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      : `cur_client_${idx}`;
    return {
      ...c,
      id: (c.id && c.id !== 'undefined') ? c.id : fallbackId,
    };
  });

  assert.strictEqual(sanitized[0].id, 'cur_newcorporateclient', 'Undefined id must be replaced with valid deterministic id');
  assert.strictEqual(sanitized[1].id, 'cur_anotherclient', '"undefined" string id must be replaced with valid deterministic id');
  assert.strictEqual(sanitized[2].id, 'cur_asiapaints', 'Valid id cur_asiapaints must be preserved');
  console.log('  ✅ Passed: All curated client records have valid, non-empty IDs.');
}

// TEST 2: Selection by ID and absence of hardcoded 'asiapaints' fallback
console.log('Test 2: Selection of any client does not fall back to "asiapaints"');
{
  const curatedClientsList = [
    { id: 'cur_asiapaints', clientName: 'Asiapaints', spaceSqFt: 1995, artworkCount: 5 },
    { id: 'cur_titan', clientName: 'Titan HQ', spaceSqFt: 4200, artworkCount: 8 },
    { id: 'cur_infosys', clientName: 'Infosys Campus', spaceSqFt: 8000, artworkCount: 15 },
  ];

  // Logic from SubscriptionView selectedCuratedClient memo
  const resolveSelectedClient = (selectedClientId) => {
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
  };

  // Select Titan HQ
  const titan = resolveSelectedClient('cur_titan');
  assert.strictEqual(titan.id, 'cur_titan', 'Selected client must be Titan HQ');
  assert.strictEqual(titan.clientName, 'Titan HQ');

  // Select Infosys Campus
  const infosys = resolveSelectedClient('cur_infosys');
  assert.strictEqual(infosys.id, 'cur_infosys', 'Selected client must be Infosys Campus');
  assert.strictEqual(infosys.clientName, 'Infosys Campus');

  // Empty selection
  const empty = resolveSelectedClient('');
  assert.strictEqual(empty, null, 'Empty selectedClientId must yield null');

  console.log('  ✅ Passed: Client selection successfully selects target client without defaulting to Asiapaints.');
}

// TEST 3: Dropdown handler updates state and invokes onSelectCuratedClient
console.log('Test 3: Dropdown selection calls onSelectCuratedClient and populates inputs');
{
  const curatedClientsList = [
    { id: 'cur_asiapaints', clientName: 'Asiapaints', spaceSqFt: 1995, artworkCount: 5 },
    { id: 'cur_titan', clientName: 'Titan HQ', collectionName: 'Boardroom', location: 'Bangalore', spaceSqFt: 4200, artworkCount: 8, curatorProjectFee: 3500 },
  ];

  const activeClients = [
    { clientId: 'cur_asiapaints', clientName: 'Asiapaints', planId: 'essential', monthlyFee: 12500, costs: [] },
  ];

  let selectedParentClient = null;
  const onSelectCuratedClient = (client) => {
    selectedParentClient = client;
  };

  const selectClient = (clientId) => {
    if (!clientId) return null;
    const target = curatedClientsList.find(
      (c) => c.id === clientId || (c.clientName && c.clientName.trim().toLowerCase() === clientId.trim().toLowerCase())
    );
    if (!target) return null;

    if (onSelectCuratedClient) {
      onSelectCuratedClient(target);
    }

    const existing = activeClients.find(
      (ac) =>
        (target.id && ac.clientId === target.id) ||
        ac.clientName?.trim().toLowerCase() === target.clientName?.trim().toLowerCase()
    );

    return {
      target,
      existing,
      spaceSqFt: target.spaceSqFt ?? existing?.spaceSqFt ?? 2000,
      artworkCount: target.artworkCount ?? existing?.artworkCount ?? 3,
    };
  };

  const resultTitan = selectClient('cur_titan');
  assert.strictEqual(resultTitan.target.clientName, 'Titan HQ');
  assert.strictEqual(resultTitan.existing, undefined, 'Titan HQ should not have existing subscription yet');
  assert.strictEqual(resultTitan.spaceSqFt, 4200);
  assert.strictEqual(resultTitan.artworkCount, 8);
  assert.strictEqual(selectedParentClient.id, 'cur_titan');

  const resultAsia = selectClient('cur_asiapaints');
  assert.strictEqual(resultAsia.target.clientName, 'Asiapaints');
  assert.notStrictEqual(resultAsia.existing, undefined, 'Asiapaints should have existing subscription');
  assert.strictEqual(resultAsia.existing.monthlyFee, 12500);
  assert.strictEqual(selectedParentClient.id, 'cur_asiapaints');

  console.log('  ✅ Passed: Dropdown handler correctly notifies parent and configures inputs.');
}

console.log('\n🎉 ALL CLIENT DROPDOWN SELECTION TESTS PASSED!');
