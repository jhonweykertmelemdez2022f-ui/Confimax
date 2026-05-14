module.exports = {
  port: process.env.PORT || 3003,
  db: {
    // Soporte Supabase: usa SUPABASE_DATABASE_URL si existe, luego DATABASE_URL
    url: process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || null,
    host: process.env.SUPABASE_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.SUPABASE_PORT || process.env.POSTGRES_PORT || 5432,
    user: process.env.SUPABASE_USER || process.env.POSTGRES_USER || 'confimax',
    password: process.env.SUPABASE_PASSWORD || process.env.POSTGRES_PASSWORD || 'confimax_pass',
    database: process.env.SUPABASE_DB || process.env.POSTGRES_DB || 'confimax',
    ssl: process.env.SUPABASE_SSL === 'true' || process.env.POSTGRES_SSL === 'true' ||
      (process.env.SUPABASE_HOST || process.env.POSTGRES_HOST || '').includes('supabase.co')
      ? { rejectUnauthorized: false }
      : false,
  },
  redis: {
    // Soporte Upstash: usa UPSTASH_REDIS_URL si existe, luego REDIS_URL
    url: process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || null,
    host: process.env.UPSTASH_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: process.env.UPSTASH_REDIS_PORT || process.env.REDIS_PORT || 6379,
    password: process.env.UPSTASH_REDIS_PASSWORD || process.env.REDIS_PASSWORD || null,
  },
  currencies: {
    default: 'VES',
    supported: ['USD', 'VES', 'COP'],
  },
  exchangeRates: {
    default: {
      USD: 1,
      VES: 35.50,
      COP: 3950,
    },
  },
  tax: {
    iva: 0.16,
  },
};
