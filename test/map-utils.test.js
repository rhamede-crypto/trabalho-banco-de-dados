import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildViewportQuery, createRequestLock, geolocationMessage } from '../public/map-utils.js';

test('buildViewportQuery serializa limites visíveis do mapa', () => {
  const query = buildViewportQuery({
    getWest: () => -38.5432199,
    getEast: () => -38.501,
    getSouth: () => -3.8123456,
    getNorth: () => -3.7000049
  });

  assert.equal(query, '/api/places?west=-38.543220&east=-38.501000&south=-3.812346&north=-3.700005');
});

test('createRequestLock cancela consulta anterior e detecta requisição atual', () => {
  const lock = createRequestLock();
  const first = lock.next();
  assert.equal(lock.isCurrent(first.id), true);
  assert.equal(first.signal.aborted, false);

  const second = lock.next();
  assert.equal(first.signal.aborted, true);
  assert.equal(lock.isCurrent(first.id), false);
  assert.equal(lock.isCurrent(second.id), true);
});

test('geolocationMessage informa fallback para diferentes falhas', () => {
  assert.match(geolocationMessage(1, true), /Permissão de geolocalização negada/);
  assert.match(geolocationMessage(3, true), /tempo limite/);
  assert.match(geolocationMessage(2, true), /indisponível/);
  assert.match(geolocationMessage(0, false), /exige HTTPS/);
});
