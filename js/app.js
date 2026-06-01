async function boot() {
  const savedAuth = loadSavedAuth();

  if (savedAuth) {
    STATE.auth.user = savedAuth.user;
    STATE.auth.canView = savedAuth.canView;
    STATE.auth.ready = true;

    showApp();
    initOwnerFromAuth();
    bindNavigation();
    bindRefresh();
    initOwnerSelect();
    updateOwnerBarVisibility();
    updateGlobalNavVisibility();
    updateUserAvatar();

    await loadData();
    updateLastRefresh();
  } else {
    renderLogin();
  }
}

// =========================
// AUTH
// =========================

function saveAuth(user, canView) {
  try { localStorage.setItem('wallet2_auth', JSON.stringify({ user, canView })); } catch (e) {}
}

function loadSavedAuth() {
  try {
    const raw = localStorage.getItem('wallet2_auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function clearAuth() {
  try {
    localStorage.removeItem('wallet2_auth');
    localStorage.removeItem('wallet2_cache_v1');
    localStorage.removeItem('wallet2_cache_time_v1');
  } catch (e) {}
}

async function handleGoogleLogin(response) {
  try {
    const payload = parseJwt(response.credential);
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    showLoadingOverlay('Verificando acceso...');
    await loadDataForAuth();

    const configUsers = getDataTable('config_users');
    const userRow = configUsers.find(
      row => row.email && row.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    hideLoadingOverlay();

    if (!userRow) {
      showLoginError('Este correo no tiene acceso a Wallet 2.0.');
      return;
    }

    if (String(userRow.active).toUpperCase() !== 'TRUE') {
      showLoginError('Tu acceso está desactivado. Contacta con Juan Miguel.');
      return;
    }

    let canView = [];
    const canViewRaw = String(userRow.can_view || '').trim();

    if (canViewRaw.toUpperCase() === 'ALL') {
      canView = CONFIG.OWNERS.slice();
    } else {
      canView = canViewRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    const user = { name, email, picture };
    STATE.auth.user = user;
    STATE.auth.canView = canView;
    STATE.auth.ready = true;

    saveAuth(user, canView);

    showApp();
    initOwnerFromAuth();
    bindNavigation();
    bindRefresh();
    initOwnerSelect();
    updateOwnerBarVisibility();
    updateGlobalNavVisibility();
    updateUserAvatar();
    render();
    updateLastRefresh();

  } catch (err) {
    hideLoadingOverlay();
    showLoginError('Error al verificar acceso. Inténtalo de nuevo.');
    console.error('Login error:', err);
  }
}

function initOwnerFromAuth() {
  const canView = STATE.auth.canView;
  if (canView.length > 0) STATE.owner = canView[0];
}

function logout() {
  clearAuth();
  STATE.auth.user = null;
  STATE.auth.canView = [];
  STATE.auth.ready = false;
  STATE.data = null;
  STATE.owner = null;

  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }

  renderLogin();
}

// =========================
// SHOW / HIDE
// =========================

function showApp() {
  document.querySelector('.app-shell').style.display = 'block';
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.remove();
}

function showLoadingOverlay(msg) {
  let el = document.getElementById('auth-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-loading';
    el.className = 'auth-loading-overlay';
    document.body.appendChild(el);
  }
  el.innerHTML = `<div class="auth-loading-box"><div class="loader"></div><p>${msg}</p></div>`;
  el.style.display = 'flex';
}

function hideLoadingOverlay() {
  const el = document.getElementById('auth-loading');
  if (el) el.style.display = 'none';
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// =========================
// NAVIGATION
// =========================

function bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.view = btn.dataset.view;
      setActiveNav(STATE.view);
      updateOwnerBarVisibility();
      render();
    });
  });
}

function bindRefresh() {
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await loadData(true);
    updateLastRefresh();
  });
}

function updateOwnerBarVisibility() {
  const ownerBar = document.querySelector('.owner-bar');
  if (!ownerBar) return;
  const viewsWithOwner = ['dashboard', 'portfolio', 'performance', 'transactions'];
  const shouldShow = viewsWithOwner.includes(STATE.view);
  ownerBar.style.display = (shouldShow && STATE.auth.canView.length > 1) ? 'block' : 'none';
}

function updateLastRefresh() {
  const el = document.getElementById('last-update');
  if (el) el.textContent = `updated ${new Date().toLocaleTimeString('es-ES')}`;
}

function initOwnerSelect() {
  const select = document.getElementById('owner-select');
  if (!select) return;

  const canView = STATE.auth.canView;
  select.innerHTML = canView.map(owner => `<option value="${owner}">${owner}</option>`).join('');
  select.value = STATE.owner || canView[0];

  select.addEventListener('change', () => {
    STATE.owner = select.value;
    render();
  });
}

// =========================
// UTILS
// =========================

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(jsonPayload);
}

document.addEventListener('DOMContentLoaded', boot);
