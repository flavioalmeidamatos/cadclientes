import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sqlPath = path.join(rootDir, 'database', 'init_supabase.sql');

const host = process.env.SUPABASE_DB_HOST;
const database = process.env.SUPABASE_DB_NAME || 'postgres';
const user = process.env.SUPABASE_DB_USER || 'postgres';
const password = process.env.SUPABASE_DB_PASSWORD;
const port = Number(process.env.SUPABASE_DB_PORT || '5432');

if (!host || !password) {
  throw new Error('Missing SUPABASE_DB_HOST or SUPABASE_DB_PASSWORD');
}

const sql = await fs.readFile(sqlPath, 'utf8');

const client = new Client({
  host,
  database,
  user,
  password,
  port,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query(sql);

  const tableCheck = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('usuarios', 'clientes')
    order by table_name
  `);

  const bucketCheck = await client.query(`
    select id
    from storage.buckets
    where id in ('avatars', 'client-avatars')
    order by id
  `);

  console.log('Tables:', tableCheck.rows.map((row) => row.table_name).join(', '));
  console.log('Buckets:', bucketCheck.rows.map((row) => row.id).join(', '));
} finally {
  await client.end();
}
