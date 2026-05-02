async function boot() {
  bindNavigation();
  bindRefresh();
  initOwnerSelect();

  await loadData();
  updateLastRefresh();
}

function bindNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.view = btn.dataset.view;
      setActiveNav(STATE.view);
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

function updateLastRefresh() {
  const el = document.getElementById('last-update');
  el.textContent = `updated ${new Date().toLocaleTimeString('es-ES')}`;
}

document.addEventListener('DOMContentLoaded', boot);
