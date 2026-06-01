// =========================
// TX COLOR HELPER
// =========================

function getTxClass(type) {
  if (['STAKING_REWARD', 'AIRDROP'].includes(type)) return 'tx-reward';
  if (['BUY', 'TRANSFER_IN'].includes(type)) return 'tx-in';
  return 'tx-out';
}

// =========================
// HELPERS
// =========================

function initOwnerSelect() {
  const select = document.getElementById('owner-select');
  if (!select) return;
  select.innerHTML = '';

  const canView = STATE.auth?.canView || CONFIG.OWNERS;
  canView.forEach(owner => {
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
  let text = String(value).replace(/\$/g, '').replace(/€/g, '').replace(/\s/g, '').trim();
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

function roiBadge(value) {
  const n = toNumber(value);
  return `<span class="roi-badge ${n >= 0 ? 'positive' : 'negative'}">${percent(value)}</span>`;
}

function allocationPercent(value) {
  const safe = Math.max(0, Math.min(100, value));
  return `<div class="allocation-wrap"><span class="allocation-percent">${safe.toFixed(1)}%</span></div>`;
}

function qty(value) {
  const n = toNumber(value);
  if (n === 0) return '0';
  if (n < 0.00001) return n.toFixed(10);
  if (n < 1) return n.toFixed(4);
  return n.toLocaleString('es-ES', { maximumFractionDigits: 4 });
}

function cleanDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '—';
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function ownerToKey(owner) {
  return String(owner).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
}

// =========================
// DATA HELPERS
// =========================

function getDashboardOwner(owner) {
  const rows = STATE.data?.dashboard_global || [];
  if (!rows.length) return null;

  const ownerKey = ownerToKey(owner);
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const metricKey = keys.find(k => k.startsWith('last_update')) || keys[0];

  const result = { owner, total_value: 0, buy_usd: 0, sell_usd: 0, current_investment: 0, net_profit: 0, roi_total: 0 };

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

function getAllDashboardOwners() {
  const canView = STATE.auth?.canView || [];
  const ownersToShow = canView.length > 0 ? canView : CONFIG.OWNERS;
  return ownersToShow
    .map(owner => getDashboardOwner(owner))
    .filter(row => row && toNumber(row.total_value) > 0)
    .sort((a, b) => toNumber(b.total_value) - toNumber(a.total_value));
}

function getPortfolioRows(owner) {
  return (STATE.data?.portfolio_summary || [])
    .filter(row => row.owner === owner)
    .sort((a, b) => toNumber(b.current_value) - toNumber(a.current_value));
}

function getPerformanceRows(owner) {
  return (STATE.data?.portfolio_history || [])
    .filter(row => row.owner === owner)
    .sort((a, b) => new Date(a.snapshot_date) - new Date(b.snapshot_date));
}

function getPriceRows() {
  return (STATE.data?.wallet_prices || [])
    .filter(row => row.symbol)
    .sort((a, b) => String(a.symbol).localeCompare(String(b.symbol)));
}

// =========================
// MODAL — WALLETS & TXS
// =========================

function renderAssetWallets(wallets, totalQty) {
  if (!wallets || !wallets.length) {
    return `<div class="asset-empty">No wallet breakdown available.</div>`;
  }

  return `
    <div class="asset-mini-table asset-mini-scroll">
      ${wallets.map(row => {
        const q = toNumber(row.qty);
        const pct = totalQty > 0 ? (q / totalQty) * 100 : 0;
        return `
          <div class="asset-mini-row">
            <div>
              <strong>${row.wallet || 'Wallet'}</strong>
              <span>${row.wallet_type || row.type || ''}</span>
            </div>
            <div style="text-align:right;">
              <div class="num" style="font-size:13px;">${qty(q)}</div>
              <div style="font-size:11px;color:var(--muted);">${pct.toFixed(1)}%</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderAssetTransactions(transactions) {
  if (!transactions || !transactions.length) {
    return `<div class="asset-empty">No transactions available.</div>`;
  }

  return `
    <div class="asset-mini-table asset-mini-scroll">
      ${transactions.slice(0, 20).map(row => {
        const txClass = getTxClass(row.type);
        return `
          <div class="asset-mini-row">
            <div>
              <strong><span class="tx-type ${txClass}">${row.type || 'TX'}</span></strong>
              <span>${cleanDate(row.date)} · ${row.wallet || ''}</span>
            </div>
            <div class="num">${qty(row.qty)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openAssetModal(row, allocation) {
  closeAssetModal();

  const deepData = getAssetDeepData ? getAssetDeepData(STATE.owner, row.symbol) : null;
  const wallets = deepData?.wallets || [];
  const transactions = deepData?.transactions || [];
  const totalQty = toNumber(row.total_qty);

  const modal = document.createElement('div');
  modal.className = 'asset-detail-overlay';
  modal.id = 'asset-modal';

  modal.innerHTML = `
    <div class="asset-detail-card asset-detail-card-wide">
      <div class="asset-detail-header">
        <div class="asset-detail-title">
          <small>Asset Detail</small>
          <h2>${row.symbol}</h2>
        </div>
        <button class="asset-close" onclick="closeAssetModal()">×</button>
      </div>

      <div class="asset-detail-grid">
        <div class="asset-detail-item">
          <span>Qty</span>
          <strong>${qty(row.total_qty)}</strong>
        </div>
        <div class="asset-detail-item">
          <span>Price</span>
          <strong>${money(row.current_price, 2)}</strong>
        </div>
        <div class="asset-detail-item">
          <span>Avg Net Cost</span>
          <strong>${toNumber(row.avg_net_cost) !== 0 ? money(row.avg_net_cost, 2) : '—'}</strong>
        </div>
        <div class="asset-detail-item">
          <span>Value</span>
          <strong>${money(row.current_value, 2)}</strong>
        </div>
        <div class="asset-detail-item">
          <span>Net Profit</span>
          <strong class="${toNumber(row.net_profit) >= 0 ? 'positive' : 'negative'}">${money(row.net_profit, 2)}</strong>
        </div>
        <div class="asset-detail-item">
          <span>ROI</span>
          <strong class="${toNumber(row.roi_total) >= 0 ? 'positive' : 'negative'}">${percent(row.roi_total)}</strong>
        </div>
        <div class="asset-detail-item">
          <span>Allocation</span>
          <strong>${allocation.toFixed(1)}%</strong>
        </div>
        <div class="asset-detail-item">
          <span>Buy USD</span>
          <strong>${money(row.buy_usd, 2)}</strong>
        </div>
      </div>

      <div class="asset-extra-section">
        <div class="asset-extra-card">
          <div class="asset-extra-header">
            <h3>Wallets</h3>
            <span>${wallets.length}</span>
          </div>
          ${renderAssetWallets(wallets, totalQty)}
        </div>
        <div class="asset-extra-card">
          <div class="asset-extra-header">
            <h3>Last Transactions</h3>
            <span>${transactions.length}</span>
          </div>
          ${renderAssetTransactions(transactions)}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'asset-modal') closeAssetModal();
  });
}

function closeAssetModal() {
  const modal = document.getElementById('asset-modal');
  if (modal) modal.remove();
}

function bindAssetRows(rows, totalValue) {
  document.querySelectorAll('.clickable-row').forEach(rowEl => {
    rowEl.addEventListener('click', () => {
      const symbol = rowEl.dataset.symbol;
      const asset = rows.find(row => row.symbol === symbol);
      if (!asset) return;
      const allocation = totalValue > 0 ? (toNumber(asset.current_value) / totalValue) * 100 : 0;
      openAssetModal(asset, allocation);
    });
  });
}

// =========================
// SORTABLE TABLE
// =========================

let sortState = { col: null, dir: 1 };

function makeSortable(tableId, rows, renderFn) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.querySelectorAll('th[data-sort]').forEach(th => {
    th.style.cursor = 'pointer';
    th.style.userSelect = 'none';
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortState.col === col) {
        sortState.dir *= -1;
      } else {
        sortState.col = col;
        sortState.dir = -1;
      }
      const sorted = [...rows].sort((a, b) => {
        const av = toNumber(a[col]) || String(a[col] || '');
        const bv = toNumber(b[col]) || String(b[col] || '');
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortState.dir;
        return String(av).localeCompare(String(bv)) * sortState.dir;
      });
      renderFn(sorted);
    });
  });
}

// =========================
// LOADING / ERROR
// =========================

function renderLoading() {
  document.getElementById('app').innerHTML = `
    <section class="dashboard-grid">
      ${[1,2,3,4,5,6].map(() => `<div class="metric-card skeleton-card"></div>`).join('')}
    </section>
    <section class="table-card skeleton-table" style="margin-top:16px;">
      <div class="skeleton-line skeleton-title"></div>
      ${[1,2,3,4].map(() => `<div class="skeleton-line"></div>`).join('')}
    </section>
  `;
}

function renderError() {
  document.getElementById('app').innerHTML = `
    <div style="padding:20px;color:#ff5f7a;">ERROR:<br><br>${STATE.error}</div>
  `;
}

function renderLogin() {
  const appShell = document.querySelector('.app-shell');
  if (appShell) appShell.style.display = 'none';
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.style.display = 'flex';

  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin
    });
    const btn = document.querySelector('.g_id_signin');
    if (btn) {
      google.accounts.id.renderButton(btn, { theme: 'filled_black', size: 'large', width: 280 });
    }
  }
}

// =========================
// GLOBAL NAV VISIBILITY
// =========================

function updateGlobalNavVisibility() {
  const globalBtn = document.querySelector('.nav-btn[data-view="global"]');
  if (!globalBtn) return;
  const canView = STATE.auth?.canView || [];
  if (canView.length <= 1) {
    globalBtn.style.display = 'none';
    if (STATE.view === 'global') {
      STATE.view = 'dashboard';
      setActiveNav('dashboard');
    }
  } else {
    globalBtn.style.display = '';
  }
}

// =========================
// USER AVATAR
// =========================

function updateUserAvatar() {
  const user = STATE.auth?.user;
  if (!user) return;
  const img = document.getElementById('user-avatar');
  if (img && user.picture) {
    img.src = user.picture;
    img.style.display = 'block';
    img.title = user.name || user.email;
  }
}

// =========================
// DASHBOARD
// =========================

function renderDashboard() {
  const app = document.getElementById('app');
  const ownerData = getDashboardOwner(STATE.owner);

  if (!ownerData) {
    app.innerHTML = `<div style="color:#ff5f7a;">No hay datos para ${STATE.owner}</div>`;
    return;
  }

  const perfRows = getPerformanceRows(STATE.owner);
  const investmentLine = perfRows.length ? toNumber(perfRows[perfRows.length - 1].current_investment) : 0;

  app.innerHTML = `
    <section class="dashboard-grid">
      <div class="metric-card"><span>Total Value</span><strong>${money(ownerData.total_value)}</strong><small>valor actual portfolio</small></div>
      <div class="metric-card"><span>Net Profit</span><strong class="${toNumber(ownerData.net_profit) >= 0 ? 'positive' : 'negative'}">${money(ownerData.net_profit)}</strong><small>ganancia / pérdida neta</small></div>
      <div class="metric-card"><span>ROI Total</span><strong class="${toNumber(ownerData.roi_total) >= 0 ? 'positive' : 'negative'}">${percent(ownerData.roi_total)}</strong><small>retorno total</small></div>
      <div class="metric-card"><span>Buy USD</span><strong>${money(ownerData.buy_usd)}</strong><small>invertido histórico</small></div>
      <div class="metric-card"><span>Sell USD</span><strong>${money(ownerData.sell_usd)}</strong><small>vendido histórico</small></div>
      <div class="metric-card"><span>Current Investment</span><strong>${money(ownerData.current_investment)}</strong><small>buy - sell</small></div>
    </section>
    <section class="table-card" style="margin-top:16px;">
      <div class="section-header"><h2>Portfolio Evolution</h2><span>${STATE.owner}</span></div>
      <div style="height:320px;"><canvas id="portfolio-history-chart"></canvas></div>
    </section>
  `;

  renderPortfolioHistoryChart('portfolio-history-chart', perfRows, investmentLine);
  updateUserAvatar();
}

// =========================
// PORTFOLIO
// =========================

function renderPortfolioTable(rows) {
  const totalValue = rows.reduce((sum, row) => sum + toNumber(row.current_value), 0);

  document.getElementById('app').innerHTML = `
    <section class="table-card">
      <div class="section-header"><h2>Portfolio</h2><span>${STATE.owner}</span></div>
      <div class="table-wrap">
        <table id="portfolio-table">
          <thead>
            <tr>
              <th data-sort="symbol">Asset</th>
              <th class="num" data-sort="total_qty">Qty</th>
              <th class="num" data-sort="current_price">Price</th>
              <th class="num" data-sort="avg_net_cost">Avg Cost</th>
              <th class="num" data-sort="current_value">Value</th>
              <th class="num" data-sort="net_profit">Net Profit</th>
              <th class="num" data-sort="roi_total">ROI</th>
              <th class="num">Alloc</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => {
              const alloc = totalValue > 0 ? (toNumber(row.current_value) / totalValue) * 100 : 0;
              const isPos = toNumber(row.net_profit) >= 0;
              return `
                <tr class="clickable-row ${isPos ? 'row-positive' : 'row-negative'}" data-symbol="${row.symbol}">
                  <td><strong>${row.symbol}</strong></td>
                  <td class="num">${qty(row.total_qty)}</td>
                  <td class="num">${money(row.current_price, 2)}</td>
                  <td class="num">${toNumber(row.avg_net_cost) !== 0 ? money(row.avg_net_cost, 2) : '—'}</td>
                  <td class="num">${money(row.current_value, 2)}</td>
                  <td class="num ${isPos ? 'positive' : 'negative'}">${money(row.net_profit, 2)}</td>
                  <td class="num">${roiBadge(row.roi_total)}</td>
                  <td class="num allocation-cell">${allocationPercent(alloc)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  bindAssetRows(rows, totalValue);
  makeSortable('portfolio-table', rows, renderPortfolioTable);
}

function renderPortfolio() {
  const rows = getPortfolioRows(STATE.owner);
  if (!rows.length) {
    document.getElementById('app').innerHTML = `<div style="color:#ff5f7a;">No hay holdings para ${STATE.owner}</div>`;
    return;
  }
  sortState = { col: null, dir: 1 };
  renderPortfolioTable(rows);
}

// =========================
// PERFORMANCE
// =========================

function renderPerformanceTable(rows) {
  const latest = rows[rows.length - 1];

  document.getElementById('app').innerHTML = `
    <section class="dashboard-grid">
      <div class="metric-card"><span>Current Value</span><strong>${money(latest.current_value)}</strong><small>último snapshot</small></div>
      <div class="metric-card"><span>Investment</span><strong>${money(latest.current_investment)}</strong><small>inversión actual</small></div>
      <div class="metric-card"><span>Net Profit</span><strong class="${toNumber(latest.net_profit) >= 0 ? 'positive' : 'negative'}">${money(latest.net_profit)}</strong><small>resultado actual</small></div>
      <div class="metric-card"><span>ROI</span><strong class="${toNumber(latest.roi_total) >= 0 ? 'positive' : 'negative'}">${percent(latest.roi_total)}</strong><small>retorno actual</small></div>
    </section>
    <section class="table-card" style="margin-top:16px;">
      <div class="section-header"><h2>Performance Evolution</h2><span>${STATE.owner}</span></div>
      <div style="height:320px;"><canvas id="performance-history-chart"></canvas></div>
    </section>
    <section class="table-card" style="margin-top:16px;">
      <div class="section-header"><h2>Performance History</h2><span>${rows.length} snapshots</span></div>
      <div class="table-wrap">
        <table id="performance-table">
          <thead>
            <tr>
              <th data-sort="snapshot_date">Date</th>
              <th class="num" data-sort="current_value">Current Value</th>
              <th class="num" data-sort="current_investment">Investment</th>
              <th class="num" data-sort="net_profit">Net Profit</th>
              <th class="num" data-sort="roi_total">ROI</th>
            </tr>
          </thead>
          <tbody>
            ${rows.slice().reverse().map(row => `
              <tr>
                <td>${cleanDate(row.snapshot_date)}</td>
                <td class="num">${money(row.current_value, 2)}</td>
                <td class="num">${money(row.current_investment, 2)}</td>
                <td class="num ${toNumber(row.net_profit) >= 0 ? 'positive' : 'negative'}">${money(row.net_profit, 2)}</td>
                <td class="num">${roiBadge(row.roi_total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  renderPortfolioHistoryChart('performance-history-chart', rows, toNumber(latest.current_investment));
  makeSortable('performance-table', rows.slice().reverse(), (sorted) => {
    document.querySelector('#performance-table tbody').innerHTML = sorted.map(row => `
      <tr>
        <td>${cleanDate(row.snapshot_date)}</td>
        <td class="num">${money(row.current_value, 2)}</td>
        <td class="num">${money(row.current_investment, 2)}</td>
        <td class="num ${toNumber(row.net_profit) >= 0 ? 'positive' : 'negative'}">${money(row.net_profit, 2)}</td>
        <td class="num">${roiBadge(row.roi_total)}</td>
      </tr>
    `).join('');
  });
}

function renderPerformance() {
  const rows = getPerformanceRows(STATE.owner);
  if (!rows.length) {
    document.getElementById('app').innerHTML = `<div style="color:#ff5f7a;">No hay histórico para ${STATE.owner}</div>`;
    return;
  }
  sortState = { col: null, dir: 1 };
  renderPerformanceTable(rows);
}

// =========================
// GLOBAL
// =========================

function renderGlobal() {
  const app = document.getElementById('app');
  const rows = getAllDashboardOwners();

  if (!rows.length) {
    app.innerHTML = `<div style="color:#ff5f7a;">No hay datos globales.</div>`;
    return;
  }

  const totalValue = rows.reduce((sum, row) => sum + toNumber(row.total_value), 0);
  const totalProfit = rows.reduce((sum, row) => sum + toNumber(row.net_profit), 0);
  const totalBuy = rows.reduce((sum, row) => sum + toNumber(row.buy_usd), 0);
  const globalRoi = totalBuy > 0 ? totalProfit / totalBuy : 0;
  const canView = STATE.auth?.canView || [];
  const label = canView.includes('ALL') || canView.length === 0 ? 'All owners' : `${rows.length} owners`;

  app.innerHTML = `
    <section class="dashboard-grid">
      <div class="metric-card"><span>Global Value</span><strong>${money(totalValue)}</strong><small>patrimonio total</small></div>
      <div class="metric-card"><span>Global Net Profit</span><strong class="${totalProfit >= 0 ? 'positive' : 'negative'}">${money(totalProfit)}</strong><small>resultado consolidado</small></div>
      <div class="metric-card"><span>Global ROI</span><strong class="${globalRoi >= 0 ? 'positive' : 'negative'}">${percent(globalRoi)}</strong><small>net profit / buy usd</small></div>
      <div class="metric-card"><span>Owners</span><strong>${rows.length}</strong><small>wallets activas</small></div>
    </section>
    <br>
    <section class="table-card">
      <div class="section-header"><h2>Global Ranking</h2><span>${label}</span></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Owner</th>
              <th class="num">Total Value</th>
              <th class="num">Buy USD</th>
              <th class="num">Net Profit</th>
              <th class="num">ROI</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td><strong>${row.owner}</strong></td>
                <td class="num">${money(row.total_value, 2)}</td>
                <td class="num">${money(row.buy_usd, 2)}</td>
                <td class="num ${toNumber(row.net_profit) >= 0 ? 'positive' : 'negative'}">${money(row.net_profit, 2)}</td>
                <td class="num">${roiBadge(row.roi_total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// =========================
// PRICES
// =========================

function renderPrices() {
  const app = document.getElementById('app');
  const rows = getPriceRows();

  if (!rows.length) {
    app.innerHTML = `<div style="color:#ff5f7a;">No hay precios disponibles.</div>`;
    return;
  }

  const lastUpdate = rows[0]?.last_update || '—';

  app.innerHTML = `
    <section class="dashboard-grid">
      <div class="metric-card"><span>Assets</span><strong>${rows.length}</strong><small>tokens con precio</small></div>
      <div class="metric-card"><span>Last Update</span><strong style="font-size:18px;">${lastUpdate}</strong><small>última actualización</small></div>
    </section>
    <br>
    <section class="table-card">
      <div class="section-header"><h2>Prices</h2><span>wallet_prices</span></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Name</th>
              <th class="num">Price USD</th>
              <th>Source</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td><strong>${row.symbol}</strong></td>
                <td>${row.name || ''}</td>
                <td class="num">${money(row.price_usd, 6)}</td>
                <td>${row.source || ''}</td>
                <td>${row.last_update || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// =========================
// TRANSACTIONS
// =========================

function renderTransactions() {
  const app = document.getElementById('app');
  const allTxs = (STATE.data?.transactions || [])
    .filter(row => row.owner === STATE.owner)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!allTxs.length) {
    app.innerHTML = `<div style="color:#ff5f7a;">No hay transacciones para ${STATE.owner}</div>`;
    return;
  }

  const renderTxRows = (txs) => txs.map(row => {
    const txClass = getTxClass(row.type);
    return `
      <tr>
        <td>${cleanDate(row.date)}</td>
        <td><span class="tx-type ${txClass}">${row.type || ''}</span></td>
        <td><strong>${row.symbol || ''}</strong></td>
        <td>${row.wallet || ''}</td>
        <td class="num">${qty(row.qty)}</td>
        <td class="num">${toNumber(row.price_usd) > 0 ? money(row.price_usd, 4) : '—'}</td>
        <td class="num">${toNumber(row.total_usd) > 0 ? money(row.total_usd, 2) : '—'}</td>
      </tr>
    `;
  }).join('');

  app.innerHTML = `
    <section class="table-card">
      <div class="section-header">
        <h2>Transactions</h2>
        <span>${STATE.owner} · ${allTxs.length} movimientos</span>
      </div>
      <div class="table-wrap">
        <table id="tx-table">
          <thead>
            <tr>
              <th data-sort="date">Date</th>
              <th data-sort="type">Type</th>
              <th data-sort="symbol">Asset</th>
              <th data-sort="wallet">Wallet</th>
              <th class="num" data-sort="qty">Qty</th>
              <th class="num" data-sort="price_usd">Price</th>
              <th class="num" data-sort="total_usd">Total</th>
            </tr>
          </thead>
          <tbody>${renderTxRows(allTxs)}</tbody>
        </table>
      </div>
    </section>
  `;

  makeSortable('tx-table', allTxs, (sorted) => {
    document.querySelector('#tx-table tbody').innerHTML = renderTxRows(sorted);
  });
}

// =========================
// RENDER
// =========================

function render() {
  if (STATE.loading) { renderLoading(); return; }
  if (STATE.error) { renderError(); return; }
  if (!STATE.data) { renderLoading(); return; }

  updateGlobalNavVisibility();
  updateUserAvatar();

  switch (STATE.view) {
    case 'dashboard':    renderDashboard(); break;
    case 'portfolio':    renderPortfolio(); break;
    case 'performance':  renderPerformance(); break;
    case 'global':       renderGlobal(); break;
    case 'prices':       renderPrices(); break;
    case 'transactions': renderTransactions(); break;
    default:             renderDashboard();
  }
}
