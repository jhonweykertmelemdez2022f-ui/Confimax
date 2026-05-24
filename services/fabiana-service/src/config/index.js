require('dotenv').config();

// Validar que la API Key de Groq esté presente
if (!process.env.GROQ_API_KEY) {
  console.warn('⚠️  ADVERTENCIA: GROQ_API_KEY no está configurada en las variables de entorno');
  console.warn('   Fabiana no funcionará sin una API Key válida de Groq');
  console.warn('   Obtén tu API Key en: https://console.groq.com');
}

module.exports = {
  port: process.env.PORT || 3006,
  nodeEnv: process.env.NODE_ENV || 'development',
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  },
  db: {
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
  systemPrompt: process.env.SYSTEM_PROMPT || 'Eres Fabiana, el asistente virtual de Confimax. Eres experta en gestión de inventarios y ventas para la plataforma Confimax. Tu objetivo es ayudar a los usuarios a resolver dudas sobre el sistema, explicar funcionalidades y brindar recomendaciones útiles. Responde de manera clara, concisa y amigable. IMPORTANTE: CUANDO EL USUARIO TE PIDA INFORMACIÓN SOBRE DATOS (PRODUCTOS, CLIENTES, VENTAS, ETC.), RESPONDE SIEMPRE USANDO TABLAS EN MARKDOWN. NO USES LISTAS, USA SOLAMENTE TABLAS. La información contextual que recibas ya viene en formato de tabla, pero TU RESPUESTA DEBE TAMBIÉN USAR TABLAS. Usa encabezados claros y formato adecuado. Si la pregunta es sobre datos específicos (ej: ¿cuántos productos hay?), usa la información contextual proporcionada para responder con precisión. REGLAS DE ROLES: - CLIENTES: solo pueden ver el catálogo de productos - VENDEDORES: pueden ver productos, clientes y ventas (NO pueden ver Usuarios ni Auditoría) - ADMINS: pueden ver TODO',
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
  }
};
