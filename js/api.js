async function fetchWalletData() {
  const url = `${CONFIG.API_URL}?token=${encodeURIComponent(CONFIG.API_TOKEN)}&t=${Date.now()}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'Respuesta inválida de la API');
  }

  if (!json.data) {
    throw new Error('La API no devolvió data');
  }

  return normalizeApiData(json);
}

function normalizeApiData(json) {
  return {
    version: json.version,
    timestamp: json.timestamp,
    dashboardGlobal: parseDashboardGlobal(json.data.dashboard_global || []),
    portfolioSummary: json.data.portfolio_summary || [],
    walletPrices: json.data.wallet_prices || [],
    portfolioHistory: json.data.portfolio_history || []
  };
}

function parseDashboardGlobal(rows) {
  if (!rows.length) return [];

  const firstRow = rows[0];
  const ownerNames = Object.keys(firstRow).filter(key => key !== 'last_update');

  const metrics = {};

  rows.forEach(row => {
    const metricName = normalizeMetricName(row.last_update);
    if (!metricName) return;

    ownerNames.forEach(owner => {
      if (!metrics[owner]) {
        metrics[owner] = { owner };
      }

      metrics[owner][metricName] = toNumber(row[owner]);
    });
  });

  return Object.values(metrics);
}

function normalizeMetricName(value) {
  const raw = String(value || '').trim().toLowerCase();

  const map = {
    'total value': 'totalValue',
    'buy usd': 'buyUsd',
    'sell usd': 'sellUsd',
    'current investment': 'currentInvestment',
    'net profit': 'netProfit',
    'roi total': 'roiTotal'
  };

  return map[raw] || null;
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;

  if (typeof value === 'number') return value;

  let text = String(value)
    .replace(/\$/g, '')
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .trim();

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else {
    text = text.replace(',', '.');
  }

  return Number(text) || 0;
}
