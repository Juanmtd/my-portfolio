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

    // =========================
    // CACHE
    // =========================

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

    // =========================
    // REFRESH BUTTON STATE
    // =========================

    const refreshBtn = document.getElementById('refresh-btn');

    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
    }

    // =========================
    // API FETCH
    // =========================

    const response = await fetch(
      `${CONFIG.API_URL}?token=${CONFIG.TOKEN}&t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'API Error');
    }

    // =========================
    // SAVE CACHE
    // =========================

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(json.data)
    );

    localStorage.setItem(
      CACHE_TIME_KEY,
      Date.now().toString()
    );

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
    .filter(row =>
      row.owner === owner &&
      row.symbol === symbol
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getAssetWalletRows(owner, symbol) {
  // Leer desde wallet_xxx (pestaña individual del owner)
  const key = 'wallet_' + ownerToKey(owner);
  const rows = getDataTable(key);

  const row = rows.find(r => String(r.symbol || '').trim().toUpperCase() === String(symbol).trim().toUpperCase());

  if (!row || !row.wallets) return [];

  // wallets y wallet_types son strings separados por coma
  const walletNames = String(row.wallets).split(',').map(s => s.trim()).filter(Boolean);
  const walletTypes = String(row.wallet_types || '').split(',').map(s => s.trim());

  return walletNames.map((name, i) => ({
    wallet: name,
    type: walletTypes[i] || '',
    symbol: symbol,
    total_qty: row.total_qty,
    current_value: row.current_value
  }));
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
    .find(row =>
      row.owner === owner &&
      row.symbol === symbol
    );

  const transactions = getAssetTransactions(owner, symbol);
  const wallets = getAssetWalletRows(owner, symbol);
  const priceHistory = getAssetPriceHistory(symbol);

  return {
    owner,
    symbol,
    portfolioRow,
    transactions,
    wallets,
    priceHistory
  };
}
