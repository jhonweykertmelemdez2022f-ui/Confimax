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
  
  // Buscar la estructura de la tabla products en todos los esquemas
  const res = await client.query(`
    SELECT table_schema, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'products'
    ORDER BY table_schema, ordinal_position;
  `);
  
  console.log('\n📋 COLUMNAS DE LA TABLA products ENCONTRADAS:');
  if (res.rows.length === 0) {
    console.log('   ❌ No se encontró ninguna tabla llamada "products".');
  } else {
    res.rows.forEach(r => {
      console.log(`   * [${r.table_schema}.products] -> Columna: "${r.column_name}" | Tipo: ${r.data_type} | Nullable: ${r.is_nullable}`);
    });
  }
  
  await client.end();
}

main().catch(console.error);
