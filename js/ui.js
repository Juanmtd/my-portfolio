function initOwnerSelect() {
  const select = document.getElementById('owner-select');

  select.innerHTML = '';

  CONFIG.OWNERS.forEach(owner => {
    const option = document.createElement('option');
    option.value = owner;
    option.textContent = owner;
    select.appendChild(option);
  });

  select.value = STATE.owner;

  select.addEventListener('change', (e) => {
    STATE.owner = e.target.value;
    render();
  });
}

function setActiveNav(view) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
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

function money(value, decimals = 0) {
  const n = toNumber(value);

  return '$' + n.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function percent(value) {
  const n = toNumber(value);
  const v = Math.abs(n) <= 3 ? n * 100 : n;

  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function qty(value) {
  const n = toNumber(value);

  if (n === 0) return '0';
  if (n < 0.00001) return n.toFixed(10);
  if (n < 1) return n.toFixed(4);

  return n.toLocaleString('es-ES', {
    maximumFractionDigits: 4
  });
}

function ownerToKey(owner) {
  return String(owner)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '');
}

function getDashboardOwner(owner) {
  const rows = STATE.data?.dashboard_global || [];
  if (!rows.length) return null;

  const ownerKey = ownerToKey(owner);

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  const metricKey = keys.find(k => k.startsWith('last_update')) || keys[0];

  const result = {
    owner,
    total_value: 0,
    buy_usd: 0,
    sell_usd: 0,
    current_investment: 0,
    net_profit: 0,
    roi_total: 0
  };

  rows.forEach(row => {
    const metric = String(row[metricKey] || '').trim().toLowerCase();
    const value = row[ownerKey];

    if (metric === 'total value') result.total_value = value;
    if (metric === 'buy usd') result.buy_usd = value;
    if (metric === 'sell usd') result.sell_usd = value;
    if (metric === 'current investment') result.current_investment = value;
    if (metric === 'net profit') result.net_profit = value;
    if (metric === 'roi total') result.roi_total = value;
  });

  return result;
}

function getPortfolioRows(owner) {
  const rows = STATE.data?.portfolio_summary || [];

  return rows
    .filter(row => row.owner === owner)
    .sort((a, b) => toNumber(b.current_value) - toNumber(a.current_value));
}

function renderLoading() {
  document.getElementById('app').innerHTML = `
    <div class="loading-screen">
      <div class="loader"></div>
      <p>Loading Wallet 2.0...</p>
    </div>
  `;
}

function renderError() {
  document.getElementById('app').innerHTML = `
    <div style="padding:20px;color:#ff5f7a;">
      ERROR:<br><br>${STATE.error}
    </div>
  `;
}

function renderDashboard() {
  const app = document.getElementById('app');
  const ownerData = getDashboardOwner(STATE.owner);

  if (!ownerData) {
    app.innerHTML = `
      <div style="color:#ff5f7a;">
        No hay datos de dashboard_global para ${STATE.owner}
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <section class="dashboard-grid">
      <div class="metric-card">
        <span>Total Value</span>
        <strong>${money(ownerData.total_value)}</strong>
        <small>valor actual portfolio</small>
      </div>

      <div class="metric-card">
        <span>Net Profit</span>
        <strong class="${toNumber(ownerData.net_profit) >= 0 ? 'positive' : 'negative'}">
          ${money(ownerData.net_profit)}
        </strong>
        <small>ganancia / pérdida neta</small>
      </div>

      <div class="metric-card">
        <span>ROI Total</span>
        <strong class="${toNumber(ownerData.roi_total) >= 0 ? 'positive' : 'negative'}">
          ${percent(ownerData.roi_total)}
        </strong>
        <small>retorno total</small>
      </div>

      <div class="metric-card">
        <span>Buy USD</span>
        <strong>${money(ownerData.buy_usd)}</strong>
        <small>invertido histórico</small>
      </div>

      <div class="metric-card">
        <span>Sell USD</span>
        <strong>${money(ownerData.sell_usd)}</strong>
        <small>vendido histórico</small>
      </div>

      <div class="metric-card">
        <span>Current Investment</span>
        <strong>${money(ownerData.current_investment)}</strong>
        <small>buy - sell</small>
      </div>
    </section>
  `;
}

function renderPortfolio() {
  const app = document.getElementById('app');
  const rows = getPortfolioRows(STATE.owner);

  if (!rows.length) {
    app.innerHTML = `
      <div style="color:#ff5f7a;">
        No hay holdings para ${STATE.owner}
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <section class="table-card">
      <div class="section-header">
        <h2>Portfolio</h2>
        <span>${STATE.owner}</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th class="num">Qty</th>
              <th class="num">Price</th>
              <th class="num">Value</th>
              <th class="num">Net Profit</th>
              <th class="num">ROI</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>
                  <strong>${row.symbol}</strong>
                </td>
                <td class="num">${qty(row.total_qty)}</td>
                <td class="num">${money(row.current_price, 2)}</td>
                <td class="num">${money(row.current_value, 2)}</td>
                <td class="num ${toNumber(row.net_profit) >= 0 ? 'positive' : 'negative'}">
                  ${money(row.net_profit, 2)}
                </td>
                <td class="num ${toNumber(row.roi_total) >= 0 ? 'positive' : 'negative'}">
                  ${percent(row.roi_total)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPlaceholder(title) {
  document.getElementById('app').innerHTML = `
    <div style="color:white;font-size:18px;font-weight:600;">
      ${title} coming next step
    </div>
  `;
}

function render() {
  if (STATE.loading) {
    renderLoading();
    return;
  }

  if (STATE.error) {
    renderError();
    return;
  }

  if (!STATE.data) {
    renderLoading();
    return;
  }

  switch (STATE.view) {
    case 'dashboard':
      renderDashboard();
      break;

    case 'portfolio':
      renderPortfolio();
      break;

    case 'performance':
      renderPlaceholder('Performance');
      break;

    case 'global':
      renderPlaceholder('Global');
      break;

    case 'prices':
      renderPlaceholder('Prices');
      break;

    default:
      renderDashboard();
  }
}
