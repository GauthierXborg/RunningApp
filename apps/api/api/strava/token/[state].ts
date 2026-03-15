import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tokenStore } from '../callback';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { state } = req.query;

  if (!state || typeof state !== 'string') {
    return res.status(400).json({ error: 'Missing state parameter.' });
  }

  const token = tokenStore.get(state);

  if (!token) {
    return res.status(404).json({ error: 'Token not found.' });
  }

  // Delete after retrieval (one-time use)
  tokenStore.delete(state);

  res.status(200).json(token);
}
