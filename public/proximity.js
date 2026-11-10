export function radiusInMeters(value) {
  if (String(value).trim() === "") throw new Error("Informe um raio entre 0,001 e 50 km.");
  const meters = Number(value) * 1000;
  if (!Number.isFinite(meters) || meters < 1 || meters > 50000)
    throw new Error("Informe um raio entre 0,001 e 50 km.");
  return meters;
}
export function proximityQuery(position, radius) {
  return "/api/places?" + new URLSearchParams({longitude:position.longitude,latitude:position.latitude,radius});
}
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString("pt-BR", {maximumFractionDigits:1})} km`;
}
