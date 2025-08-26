import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '../middleware/auth';
import { runPipeline } from '../services/process';

const r = Router();

r.post('/', requireAuth, async (req, res, next) => {
  try {
    const { sourceId = 'seed', ops } = req.body || {};
    if (!Array.isArray(ops) || ops.length === 0) {
      return res.status(400).json({ error: { code: 'bad_request', message: 'Provide ops array' }});
    }
    const id = randomUUID();
    await runPipeline(sourceId, ops, id);
    return res.status(201).json({ id, output: { imageId: id, url: `/v1/images/${id}` } });
  } catch (e) { next(e); }
});

// (stub for now)
r.get('/', requireAuth, async (_req, res) => {
  res.json({ items: [], page: 1, limit: 20, total: 0 });
});

export default r;
