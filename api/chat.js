// Vercel serverless function: POST /api/chat
import { answerChat } from '../server/chat.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const result = await answerChat({ messages: body.messages, userName: body.userName });
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error('Chat error:', err);
    res.statusCode = err.expose ? err.status : 500;
    const message = err.expose ? err.message : 'The assistant ran into a problem. Please try again.';
    res.end(JSON.stringify({ error: message }));
  }
}
