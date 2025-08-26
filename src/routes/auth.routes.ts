import { Router } from 'express';
import { issueToken } from '../middleware/auth';

const r = Router();

r.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const token = issueToken(username, password);
  if (!token) {
    return res.status(401).json({ error: { code: 'bad_credentials', message: 'Invalid username or password' } });
  }
  res.json({ token });
});

export default r;