const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

let databaseUrl = '';
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let val = parts.slice(1).join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (key === 'DATABASE_URL') {
            databaseUrl = val;
          }
        }
      }
    });
  }
} catch (err) {}

const defaultUrl = 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres';
const finalUrl = databaseUrl || defaultUrl;

const client = new Client({
  connectionString: finalUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('🔗 Conectado.');
  
  // Agregar columna expiration_date
  console.log('⏳ Creando columna expiration_date en inventory.products...');
  await client.query(`
    ALTER TABLE inventory.products 
    ADD COLUMN IF NOT EXISTS expiration_date DATE;
  `);
  console.log('✅ Columna expiration_date creada exitosamente.');

  // Crear índice si no existe
  console.log('⏳ Creando índice idx_products_expiration...');
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_products_expiration 
    ON inventory.products(expiration_date);
  `);
  console.log('✅ Índice idx_products_expiration creado exitosamente.');
  
  await client.end();
}

main().catch(console.error);
