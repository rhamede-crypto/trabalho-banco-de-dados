const SEARCH_MIN_INTERVAL_MS = 1200;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export function createRequestLock() {
  let busy = false;
  return {
    isBusy: () => busy,
    async run(task) {
      if (busy) return { skipped: true };
      busy = true;
      try { return { skipped: false, value: await task() }; }
      finally { busy = false; }
    }
  };
}

export function createGeocodeClient({
  fetchImpl = fetch,
  now = () => Date.now(),
  minIntervalMs = SEARCH_MIN_INTERVAL_MS
} = {}) {
  let controller = null;
  let lastRequestAt = 0;

  return {
    isSearching: () => Boolean(controller),
    cancel() {
      if (!controller) return false;
      controller.abort();
      return true;
    },
    async search(query) {
      const cleaned = String(query ?? '').trim();
      if (cleaned.length < 3) throw new Error('Digite ao menos 3 caracteres para buscar.');
      if (controller) throw new Error('Busca já em andamento.');
      const elapsed = now() - lastRequestAt;
      if (elapsed >= 0 && elapsed < minIntervalMs) {
        throw new Error(`Aguarde ${Math.ceil((minIntervalMs - elapsed) / 1000)}s para nova busca.`);
      }

      const url = new URL(NOMINATIM_URL);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('q', cleaned);

      controller = new AbortController();
      lastRequestAt = now();
      try {
        const response = await fetchImpl(url, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
          headers: {
            Accept: 'application/json'
          }
        });
        lastRequestAt = now();
        if (!response.ok) throw new Error('Busca de endereço indisponível no momento.');
        const payload = await response.json();
        if (!Array.isArray(payload) || payload.length === 0) return [];
        return payload.map(item => ({
          label: item.display_name || `${item.lat}, ${item.lon}`,
          latitude: Number(item.lat),
          longitude: Number(item.lon)
        })).filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180);
      } catch (error) {
        if (error?.name === 'AbortError') throw new Error('Busca cancelada.');
        if (error instanceof Error) throw error;
        throw new Error('Falha de rede na busca de endereço.');
      } finally {
        controller = null;
      }
    }
  };
}
