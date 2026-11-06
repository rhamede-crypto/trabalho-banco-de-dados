import { readFile } from 'node:fs/promises';
import { pool } from './db.js';
if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL no arquivo .env.');
try {
  await pool.query(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  console.log('PostGIS e tabela places preparados.');
} finally { await pool.end(); }
