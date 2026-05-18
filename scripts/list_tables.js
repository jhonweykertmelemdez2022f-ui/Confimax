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
  
  // Listar todas las tablas
  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name;
  `);
  
  console.log('\n📋 TABLAS ENCONTRADAS EN LA BASE DE DATOS:');
  res.rows.forEach(r => {
    console.log(`   * ${r.table_schema}.${r.table_name}`);
  });

  // Mostrar search_path actual
  const sp = await client.query('SHOW search_path;');
  console.log(`\n🔍 search_path actual: "${sp.rows[0].search_path}"`);
  
  await client.end();
}

main().catch(console.error);
