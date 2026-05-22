const Groq = require('groq-sdk');
const config = require('../config');

const groq = new Groq({
  apiKey: config.groq.apiKey,
  baseURL: config.groq.baseURL
});

const chatController = {
  async chat(req, res, next) {
    try {
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
      res.status(500).json({
        error: 'Error processing your request',
        details: config.nodeEnv === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = chatController;
