const DEFAULT_CENTER = [-3.7319, -38.5267];
const DEFAULT_ZOOM = 13;
const SEARCH_MIN_INTERVAL_MS = 1200;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function parseApiError(payload) {
  if (payload && typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  return 'Não foi possível concluir a operação.';
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function parseCoordinate(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

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
      const elapsed = now() - lastRequestAt;
      if (elapsed >= 0 && elapsed < minIntervalMs) {
        throw new Error(`Aguarde ${Math.ceil((minIntervalMs - elapsed) / 1000)}s para nova busca.`);
      }

      const url = new URL(NOMINATIM_URL);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('q', cleaned);

      controller = new AbortController();
      try {
        const response = await fetchImpl(url, {
          signal: controller.signal,
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
        })).filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
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

function setText(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle('error', isError);
}

function createMap() {
  const map = L.map('map').setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  return map;
}

function normalizePlace(place) {
  return {
    id: String(place.id),
    name: place.name ?? '',
    description: place.description ?? '',
    latitude: Number(place.latitude),
    longitude: Number(place.longitude)
  };
}

function init() {
  const status = document.getElementById('status');
  const form = document.getElementById('place-form');
  const idInput = document.getElementById('place-id');
  const nameInput = document.getElementById('name');
  const descriptionInput = document.getElementById('description');
  const latitudeInput = document.getElementById('latitude');
  const longitudeInput = document.getElementById('longitude');
  const saveButton = document.getElementById('save-btn');
  const cancelButton = document.getElementById('cancel-btn');
  const deleteButton = document.getElementById('delete-btn');
  const placesList = document.getElementById('places');
  const searchForm = document.getElementById('search-form');
  const queryInput = document.getElementById('query');
  const searchButton = document.getElementById('search-btn');
  const searchCancelButton = document.getElementById('search-cancel-btn');
  const searchResults = document.getElementById('search-results');

  const map = createMap();
  const selectedMarker = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map);
  const placeMarkers = new Map();
  const geocodeClient = createGeocodeClient();
  const saveLock = createRequestLock();
  const deleteLock = createRequestLock();
  const searchLock = createRequestLock();

  const state = {
    places: [],
    editingId: null,
    loadController: null
  };

  function setButtonsState() {
    const editing = Boolean(state.editingId);
    const busySave = saveLock.isBusy();
    const busyDelete = deleteLock.isBusy();
    const busySearch = geocodeClient.isSearching() || searchLock.isBusy();
    saveButton.disabled = busySave || busyDelete;
    deleteButton.disabled = busySave || busyDelete || !editing;
    deleteButton.hidden = !editing;
    searchButton.disabled = busySearch;
    searchCancelButton.disabled = !busySearch;
  }

  function setSelection(lat, lng, shouldCenter = false) {
    latitudeInput.value = lat.toFixed(6);
    longitudeInput.value = lng.toFixed(6);
    selectedMarker.setLatLng([lat, lng]);
    if (shouldCenter) map.flyTo([lat, lng], Math.max(map.getZoom(), 15));
  }

  function resetForm() {
    form.reset();
    idInput.value = '';
    state.editingId = null;
    setSelection(...DEFAULT_CENTER);
    setText(status, '');
    setButtonsState();
  }

  function fillFormFromPlace(place) {
    idInput.value = place.id;
    state.editingId = place.id;
    nameInput.value = place.name;
    descriptionInput.value = place.description;
    setSelection(place.latitude, place.longitude, true);
    setText(status, `Editando: ${place.name}`);
    setButtonsState();
  }

  function renderPlaces() {
    placesList.textContent = '';
    for (const place of state.places) {
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = place.name;
      const desc = document.createElement('p');
      desc.textContent = place.description || 'Sem descrição';
      const coords = document.createElement('small');
      coords.textContent = `${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => fillFormFromPlace(place));
      li.append(title, desc, coords, edit);
      placesList.append(li);
    }
    if (state.places.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nenhum local na área atual.';
      placesList.append(li);
    }
  }

  function renderMarkers() {
    const ids = new Set(state.places.map(place => place.id));
    for (const [id, marker] of placeMarkers.entries()) {
      if (!ids.has(id)) {
        marker.remove();
        placeMarkers.delete(id);
      }
    }
    for (const place of state.places) {
      let marker = placeMarkers.get(place.id);
      if (!marker) {
        marker = L.marker([place.latitude, place.longitude]).addTo(map);
        marker.on('click', () => fillFormFromPlace(place));
        placeMarkers.set(place.id, marker);
      } else {
        marker.setLatLng([place.latitude, place.longitude]);
      }
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = place.name;
      const description = document.createElement('p');
      description.textContent = place.description || '';
      popup.append(title, description);
      marker.bindPopup(popup);
    }
  }

  async function loadPlaces() {
    if (state.loadController) state.loadController.abort();
    state.loadController = new AbortController();
    setText(status, 'Carregando locais...');
    const bounds = map.getBounds();
    const params = new URLSearchParams({
      west: String(bounds.getWest()),
      east: String(bounds.getEast()),
      south: String(bounds.getSouth()),
      north: String(bounds.getNorth())
    });
    try {
      const response = await fetch(`/api/places?${params}`, { signal: state.loadController.signal });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(parseApiError(payload));
      state.places = Array.isArray(payload?.places) ? payload.places.map(normalizePlace).filter(place =>
        Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) : [];
      renderPlaces();
      renderMarkers();
      setText(status, payload?.truncated ? 'Muitos locais. Aproxime o mapa para ver mais detalhes.' : 'Locais atualizados.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setText(status, error instanceof Error ? error.message : 'Falha ao carregar locais.', true);
    }
  }

  async function savePlace(event) {
    event.preventDefault();
    const result = await saveLock.run(async () => {
      setButtonsState();
      const latitude = parseCoordinate(latitudeInput.value, -90, 90);
      const longitude = parseCoordinate(longitudeInput.value, -180, 180);
      const payload = {
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        latitude,
        longitude
      };
      if (!payload.name || payload.name.length > 120 || payload.description.length > 2000 || latitude === null || longitude === null) {
        throw new Error('Preencha nome, descrição e coordenadas válidas antes de salvar.');
      }
      const editingId = state.editingId;
      const response = await fetch(editingId ? `/api/places/${editingId}` : '/api/places', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await readJson(response);
      if (!response.ok) throw new Error(parseApiError(body));
      setText(status, editingId ? 'Local atualizado com sucesso.' : 'Local criado com sucesso.');
      await loadPlaces();
      if (!editingId && body) fillFormFromPlace(normalizePlace(body));
      return body;
    });
    setButtonsState();
    if (result.skipped) setText(status, 'Aguarde a conclusão do envio atual.', true);
  }

  async function removePlace() {
    if (!state.editingId) return;
    if (!window.confirm('Deseja realmente excluir este local?')) return;
    const result = await deleteLock.run(async () => {
      setButtonsState();
      const response = await fetch(`/api/places/${state.editingId}`, { method: 'DELETE' });
      const body = await readJson(response);
      if (!response.ok) throw new Error(parseApiError(body));
      setText(status, 'Local excluído com sucesso.');
      resetForm();
      await loadPlaces();
    });
    setButtonsState();
    if (result.skipped) setText(status, 'Aguarde a conclusão da exclusão atual.', true);
  }

  function renderSearchResults(results) {
    searchResults.textContent = '';
    if (results.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'Nenhum endereço encontrado.';
      searchResults.append(item);
      return;
    }
    for (const result of results) {
      const item = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = result.label;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Selecionar no mapa';
      button.addEventListener('click', () => {
        setSelection(result.latitude, result.longitude, true);
        setText(status, 'Endereço selecionado. Revise os dados e salve quando quiser.');
      });
      item.append(text, button);
      searchResults.append(item);
    }
  }

  async function searchAddress(event) {
    event.preventDefault();
    const result = await searchLock.run(async () => {
      setButtonsState();
      setText(status, 'Buscando endereços...');
      const results = await geocodeClient.search(queryInput.value);
      renderSearchResults(results);
      setText(status, results.length ? 'Selecione um endereço para posicionar o marcador.' : 'Busca concluída sem resultados.');
    });
    setButtonsState();
    if (result.skipped) setText(status, 'Busca já em andamento.', true);
  }

  searchForm.addEventListener('submit', async event => {
    try { await searchAddress(event); }
    catch (error) { setText(status, error instanceof Error ? error.message : 'Falha na busca de endereço.', true); }
    finally { setButtonsState(); }
  });

  searchCancelButton.addEventListener('click', () => {
    if (geocodeClient.cancel()) setText(status, 'Busca cancelada.');
    setButtonsState();
  });

  form.addEventListener('submit', async event => {
    try { await savePlace(event); }
    catch (error) { setText(status, error instanceof Error ? error.message : 'Falha ao salvar local.', true); }
    finally { setButtonsState(); }
  });

  cancelButton.addEventListener('click', () => resetForm());
  deleteButton.addEventListener('click', async () => {
    try { await removePlace(); }
    catch (error) { setText(status, error instanceof Error ? error.message : 'Falha ao excluir local.', true); }
    finally { setButtonsState(); }
  });

  map.on('moveend', loadPlaces);
  map.on('click', event => setSelection(event.latlng.lat, event.latlng.lng));
  selectedMarker.on('dragend', () => {
    const point = selectedMarker.getLatLng();
    setSelection(point.lat, point.lng);
  });

  navigator.geolocation?.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], DEFAULT_ZOOM);
      setSelection(latitude, longitude, false);
    },
    () => setSelection(...DEFAULT_CENTER),
    { enableHighAccuracy: true, timeout: 8000 }
  );

  resetForm();
  loadPlaces();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof L !== 'undefined') {
  init();
}
