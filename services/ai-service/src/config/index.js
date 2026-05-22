require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3006,
  nodeEnv: process.env.NODE_ENV || 'development',
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama3-8b-8192'
  },
  systemPrompt: process.env.SYSTEM_PROMPT || 'Eres Confimax AI, un asistente virtual experto en gestión de inventarios y ventas.',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};
