const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Jackwell2019*2424@db.tlrliqbgtdplwdvbxqxv.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkUser() {
  try {
    await client.connect();
    console.log('✅ Conectado a Supabase...\n');

    // 1. Buscar en auth.users (Supabase Auth)
    const authResult = await client.query(`
      SELECT 
        id, 
        email, 
        created_at, 
        last_sign_in_at, 
        raw_user_meta_data
      FROM auth.users 
      WHERE 
        email ILIKE '%jackson%' 
        OR raw_user_meta_data::text ILIKE '%jackson%'
    `);
    
    console.log('=== 🔐 auth.users (Supabase Auth) ===');
    if (authResult.rows.length === 0) {
      console.log('❌ No se encontró ningún usuario con "jackson" en auth.users\n');
    } else {
      console.log(`✅ Encontrado(s) ${authResult.rows.length} usuario(s):`);
      authResult.rows.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    }

    // 2. Listar tablas de usuarios en schema public
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name ILIKE '%user%'
    `);
    
    console.log('\n=== 📋 Tablas de usuarios (public schema) ===');
    if (tables.rows.length === 0) {
      console.log('No hay tablas con "user" en el schema public');
    } else {
      console.log('Tablas encontradas:', tables.rows.map(r => r.table_name));

      // Buscar en cada tabla
      for (const tableRow of tables.rows) {
        const tableName = tableRow.table_name;
        
        // Obtener columnas de la tabla
        const cols = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);
        
        const colNames = cols.rows.map(c => c.column_name);
        const searchCols = colNames.filter(c => ['username', 'name', 'email', 'user_name'].includes(c.toLowerCase()));
        
        if (searchCols.length > 0) {
          const whereClause = searchCols.map(c => `"${c}"::text ILIKE '%jackson%'`).join(' OR ');
          const result = await client.query(`SELECT * FROM public."${tableName}" WHERE ${whereClause}`);
          
          console.log(`\n--- Tabla: ${tableName} ---`);
          if (result.rows.length === 0) {
            console.log('❌ No encontrado');
          } else {
            console.log(`✅ ${result.rows.length} resultado(s):`);
            result.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
          }
        }
      }
    }

    // 3. Buscar en tabla 'users' directamente si existe
    try {
      const usersResult = await client.query(`
        SELECT * FROM public.users 
        WHERE username ILIKE '%jackson%' 
           OR email ILIKE '%jackson%' 
           OR name ILIKE '%jackson%'
        LIMIT 10
      `);
      console.log('\n=== 👤 Tabla public.users ===');
      if (usersResult.rows.length === 0) {
        console.log('❌ No se encontró "jackson" en public.users');
      } else {
        console.log(`✅ ${usersResult.rows.length} resultado(s):`);
        usersResult.rows.forEach(row => console.log(JSON.stringify(row, null, 2)));
      }
    } catch (e) {
      console.log('\n⚠️  La tabla public.users no existe o no tiene esas columnas');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

checkUser();
