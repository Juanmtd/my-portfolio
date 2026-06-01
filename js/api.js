const CACHE_KEY = 'wallet2_cache_v1';
const CACHE_TIME_KEY = 'wallet2_cache_time_v1';

const CACHE_DURATION_MS = 60 * 1000; // 60 segundos

async function loadData(forceRefresh = false) {
  try {
    const hasExistingData = !!STATE.data;

    STATE.error = null;

    if (!hasExistingData) {
      STATE.loading = true;
      render();
    }

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    const cacheStillValid =
      cachedData &&
      cachedTime &&
      (Date.now() - Number(cachedTime)) < CACHE_DURATION_MS;

    if (!forceRefresh && cacheStillValid) {
      STATE.data = JSON.parse(cachedData);
      STATE.loading = false;
      console.log('Loaded from cache');
      render();
      return;
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
    }

    const response = await fetch(
      `${CONFIG.API_URL}?token=${CONFIG.TOKEN}&t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'API Error');

    localStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

    STATE.data = json.data;
    STATE.loading = false;

    console.log('Loaded from API');
    render();

  } catch (err) {
    STATE.loading = false;
    STATE.error = err.message;
    render();

  } finally {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh';
    }
  }
}

// =========================
// LOCAL DATA HELPERS
// =========================

function getDataTable(tableName) {
  return STATE.data?.[tableName] || [];
}

function getAssetTransactions(owner, symbol) {
  return getDataTable('transactions')
    .filter(row => row.owner === owner && row.symbol === symbol)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getAssetWalletRows(owner, symbol) {
  // Leer desde wallet_summary: una fila por owner+wallet+symbol
  const rows = getDataTable('wallet_summary')
    .filter(row =>
      row.owner === owner &&
      row.symbol === symbol &&
      toNumber(row.qty) !== 0
    )
    .sort((a, b) => toNumber(b.current_value) - toNumber(a.current_value));

  // Enriquecer con wallet_type desde wallet_registry
  const registry = getDataTable('wallet_registry');

  return rows.map(row => {
    const reg = registry.find(r =>
      r.wallet_name === row.wallet && r.owner === owner
    );
    return {
      ...row,
      wallet_type: reg ? reg.wallet_type : '',
      platform: reg ? reg.platform : ''
    };
  });
}

function getAssetPriceHistory(symbol) {
  return getDataTable('price_history')
    .filter(row => row.symbol === symbol)
    .sort((a, b) =>
      new Date(a.snapshot_date || a.date || a.last_update) -
      new Date(b.snapshot_date || b.date || b.last_update)
    );
}

function getAssetDeepData(owner, symbol) {
  const portfolioRow = getDataTable('portfolio_summary')
    .find(row => row.owner === owner && row.symbol === symbol);

  const transactions = getAssetTransactions(owner, symbol);
  const wallets = getAssetWalletRows(owner, symbol);
  const priceHistory = getAssetPriceHistory(symbol);

  return { owner, symbol, portfolioRow, transactions, wallets, priceHistory };
}

// =========================
// AUTH SILENT LOAD
// =========================

async function loadDataForAuth() {
  if (STATE.data) return;

  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  const cacheStillValid =
    cachedData &&
    cachedTime &&
    (Date.now() - Number(cachedTime)) < 60 * 1000;

  if (cacheStillValid) {
    STATE.data = JSON.parse(cachedData);
    return;
  }

  const response = await fetch(
    `${CONFIG.API_URL}?token=${CONFIG.TOKEN}&t=${Date.now()}`,
    { cache: 'no-store' }
  );

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const json = await response.json();
  if (!json.success) throw new Error(json.error || 'API Error');

  localStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
  localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

  STATE.data = json.data;
}
