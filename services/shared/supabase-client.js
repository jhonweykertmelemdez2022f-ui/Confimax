/**
 * Cliente oficial de Supabase para features específicos
 * Auth, Storage, Realtime, etc.
 * 
 * Requiere: npm install @supabase/supabase-js
 * 
 * Uso:
 *   const supabase = require('../shared/supabase-client');
 *   const { data, error } = await supabase.from('products').select('*');
 */

let supabase = null;

const getSupabaseClient = () => {
  if (supabase) return supabase;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Variables SUPABASE_URL o SUPABASE_SERVICE_KEY no configuradas');
    return null;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });
    return supabase;
  } catch (err) {
    console.error('Error creando cliente Supabase:', err.message);
    return null;
  }
};

/**
 * Verificar si Supabase está configurado
 */
const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY));
};

module.exports = {
  getSupabaseClient,
  isSupabaseConfigured,
};
