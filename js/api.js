async function fetchWalletData() {

  try {

    STATE.loading = true;

    const response = await fetch(

      `${CONFIG.API_URL}?token=${CONFIG.API_TOKEN}&t=${Date.now()}`,

      {
        cache: 'no-store'
      }

    );

    if (!response.ok) {

      throw new Error(`HTTP ${response.status}`);

    }

    const data = await response.json();

    if (data.error) {

      throw new Error(data.error);

    }

    STATE.data = data;

    STATE.error = null;

    return data;

  } catch (error) {

    console.error(error);

    STATE.error = error.message;

  } finally {

    STATE.loading = false;

  }

}
