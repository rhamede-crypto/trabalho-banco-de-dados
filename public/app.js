import { radiusInMeters, proximityQuery, formatDistance } from "./proximity.js";
let userPosition = null, proximity = null, radiusCircle;
import { createGeocodeClient } from "./geocode.js";
const geocoder = createGeocodeClient();
let editingId = null, searchVersion = 0;
import { request } from "./api.js";
import { buildViewportQuery, createRequestLock, geolocationMessage } from "./map-utils.js";
const viewportRequests = createRequestLock();
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
let editing = false,
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
  const actions = document.createElement("div");
  const edit = document.createElement("button"), remove = document.createElement("button");
  edit.type = remove.type = "button";
  edit.className = remove.className = "text-button";
  edit.textContent = "Editar ponto";remove.textContent = "Excluir ponto";
  edit.addEventListener("click", () => openEditor(place));
  remove.addEventListener("click", () => {
    if(saving) return;
    openEditor(place);$("delete-place").click();
  });
  actions.className = "popup-actions";actions.append(edit,remove);content.append(actions);
  return content;
}
function renderPlaces(places) {
  map.closePopup();
  markers.clearLayers();
  $("places").replaceChildren();
  for (const place of places) {
    const marker = L.marker([place.latitude, place.longitude], {
      icon,
      title: place.name,
    })
      .bindPopup(popup(place), {autoPan:false})
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
    action.textContent = proximity && Number.isFinite(place.distance) ? `${formatDistance(place.distance)} de você · Ver no mapa ↗` : "Ver no mapa ↗";
    copy.append(name, description, action);
    button.append(symbol, copy);
    button.addEventListener("click", () => {
      activePlace = place.id;
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16));
      marker.openPopup();
    });
    const edit = document.createElement("button");
    edit.type = "button";edit.className = "text-button";edit.textContent = "Editar";
    edit.setAttribute("aria-label", "Editar local");
    edit.addEventListener("click", () => openEditor(place));
    item.append(button, edit);
    $("places").append(item);
  }
  $("result-count").textContent = String(places.length);
  $("empty-state").hidden = places.length !== 0;
  $("empty-title").textContent = proximity ? "Nenhum local neste raio." : "O primeiro ponto pode ser seu.";
  $("empty-description").textContent = proximity ? "Aumente o raio da busca ou volte à exploração do mapa." : "Nenhum local cadastrado nesta área. Explore o mapa ou compartilhe um lugar que você conhece.";
}
async function loadPlaces() {
  const current = viewportRequests.next(), version = current.id;
  $("list-status").textContent = "Buscando locais nesta área…";
  $("retry").hidden = true;
  $("empty-state").hidden = true;
  const timeout = setTimeout(() => current.abort(), 12000);
  try {
    const data = await request(
      proximity ? proximityQuery(proximity, proximity.radius) : buildViewportQuery(map.getBounds()),
      { signal: current.signal },
    );
    if (!viewportRequests.isCurrent(version)) return;
    renderPlaces(data.places);
    $("list-status").textContent = data.truncated
      ? (proximity ? "Há mais de 500 locais neste raio. Reduza o raio para ver todos." : "Há mais de 500 locais nesta área. Aproxime o mapa para ver todos.")
      : `${data.places.length === 1 ? "1 local encontrado" : `${data.places.length} locais encontrados`}. ${proximity ? "Ordenados pela distância de você." : "Atualizado ao mover o mapa."}`;
  } catch (error) {
    if (!viewportRequests.isCurrent(version)) return;
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
map.on("moveend", () => { if (!proximity) loadPlaces(); });
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
      userPosition = {latitude:coords.latitude,longitude:coords.longitude};
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
      if(proximity) activateProximity(proximity.radius);
    },
    (error) => {
      const reason =
        error.code === 1
          ? "Permissão de localização negada."
          : geolocationMessage(error.code, window.isSecureContext);
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
function openEditor(place) {
  if (saving) return;
  if (editing && !place) {
    $("name").focus();
    return;
  }
  editing = true;
  editingId = place?.id ?? null;
  $("editor-title").textContent = place ? "Editar local de estudo" : "Um novo ponto de partida.";
  $("save-place").textContent = place ? "Salvar alterações" : "Salvar local";
  $("delete-place").hidden = !place;
  if (place) {
    $("name").value = place.name;$("description").value = place.description || "";
    setPosition({lat:place.latitude,lng:place.longitude});
    map.setView([place.latitude,place.longitude],Math.max(map.getZoom(),15));
  }
  $("explore-panel").hidden = true;
  $("editor-panel").hidden = false;
  document.body.classList.add("selecting");
  $("map-caption").textContent = "Clique no mapa para marcar o novo local.";
  $("editor-title").focus();
}
function closeEditor() {
  resetSearch();
  editingId = null;
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
$("new-place").addEventListener("click", () => openEditor());
$("empty-create").addEventListener("click", () => openEditor());
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
    "delete-place",
    "search-query",
    "search-address",
  ];
  resetSearch();
  const wasEditing = editingId !== null;
  saving = true;
  selectedMarker?.dragging.disable();
  controls.forEach((id) => ($(id).disabled = true));
  $("form-status").textContent = "Salvando seu local…";
  try {
    await request(editingId ? `/api/places/${encodeURIComponent(editingId)}` : "/api/places", {
      method: editingId ? "PUT" : "POST",
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
    $("toast").textContent = wasEditing ? "Local atualizado com sucesso." : "Local cadastrado. Obrigado por compartilhar!";
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
function resetSearch() {
  ++searchVersion;geocoder.cancel();
  $("search-address").disabled = false;$("cancel-search").disabled = true;
  $("search-status").textContent = "";$("search-results").replaceChildren();
}
$("address-form").addEventListener("submit",async event => {
  event.preventDefault();if(saving || geocoder.isSearching()) return;
  const version = ++searchVersion;
  $("search-address").disabled = true;$("cancel-search").disabled = false;
  $("search-results").replaceChildren();$("search-status").textContent = "Buscando endereços…";
  try {
    const results = await geocoder.search($("search-query").value);
    if(version !== searchVersion) return;
    $("search-status").textContent = results.length ? "Selecione um endereço e revise a posição antes de salvar." : "Nenhum endereço encontrado.";
    for(const result of results) {
      const li = document.createElement("li"), button = document.createElement("button");
      button.type="button";button.className="place-card";button.textContent=result.label;
      button.addEventListener("click",() => {
        if(saving) return;
        setPosition({lat:result.latitude,lng:result.longitude});
        map.setView([result.latitude,result.longitude],16);
        $("search-status").textContent="Endereço selecionado. Salve para confirmar o local.";
      });
      li.append(button);$("search-results").append(li);
    }
  } catch(error) {
    if(version === searchVersion) $("search-status").textContent=error.message;
  } finally {
    if(version === searchVersion) { $("search-address").disabled=false;$("cancel-search").disabled=true; }
  }
});
$("cancel-search").addEventListener("click",() => { resetSearch();$("search-status").textContent="Busca cancelada."; });
$("delete-place").addEventListener("click",async () => {
  if(saving || !editingId || !window.confirm(`Deseja realmente excluir "${$("name").value}"?`)) return;
  resetSearch();saving=true;selectedMarker?.dragging.disable();
  const controls=["delete-place","save-place","cancel","cancel-top","name","description","use-center","new-place","search-address","search-query"];
  controls.forEach(id => $(id).disabled=true);
  try {
    await request(`/api/places/${encodeURIComponent(editingId)}`,{method:"DELETE",signal:AbortSignal.timeout(15000)});
    closeEditor();activePlace=null;await loadPlaces();
    $("toast").textContent="Local excluído com sucesso.";$("toast").hidden=false;
    clearTimeout(toastTimer);toastTimer=setTimeout(() => $("toast").hidden=true,5000);
  } catch(error) { $("form-status").textContent=error.message; }
  finally { saving=false;selectedMarker?.dragging.enable();controls.forEach(id => $(id).disabled=false); }
});
function activateProximity(radius) {
  proximity = {...userPosition, radius};
  radiusCircle?.remove();
  radiusCircle = L.circle([proximity.latitude,proximity.longitude],{radius,color:"#163d35",weight:1,fillOpacity:0.08,interactive:false}).addTo(map);
  $("leave-nearby").hidden = false;
  $("result-title").textContent = "Perto de você";
  $("places").setAttribute("aria-label","Resultados por proximidade");
  $("nearby-status").textContent = `Buscando até ${formatDistance(radius)} da sua localização. Mover o mapa mantém esse filtro.`;
  map.fitBounds(radiusCircle.getBounds(), {padding:[24,24],maxZoom:16});
  loadPlaces();
}
$("nearby-form").addEventListener("submit",event => {
  event.preventDefault();
  if(!userPosition) { $("nearby-status").textContent = "Use minha localização antes de buscar locais próximos. A posição alternativa do mapa não é usada nesta busca.";return; }
  try { activateProximity(radiusInMeters($("radius-km").value)); }
  catch(error) { $("nearby-status").textContent = error.message; }
});
$("leave-nearby").addEventListener("click",() => {
  proximity=null;radiusCircle?.remove();radiusCircle=null;
  $("leave-nearby").hidden=true;$("nearby-status").textContent="";
  $("result-title").textContent="Na área do mapa";
  $("places").setAttribute("aria-label","Resultados na área visível");
  loadPlaces();
});
loadPlaces();
locate();
