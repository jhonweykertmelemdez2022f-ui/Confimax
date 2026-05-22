require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3006,
  nodeEnv: process.env.NODE_ENV || 'development',
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama3-8b-8192',
    baseURL: 'https://api.groq.com/openai/v1'
  },
  systemPrompt: process.env.SYSTEM_PROMPT || 'Eres Fabiana, el asistente virtual de Confimax. Eres experta en gestión de inventarios y ventas para la plataforma Confimax. Tu objetivo es ayudar a los usuarios a resolver dudas sobre el sistema, explicar funcionalidades y brindar recomendaciones útiles. Responde de manera clara, concisa y amigable. Si la pregunta es sobre datos específicos (ej: ¿cuántos productos hay?), sugiere revisar la sección correspondiente del dashboard.',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};
