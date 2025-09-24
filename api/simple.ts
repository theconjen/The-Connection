import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Simple test endpoint
  if (req.url === '/api/simple') {
    return res.status(200).json({ 
      message: 'API is working!', 
      timestamp: new Date().toISOString(),
      method: req.method 
    });
  }
  
  // Health check
  if (req.url === '/api/health') {
    return res.status(200).json({ status: 'healthy' });
  }
  
  return res.status(404).json({ error: 'Not found' });
}