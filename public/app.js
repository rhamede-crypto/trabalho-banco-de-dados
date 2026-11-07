import { buildViewportQuery, createRequestLock, geolocationMessage } from './map-utils.js';

const DEFAULT_CENTER = [-3.7327, -38.5267];
const DEFAULT_ZOOM = 13;

const statusEl = document.getElementById('status');
const detailsEl = document.getElementById('details');

const map = L.map('map', {
  zoomControl: true
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);
const requestLock = createRequestLock();

function setStatus(message) {
  statusEl.textContent = message;
}

function renderPlaceDetails(place) {
  detailsEl.textContent = place.description?.trim() || 'Sem descrição disponível.';
}

function renderPlaces(places) {
  markersLayer.clearLayers();

  for (const place of places) {
    const marker = L.marker([place.latitude, place.longitude]);

    const wrapper = document.createElement('article');
    const title = document.createElement('strong');
    const description = document.createElement('p');

    title.textContent = place.name;
    description.textContent = place.description?.trim() || 'Sem descrição disponível.';
    description.style.margin = '0.3rem 0 0';

    wrapper.append(title, description);
    marker.bindPopup(wrapper);
    marker.on('click', () => renderPlaceDetails(place));

    markersLayer.addLayer(marker);
  }
}

async function loadVisiblePlaces() {
  const request = requestLock.next();
  const url = buildViewportQuery(map.getBounds());

  setStatus('Carregando locais visíveis...');

  try {
    const response = await fetch(url, { signal: request.signal });

    if (!response.ok) {
      throw new Error(`Falha HTTP ${response.status}`);
    }

    const payload = await response.json();

    if (!requestLock.isCurrent(request.id)) {
      return;
    }

    renderPlaces(payload.places);

    if (payload.truncated) {
      setStatus('Muitos resultados nesta área. Aproxime o mapa para ver menos pontos.');
    } else if (payload.places.length === 0) {
      setStatus('Nenhum local encontrado na área visível.');
    } else {
      setStatus(`Exibindo ${payload.places.length} local(is) na área visível.`);
    }
  } catch (error) {
    if (error.name === 'AbortError' || !requestLock.isCurrent(request.id)) {
      return;
    }

    renderPlaces([]);
    setStatus('Falha ao carregar locais. Tente mover o mapa novamente.');
  }
}

function useFallbackLocation(reason) {
  map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  setStatus(reason);
}

function initializeGeolocation() {
  if (!('geolocation' in navigator)) {
    useFallbackLocation('Este navegador não oferece geolocalização. Exibindo área padrão de Fortaleza (CE).');
    return;
  }

  map.once('locationfound', ({ latlng }) => {
    map.setView(latlng, 15);
    setStatus('Localização atual detectada.');
  });

  map.once('locationerror', ({ code }) => {
    useFallbackLocation(geolocationMessage(code));
  });

  map.locate({
    enableHighAccuracy: true,
    setView: false,
    timeout: 8000,
    maximumAge: 0
  });
}

map.on('moveend', loadVisiblePlaces);
map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
setStatus('Tentando obter sua geolocalização...');
initializeGeolocation();
