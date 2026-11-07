import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGeocodeClient, createRequestLock } from '../public/app.js';

test('busca permite cancelamento explícito', async () => {
  let aborted = false;
  const client = createGeocodeClient({
    fetchImpl: (_url, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        aborted = true;
        const error = new Error('Abortado');
        error.name = 'AbortError';
        reject(error);
      });
    }),
    now: () => 2000
  });

  const promise = client.search('Fortaleza CE');
  assert.equal(client.cancel(), true);
  await assert.rejects(promise, /Busca cancelada/);
  assert.equal(aborted, true);
});

test('busca retorna vazio quando serviço não encontra resultados', async () => {
  const client = createGeocodeClient({
    fetchImpl: async () => ({ ok: true, async json() { return []; } }),
    now: () => 2000
  });
  const results = await client.search('sem resultado');
  assert.deepEqual(results, []);
});

test('busca transforma falha de rede em erro compreensível', async () => {
  const client = createGeocodeClient({
    fetchImpl: async () => { throw new Error('socket hang up'); },
    now: () => 2000
  });
  await assert.rejects(client.search('Fortaleza CE'), /socket hang up/);
});

test('lock evita duplo envio concorrente', async () => {
  const lock = createRequestLock();
  let release;
  const first = lock.run(() => new Promise(resolve => { release = resolve; }));
  const second = await lock.run(async () => 'segundo');

  assert.equal(second.skipped, true);
  release('primeiro');

  const firstResult = await first;
  assert.equal(firstResult.skipped, false);
  assert.equal(firstResult.value, 'primeiro');
});
