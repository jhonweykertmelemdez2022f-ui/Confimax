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
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const dateStr = threeDaysFromNow.toISOString().split('T')[0];

    console.log(`Setting expiration_date to ${dateStr} for product CFX-HAR-001...`);
    
    // Update both tables just in case, though public.products is likely what the API uses if it's based on the older schema
    await pool.query('UPDATE public.products SET expiration_date = $1 WHERE sku = $2', [dateStr, 'CFX-HAR-001']);
    await pool.query('UPDATE inventory.products SET expiration_date = $1 WHERE sku = $2', [dateStr, 'CFX-HAR-001']);
    
    console.log('Successfully updated product expiration date.');
    
    const { rows } = await pool.query('SELECT sku, name, expiration_date FROM public.products WHERE sku = $1', ['CFX-HAR-001']);
    console.log('Verification:', rows[0]);

  } catch (err) {
    console.error('Database update failed:', err.message);
  } finally {
    await pool.end();
  }
}

main();
