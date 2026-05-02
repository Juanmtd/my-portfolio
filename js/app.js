async function boot() {

  bindNavigation();

  bindRefresh();

  initOwnerSelect();

  renderLoading();

  await fetchWalletData();

  updateLastRefresh();

  render();

}

function bindNavigation() {

  document.querySelectorAll('.nav-btn').forEach(btn => {

    btn.addEventListener('click', () => {

      const view = btn.dataset.view;

      STATE.view = view;

      setActiveNav(view);

      render();

    });

  });

}

function bindRefresh() {

  const btn = document.getElementById('refresh-btn');

  btn.addEventListener('click', async () => {

    renderLoading();

    await fetchWalletData();

    updateLastRefresh();

    render();

  });

}

function updateLastRefresh() {

  const el = document.getElementById('last-update');

  el.textContent = `updated ${new Date().toLocaleTimeString('es-ES')}`;

}

document.addEventListener('DOMContentLoaded', boot);
