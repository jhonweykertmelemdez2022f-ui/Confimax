const fs = require('fs');
const path = require('path');

// 1. Manual parsing of the .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*["']?(.*?)["']?\s*$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const databaseUrl = env.DATABASE_URL;

// 2. Load pg from the backend node_modules
const pgPath = path.join(__dirname, '../services/backend/node_modules/pg');
const { Pool } = require(pgPath);

async function main() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const { rows } = await pool.query('SELECT id, name, sku, stock_quantity, unit_price FROM public.products ORDER BY sku');
    console.log(`\nFound ${rows.length} products in public.products:\n`);
    rows.forEach(p => {
      console.log(`- [${p.sku}] ${p.name} | Stock: ${p.stock_quantity} | Price: $${p.unit_price}`);
    });
  } catch (err) {
    console.error('Database query failed:', err.message);
  } finally {
    await pool.end();
  }
}

main();
