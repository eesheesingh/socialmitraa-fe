require('dotenv/config');
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  const client = new Client({ connectionString });
  await client.connect();

  const { rows: tables } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  console.log('Found', tables.length, 'tables');

  for (const t of tables) {
    await client.query('DROP TABLE IF EXISTS "' + t.tablename + '" CASCADE');
    console.log('Dropped:', t.tablename);
  }

  await client.end();
  console.log('All tables dropped successfully');
}

main().catch(e => { console.error(e.message); process.exit(1); });
