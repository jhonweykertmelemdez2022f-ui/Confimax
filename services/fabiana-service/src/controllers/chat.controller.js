const Groq = require('groq-sdk');
const config = require('../config');

const groq = new Groq({
  apiKey: config.groq.apiKey
});

const chatController = {
  async chat(req, res, next) {
    try {
      // Validar que la API Key esté configurada
      if (!config.groq.apiKey) {
        return res.status(500).json({ 
          error: 'GROQ_API_KEY no está configurada en el servidor',
          details: 'Por favor, configura la variable de entorno GROQ_API_KEY en el servicio Fabiana'
        });
      }

      const { messages, stream = false } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages are required' });
      }

      // Añadir el system prompt al inicio del historial
      const fullMessages = [
        { role: 'system', content: config.systemPrompt },
        ...messages
      ];

      const completion = await groq.chat.completions.create({
        messages: fullMessages,
        model: config.groq.model,
        temperature: 0.7,
        max_tokens: 2048,
        stream
      });

      if (stream) {
        // Streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        // No streaming
        const message = completion.choices[0]?.message?.content || '';
        res.json({ message });
      }
    } catch (error) {
      console.error('[AI Chat Error]:', error.message);
      
      // Manejar errores específicos de la API de Groq si están disponibles
      const status = error.status || 500;
      const message = error.message || 'Error processing your request';
      
      res.status(status).json({
        error: 'Error en el servicio de IA',
        message: message,
        details: config.nodeEnv === 'development' ? error.stack : undefined
      });
    }
  }
};

module.exports = chatController;
