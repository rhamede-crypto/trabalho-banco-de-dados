export function viewportParams(bounds) {
  const normalize = (lng) => ((((lng + 180) % 360) + 360) % 360) - 180;
  const width = bounds.getEast() - bounds.getWest();
  return new URLSearchParams({
    west: width >= 360 ? -180 : normalize(bounds.getWest()),
    east: width >= 360 ? 180 : normalize(bounds.getEast()),
    south: Math.max(-90, bounds.getSouth()),
    north: Math.min(90, bounds.getNorth()),
  });
}
export async function request(path, options = {}) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.error || "Não foi possível concluir a solicitação.");
  return data;
}
