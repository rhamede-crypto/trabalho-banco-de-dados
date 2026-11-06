export function number(value, min, max) {
  if (value === undefined || value === null || String(value).trim() === '') throw new Error('Número obrigatório.');
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`Número deve estar entre ${min} e ${max}.`);
  return n;
}
export function place(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  if (!name || name.length > 120 || description.length > 2000) throw new Error('Informe nome de até 120 caracteres e descrição de até 2000.');
  return [name, description, number(body.longitude, -180, 180), number(body.latitude, -90, 90)];
}
export function viewport(query) {
  const west = number(query.west, -180, 180), east = number(query.east, -180, 180);
  const south = number(query.south, -90, 90), north = number(query.north, -90, 90);
  if (south > north) throw new Error('Área do mapa inválida.');
  return { west, east, south, north };
}
