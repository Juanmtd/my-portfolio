async function boot() {
  bindNavigation();
  bindRefresh();
  initOwnerSelect();

  updateOwnerBarVisibility();

  await loadData();
  updateLastRefresh();
}

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
    await loadData();
    updateLastRefresh();
  });
}

function updateOwnerBarVisibility() {
  const ownerBar = document.querySelector('.owner-bar');

  if (!ownerBar) return;

  const viewsWithOwner = ['dashboard', 'portfolio', 'performance'];

  ownerBar.style.display = viewsWithOwner.includes(STATE.view)
    ? 'block'
    : 'none';
}

function updateLastRefresh() {
  const el = document.getElementById('last-update');
  el.textContent = `updated ${new Date().toLocaleTimeString('es-ES')}`;
}

document.addEventListener('DOMContentLoaded', boot);
