const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'confimax',
  password: 'confimax_pass',
  database: 'confimax',
  ssl: false
});

async function checkUser() {
  try {
    await client.connect();
    console.log('✅ Conectado a Postgres LOCAL...\n');

    // 1. Buscar en auth.users
    try {
      const authResult = await client.query(`
        SELECT id, username, email, role, active, created_at 
        FROM auth.users 
        WHERE username ILIKE '%jackson%' OR email ILIKE '%jackson%'
      `);
      
      console.log('=== 🔐 auth.users (Local) ===');
      if (authResult.rows.length === 0) {
        console.log('❌ No se encontró ningún usuario con "jackson" en auth.users local\n');
      } else {
        console.log(`✅ Encontrado(s) ${authResult.rows.length} usuario(s):`);
        authResult.rows.forEach(row => {
          console.log(JSON.stringify(row, null, 2));
        });
      }
    } catch(e) {
      console.log('❌ Error buscando en auth.users:', e.message);
    }

    // 2. Buscar en public.users
    try {
      const pubResult = await client.query(`
        SELECT id, username, email, role, active, created_at 
        FROM public.users 
        WHERE username ILIKE '%jackson%' OR email ILIKE '%jackson%'
      `);
      
      console.log('\n=== 👤 public.users (Local) ===');
      if (pubResult.rows.length === 0) {
        console.log('❌ No se encontró "jackson" en public.users local');
      } else {
        console.log(`✅ Encontrado(s) ${pubResult.rows.length} usuario(s):`);
        pubResult.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
      }
    } catch (e) {
      console.log('❌ Error buscando en public.users:', e.message);
    }

  } catch (err) {
    console.error('❌ Error de conexión general:', err.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

checkUser();
