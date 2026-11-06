import express from 'express';
import { fileURLToPath } from 'node:url';
import { number, place, viewport } from './validation.js';
export function createApp(db, configured = true) {
  const app = express();
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', async (req, res) => {
    if (!configured) return res.status(503).json({ error: 'Configure DATABASE_URL e execute npm run db:setup.' });
    try { await db.query('SELECT location FROM places LIMIT 0'); res.json({ status: 'ok' }); }
    catch { res.status(503).json({ error: 'Banco indisponível ou schema não instalado.' }); }
  });
  app.use('/api', (req, res, next) => configured ? next() : res.status(503).json({ error: 'Banco não configurado. Defina DATABASE_URL e execute npm run db:setup.' }));
  const fields = 'id::text, name, description, ST_X(location::geometry) AS longitude, ST_Y(location::geometry) AS latitude';
  const input = (fn) => { try { return fn(); } catch (e) { e.status = 400; throw e; } };
  app.get('/api/places', async (req, res) => {
    let sql, values;
    if (req.query.radius !== undefined) {
      const [lng, lat, radius] = input(() => [number(req.query.longitude, -180, 180), number(req.query.latitude, -90, 90), number(req.query.radius, 1, 50000)]);
      sql = `SELECT ${fields}, ST_Distance(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS distance FROM places WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3) ORDER BY distance, id LIMIT 501`;
      values = [lng, lat, radius];
    } else {
      const {west, east, south, north} = input(() => viewport(req.query));
      sql = `SELECT ${fields} FROM places WHERE ST_Y(location::geometry) BETWEEN $3 AND $4 AND ${west <= east ? 'ST_Intersects(location::geometry, ST_MakeEnvelope($1,$3,$2,$4,4326))' : '(ST_X(location::geometry) >= $1 OR ST_X(location::geometry) <= $2)'} ORDER BY id LIMIT 501`;
      values = [west, east, south, north];
    }
    const { rows } = await db.query(sql, values);
    res.json({ places: rows.slice(0,500), truncated: rows.length > 500 });
  });
  app.post('/api/places', async (req, res) => {
    const values = input(() => place(req.body));
    const {rows} = await db.query(`INSERT INTO places(name,description,location) VALUES($1,$2,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography) RETURNING ${fields}`, values);
    res.status(201).json(rows[0]);
  });
  app.put('/api/places/:id', async (req, res) => {
    const id = input(() => number(req.params.id, 1, Number.MAX_SAFE_INTEGER));
    if (!Number.isInteger(id)) return res.status(400).json({error:'ID inválido.'});
    const values = input(() => place(req.body));
    const {rows} = await db.query(`UPDATE places SET name=$1,description=$2,location=ST_SetSRID(ST_MakePoint($3,$4),4326)::geography WHERE id=$5 RETURNING ${fields}`, [...values,id]);
    res.status(rows.length ? 200 : 404).json(rows[0] ?? {error:'Lugar não encontrado.'});
  });
  app.delete('/api/places/:id', async (req,res) => {
    const id = input(() => number(req.params.id,1,Number.MAX_SAFE_INTEGER));
    if (!Number.isInteger(id)) return res.status(400).json({error:'ID inválido.'});
    const result = await db.query('DELETE FROM places WHERE id=$1',[id]);
    res.status(result.rowCount ? 204 : 404).send(result.rowCount ? undefined : {error:'Lugar não encontrado.'});
  });
  app.use(express.static(fileURLToPath(new URL('../public',import.meta.url))));
  app.use('/api', (req,res) => res.status(404).json({error:'Rota não encontrada.'}));
  app.use((err,req,res,next) => {
    const status = err.status === 400 ? 400 : 503;
    res.status(status).json({error: status === 400 ? err.message : 'Não foi possível acessar o banco de dados.'});
  });
  return app;
}
