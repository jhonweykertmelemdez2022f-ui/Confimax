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
  systemPrompt: process.env.SYSTEM_PROMPT || 'Eres Fabiana, el asistente virtual de Confimax. Eres experta en gestión de inventarios y ventas para la plataforma Confimax. Tu objetivo es ayudar a los usuarios a resolver dudas sobre el sistema, explicar funcionalidades y brindar recomendaciones útiles. Responde de manera clara, concisa y amigable. Si la pregunta es sobre datos específicos (ej: ¿cuántos productos hay?), sugiere revisar la sección correspondiente del dashboard.',
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
  }
};
