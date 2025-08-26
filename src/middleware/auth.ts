import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const USERS = [
  { id: '1', username: 'admin', password: 'admin123!', role: 'admin' },
  { id: '2', username: 'alice', password: 'password1', role: 'user' },
];

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function issueToken(username: string, password: string) {
  const u = USERS.find(x => x.username === username && x.password === password);
  if (!u) return null;
  return jwt.sign({ sub: u.id, role: u.role, username: u.username }, SECRET, { expiresIn: '2h' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'unauthenticated', message: 'Missing Bearer token' }});
  }
  try {
    (req as any).user = jwt.verify(hdr.slice(7), SECRET);
    next();
  } catch {
    return res.status(401).json({ error: { code: 'invalid_token', message: 'Invalid token' }});
  }
}
