import { request, viewportParams } from "./api.js";
const $ = (id) => document.getElementById(id);
const fallback = [-3.7319, -38.5267];
const map = L.map("map", { zoomControl: false, worldCopyJump: true }).setView(
  fallback,
  13,
);
L.control.zoom({ position: "topright" }).addTo(map);
const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);
tiles.on("tileerror", () => {
  $("tile-status").hidden = false;
  $("tile-status").textContent =
    "O mapa base não carregou. Verifique sua conexão; os locais continuam disponíveis na lista.";
});
const markers = L.layerGroup().addTo(map);
const icon = L.divIcon({
  className: "study-marker",
  html: '<div class="marker-pin"><span>▤</span></div>',
  iconSize: [34, 42],
  iconAnchor: [17, 40],
  popupAnchor: [0, -35],
});
let controller,
  loadVersion = 0,
  editing = false,
  saving = false,
  activePlace,
  selection,
  selectedMarker,
  userMarker,
  toastTimer;

function popup(place) {
  const content = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = place.name;
  const description = document.createElement("p");
  description.textContent =
    place.description || "Um novo lugar para suas ideias.";
  content.append(title, description);
  return content;
}
function renderPlaces(places) {
  markers.clearLayers();
  $("places").replaceChildren();
  for (const place of places) {
    const marker = L.marker([place.latitude, place.longitude], {
      icon,
      title: place.name,
    })
      .bindPopup(popup(place))
      .addTo(markers);
    marker.on("click", () => (activePlace = place.id));
    if (activePlace === place.id) marker.openPopup();
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-card";
    const symbol = document.createElement("span");
    symbol.className = "place-symbol";
    symbol.textContent = "▤";
    symbol.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    copy.className = "place-copy";
    const name = document.createElement("strong");
    name.textContent = place.name;
    const description = document.createElement("p");
    description.textContent =
      place.description || "Um lugar esperando sua próxima visita.";
    const action = document.createElement("small");
    action.textContent = "Ver no mapa ↗";
    copy.append(name, description, action);
    button.append(symbol, copy);
    button.addEventListener("click", () => {
      activePlace = place.id;
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16));
      marker.openPopup();
    });
    item.append(button);
    $("places").append(item);
  }
  $("result-count").textContent = String(places.length);
  $("empty-state").hidden = places.length !== 0;
}
async function loadPlaces() {
  controller?.abort();
  controller = new AbortController();
  const current = controller,
    version = ++loadVersion;
  $("list-status").textContent = "Buscando locais nesta área…";
  $("retry").hidden = true;
  $("empty-state").hidden = true;
  const timeout = setTimeout(() => current.abort(), 12000);
  try {
    const data = await request(
      `/api/places?${viewportParams(map.getBounds())}`,
      { signal: current.signal },
    );
    if (version !== loadVersion) return;
    renderPlaces(data.places);
    $("list-status").textContent = data.truncated
      ? "Há mais de 500 locais nesta área. Aproxime o mapa para ver todos."
      : `${data.places.length === 1 ? "1 local encontrado" : `${data.places.length} locais encontrados`}. Atualizado ao mover o mapa.`;
  } catch (error) {
    if (version !== loadVersion) return;
    markers.clearLayers();
    $("places").replaceChildren();
    $("result-count").textContent = "—";
    $("list-status").textContent =
      error.name === "AbortError"
        ? "A busca demorou mais que o esperado. Tente novamente."
        : error.message;
    $("retry").hidden = false;
  } finally {
    clearTimeout(timeout);
  }
}
map.on("moveend", loadPlaces);
$("retry").addEventListener("click", loadPlaces);

function locate() {
  if (!navigator.geolocation) {
    $("location-status").textContent =
      "Geolocalização indisponível. Exibindo Fortaleza como ponto de partida; explore o mapa.";
    return;
  }
  $("locate").disabled = true;
  $("location-status").textContent = "Solicitando sua localização…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      userMarker?.remove();
      userMarker = L.circleMarker([coords.latitude, coords.longitude], {
        radius: 7,
        color: "#fff",
        weight: 3,
        fillColor: "#377caf",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip("Você está aqui");
      map.setView([coords.latitude, coords.longitude], 15);
      $("location-status").textContent =
        "Mapa centralizado na sua localização.";
      $("locate").disabled = false;
    },
    (error) => {
      const reason =
        error.code === 1
          ? "Permissão de localização negada."
          : "Não foi possível obter sua localização.";
      $("location-status").textContent =
        `${reason} Explore o mapa manualmente. A posição inicial alternativa é Fortaleza.`;
      $("locate").disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}
$("locate").addEventListener("click", locate);

function setPosition(latlng) {
  if (saving) return;
  selection = {
    latitude: latlng.lat,
    longitude: ((((latlng.lng + 180) % 360) + 360) % 360) - 180,
  };
  if (!selectedMarker) {
    selectedMarker = L.marker([selection.latitude, selection.longitude], {
      draggable: true,
      title: "Posição do novo local",
    }).addTo(map);
    selectedMarker.on("dragend", () => setPosition(selectedMarker.getLatLng()));
  } else selectedMarker.setLatLng([selection.latitude, selection.longitude]);
  $("selected-position").textContent =
    `${selection.latitude.toFixed(5)}, ${selection.longitude.toFixed(5)} — posição selecionada`;
}
function openEditor() {
  if (editing) {
    $("name").focus();
    return;
  }
  editing = true;
  $("explore-panel").hidden = true;
  $("editor-panel").hidden = false;
  document.body.classList.add("selecting");
  $("map-caption").textContent = "Clique no mapa para marcar o novo local.";
  $("editor-title").focus();
}
function closeEditor() {
  editing = false;
  selection = undefined;
  selectedMarker?.remove();
  selectedMarker = undefined;
  $("place-form").reset();
  $("form-status").textContent = "";
  $("selected-position").textContent = "Clique no mapa para marcar o local.";
  $("editor-panel").hidden = true;
  $("explore-panel").hidden = false;
  document.body.classList.remove("selecting");
  $("map-caption").textContent = "Explore o mapa. Encontre seu lugar.";
  $("new-place").focus();
}
$("new-place").addEventListener("click", openEditor);
$("empty-create").addEventListener("click", openEditor);
$("cancel").addEventListener("click", closeEditor);
$("cancel-top").addEventListener("click", closeEditor);
$("use-center").addEventListener("click", () => setPosition(map.getCenter()));
map.on("click", ({ latlng }) => {
  if (editing) setPosition(latlng);
});
$("place-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (saving) return;
  if (!selection) {
    $("form-status").textContent =
      "Selecione um ponto no mapa ou use o centro do mapa.";
    $("use-center").focus();
    return;
  }
  if (!$("name").value.trim()) {
    $("form-status").textContent = "Informe o nome do local.";
    $("name").focus();
    return;
  }
  const controls = [
    "save-place",
    "cancel",
    "cancel-top",
    "use-center",
    "name",
    "description",
    "new-place",
  ];
  saving = true;
  selectedMarker?.dragging.disable();
  controls.forEach((id) => ($(id).disabled = true));
  $("form-status").textContent = "Salvando seu local…";
  try {
    await request("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: $("name").value.trim(),
        description: $("description").value.trim(),
        ...selection,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const position = [selection.latitude, selection.longitude];
    closeEditor();
    map.setView(position, map.getZoom());
    await loadPlaces();
    clearTimeout(toastTimer);
    $("toast").hidden = false;
    $("toast").textContent = "Local cadastrado. Obrigado por compartilhar!";
    toastTimer = setTimeout(() => ($("toast").hidden = true), 5000);
  } catch (error) {
    $("form-status").textContent =
      error.name === "TimeoutError"
        ? "Sem confirmação do salvamento. Confira a lista antes de tentar novamente."
        : error.message;
  } finally {
    saving = false;
    selectedMarker?.dragging.enable();
    controls.forEach((id) => ($(id).disabled = false));
    if (!editing) $("new-place").focus();
  }
});
loadPlaces();
locate();
