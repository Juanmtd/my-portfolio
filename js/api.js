async function loadData() {
  try {
    STATE.loading = true;
    STATE.error = null;

    render();

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

    STATE.data = json.data;

    STATE.loading = false;
    render();

  } catch (err) {
    STATE.loading = false;
    STATE.error = err.message;
    render();
  }
}
