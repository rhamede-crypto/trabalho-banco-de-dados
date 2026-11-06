import { createApp } from './app.js';
import { pool } from './db.js';
const port = process.env.PORT || 3000;
const server = createApp(pool, Boolean(process.env.DATABASE_URL)).listen(port, () => console.log(`Aplicação iniciada na porta ${port}.`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
