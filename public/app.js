let map;
let placesLayer;
let selectionMarker = null;
let currentEditingId = null;
let selectedCoordinates = null;
let activeViewportController = null;

const DEFAULT_COORDS = { lat: -6.8885, lng: -38.5614, zoom: 14 };

const statusAlert = document.getElementById('status-alert');
const formTitle = document.getElementById('form-title');
const placeForm = document.getElementById('place-form');
const nameInput = document.getElementById('place-name');
const descInput = document.getElementById('place-desc');
const coordsDisplay = document.getElementById('coords-display');
const saveBtn = document.getElementById('save-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');

function setFeedback(message, type = 'info') {
  statusAlert.textContent = message;
  statusAlert.className = type;
  statusAlert.style.display = 'block';
}

function clearFeedback() {
  statusAlert.textContent = '';
  statusAlert.style.display = 'none';
}


function initLeafletMap() {
  map = L.map('map').setView([DEFAULT_COORDS.lat, DEFAULT_COORDS.lng], DEFAULT_COORDS.zoom);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
  }).addTo(map);

  placesLayer = L.layerGroup().addTo(map);

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 15);
      },
      (error) => {
        let msg = 'Geolocalização não disponível. Usando visão padrão.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permissão de localização negada pelo navegador. Usando mapa padrão.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Tempo esgotado ao buscar localização. Usando mapa padrão.';
        }
        setFeedback(msg, 'warning');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  } else {
    setFeedback('Navegador sem suporte à geolocalização. Carregando mapa padrão.', 'warning');
  }

  map.on('click', (e) => {
    updateSelectionPoint(e.latlng.lat, e.latlng.lng);
  });

  map.on('moveend', loadViewportPlaces);
}

function updateSelectionPoint(lat, lng) {
  selectedCoordinates = {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6))
  };

  coordsDisplay.textContent = `Coordenadas: Lat ${selectedCoordinates.lat}, Lng ${selectedCoordinates.lng}`;
  saveBtn.disabled = false;

  if (selectionMarker) {
    selectionMarker.setLatLng([selectedCoordinates.lat, selectedCoordinates.lng]);
  } else {
    selectionMarker = L.marker([selectedCoordinates.lat, selectedCoordinates.lng], {
      draggable: true,
      title: 'Ponto selecionado (arraste para ajustar)'
    }).addTo(map);

    selectionMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      selectedCoordinates = {
        lat: Number(pos.lat.toFixed(6)),
        lng: Number(pos.lng.toFixed(6))
      };
      coordsDisplay.textContent = `Coordenadas: Lat ${selectedCoordinates.lat}, Lng ${selectedCoordinates.lng}`;
    });
  }
}

function clearSelectionPoint() {
  selectedCoordinates = null;
  coordsDisplay.textContent = 'Nenhum ponto marcado. Clique no mapa ou busque um endereço acima para posicionar.';
  saveBtn.disabled = true;

  if (selectionMarker) {
    map.removeLayer(selectionMarker);
    selectionMarker = null;
  }
}

async function loadViewportPlaces() {
  if (activeViewportController) {
    activeViewportController.abort();
  }
  activeViewportController = new AbortController();

  const bounds = map.getBounds();
  const west = bounds.getWest();
  const east = bounds.getEast();
  const south = bounds.getSouth();
  const north = bounds.getNorth();

  const url = `/api/places?west=${west}&east=${east}&south=${south}&north=${north}`;

  try {
    const res = await fetch(url, { signal: activeViewportController.signal });
    if (!res.ok) throw new Error(`Erro ${res.status}: falha ao carregar locais.`);

    const data = await res.json();

    if (data.truncated) {
      setFeedback('Muitos locais nesta área. Aproxime o zoom para visualizar todos.', 'warning');
    } else {
      clearFeedback();
    }

    renderPlaceMarkers(data.places || []);
  } catch (err) {
    if (err.name !== 'AbortError') {
      setFeedback('Falha de conexão com a API de locais.', 'error');
    }
  }
}

function renderPlaceMarkers(places) {
  placesLayer.clearLayers();

  places.forEach((place) => {
    const marker = L.marker([place.latitude, place.longitude]);

    const container = document.createElement('div');

    const titleEl = document.createElement('h3');
    titleEl.style.fontSize = '1rem';
    titleEl.style.marginBottom = '4px';
    titleEl.textContent = place.name;
    container.appendChild(titleEl);

    if (place.description) {
      const descEl = document.createElement('p');
      descEl.style.fontSize = '0.85rem';
      descEl.style.color = '#4b5563';
      descEl.style.margin = '4px 0 8px';
      descEl.textContent = place.description;
      container.appendChild(descEl);
    }

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '6px';
    btnContainer.style.marginTop = '6px';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Editar';
    editBtn.className = 'btn-secondary';
    editBtn.style.padding = '3px 8px';
    editBtn.onclick = () => beginEdit(place);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Excluir';
    deleteBtn.className = 'btn-danger';
    deleteBtn.style.padding = '3px 8px';
    deleteBtn.onclick = () => removePlace(place.id, place.name);

    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(deleteBtn);
    container.appendChild(btnContainer);

    marker.bindPopup(container);
    placesLayer.addLayer(marker);
  });
}

function beginEdit(place) {
  clearFeedback();
  currentEditingId = place.id;
  formTitle.textContent = `Editar: ${place.name}`;
  nameInput.value = place.name;
  descInput.value = place.description || '';
  saveBtn.textContent = 'Salvar Alterações';
  cancelEditBtn.style.display = 'inline-block';

  updateSelectionPoint(place.latitude, place.longitude);
  map.setView([place.latitude, place.longitude], 16);
}

function cancelEdit() {
  currentEditingId = null;
  formTitle.textContent = 'Cadastrar Local de Estudo';
  placeForm.reset();
  saveBtn.textContent = 'Cadastrar';
  cancelEditBtn.style.display = 'none';
  clearSelectionPoint();
  clearFeedback();
}

cancelEditBtn.addEventListener('click', cancelEdit);

placeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFeedback();

  if (!selectedCoordinates) {
    setFeedback('Marque um ponto no mapa ou busque um endereço antes de salvar.', 'error');
    return;
  }

  saveBtn.disabled = true;

  const payload = {
    name: nameInput.value.trim(),
    description: descInput.value.trim(),
    latitude: selectedCoordinates.lat,
    longitude: selectedCoordinates.lng
  };

  const isEditing = Boolean(currentEditingId);
  const endpoint = isEditing ? `/api/places/${currentEditingId}` : '/api/places';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}: Não foi possível salvar o local.`);
    }

    cancelEdit();
    await loadViewportPlaces();
    setFeedback(isEditing ? 'Local atualizado com sucesso!' : 'Local cadastrado com sucesso!', 'info');
  } catch (err) {
    setFeedback(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

async function removePlace(id, name) {
  const confirmed = window.confirm(`Deseja realmente excluir "${name}"?`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/places/${id}`, { method: 'DELETE' });

    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao excluir o local.');
    }

    if (currentEditingId === String(id)) {
      cancelEdit();
    }

    await loadViewportPlaces();
    setFeedback('Local removido com sucesso.', 'info');
  } catch (err) {
    setFeedback(err.message, 'error');
  }
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFeedback();

  const query = searchInput.value.trim();
  if (query.length < 3) {
    setFeedback('Digite ao menos 3 caracteres para buscar o endereço.', 'error');
    return;
  }

  searchBtn.disabled = true;
  searchResults.style.display = 'none';
  searchResults.innerHTML = '';

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error('Falha no serviço de geocodificação.');
    }

    const results = await res.json();
    if (!results || results.length === 0) {
      setFeedback('Nenhum endereço encontrado para o termo pesquisado.', 'info');
      return;
    }

    results.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.display_name;
      li.onclick = () => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        map.setView([lat, lon], 16);
        updateSelectionPoint(lat, lon);
        searchResults.style.display = 'none';
        setFeedback('Ponto posicionado pelo endereço. Preencha os dados e clique em Cadastrar.', 'info');
      };
      searchResults.appendChild(li);
    });

    searchResults.style.display = 'block';
  } catch (err) {
    setFeedback('Erro ao consultar endereço. Tente novamente mais tarde.', 'error');
  } finally {
    searchBtn.disabled = false;
  }
});

window.addEventListener('DOMContentLoaded', () => {
  initLeafletMap();
  loadViewportPlaces();
});