import { Hono } from 'hono';
import type { Env } from '../types';

const tutor = new Hono<{ Bindings: Env }>();

// POST /api/tutor/ask
tutor.post('/ask', async (c) => {
  try {
    const body = await c.req.json();
    const { question, category, context } = body;
    
    if (!question) {
      return c.json({ error: 'Question is required' }, 400);
    }
    
    // Use Cloudflare Workers AI for responses
    try {
      const prompt = `You are a helpful driving instructor assistant for Kenya. 
Category: ${category || 'General'}
${context ? `Context: ${context}` : ''}

Question: ${question}

Provide a clear, concise answer focused on Kenyan driving rules and regulations.`;

      const response = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
        prompt,
        max_tokens: 500,
      });
      
      return c.json({
        answer: response.response || 'I apologize, but I could not generate a response. Please try again.',
        question,
        category: category || 'General'
      });
    } catch (aiError) {
      console.error('AI error:', aiError);
      // Fallback response
      return c.json({
        answer: 'I am currently unable to process your question. Please try again later or consult your driving manual.',
        question,
        category: category || 'General'
      });
    }
  } catch (error) {
    console.error('Tutor ask error:', error);
    return c.json({ error: 'Failed to process question' }, 500);
  }
});

// GET /api/tutor/history/:userId
tutor.get('/history/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM tutor_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(userId).all();
    
    return c.json(results || []);
  } catch (error) {
    console.error('Get tutor history error:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});

export default tutor;
