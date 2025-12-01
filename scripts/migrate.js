// scripts/migrate.js
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { pool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSqlFile(relative) {
  const fullPath = path.join(__dirname, '..', relative);
  const sql = await fs.readFile(fullPath, 'utf8');
  console.log(`\nApplying: ${relative}`);
  await pool.query(sql);
  console.log(`Applied: ${relative}`);
}

async function main() {
  try {
    console.log('Starting migrations using environment:', {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      user: process.env.PGUSER,
      database: process.env.PGDATABASE,
    });

    await runSqlFile('database/users_table.sql');
    await runSqlFile('database/recipe_table.sql');
    await runSqlFile('database/ratings_table.sql');

    console.log('\nAll migrations applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err?.message || err);
    process.exit(1);
  }
}

main();
