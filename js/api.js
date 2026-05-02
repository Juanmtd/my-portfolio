async function loadData() {
  try {
    STATE.loading = true;
    STATE.error = null;

    render();

    const response = await fetch(
      `${CONFIG.API_URL}?token=${CONFIG.TOKEN}&t=${Date.now()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'Unknown API error');
    }

    STATE.data = normalizeData(json.data);

    STATE.loading = false;

    render();

  } catch (err) {

    STATE.loading = false;
    STATE.error = err.message;

    render();
  }
}

function normalizeData(data) {

  return {
    dashboard_global: normalizeSheet(data.dashboard_global || []),
    portfolio_summary: normalizeSheet(data.portfolio_summary || []),
    wallet_prices: normalizeSheet(data.wallet_prices || []),
    portfolio_history: normalizeSheet(data.portfolio_history || [])
  };
}

function normalizeSheet(rows) {

  if (!rows.length) return [];

  const headers = rows[0];

  return rows.slice(1).map(row => {

    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = row[index];
    });

    return obj;
  });
}
