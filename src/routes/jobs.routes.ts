// src/routes/jobs.routes.ts
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '../middleware/auth';
import { runPipeline } from '../services/process';
import {
  initStore,
  addJob,
  updateJob,
  listJobs,
  getJobById,
  JobRecord,
} from '../data/jobs.store';

const r = Router();

// ensure the JSON store exists on first import
initStore().catch(() => { /* best-effort */ });

/**
 * Create a processing job
 * Body: { sourceId?: 'seed' | string, ops: Array }
 * Returns: { id, output: { imageId, url } }
 */
r.post('/', requireAuth, async (req, res, next) => {
  let jobId: string | undefined;
  try {
    const { sourceId = 'seed', ops } = req.body || {};
    if (!Array.isArray(ops) || ops.length === 0) {
      return res.status(400).json({ error: { code: 'bad_request', message: 'Provide ops array' } });
    }

    const id = randomUUID();
    jobId = id;
    const user = (req as any).user || {};
    const userId = user.sub ?? user.username ?? 'unknown';

    // 1) record the job as "processing"
    const job: JobRecord = {
      id,
      userId,
      sourceId,
      ops,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    await addJob(job);

    // 2) run the CPU-intensive pipeline
    const { outputPath } = await runPipeline(sourceId, ops, id);

    // 3) mark as done and store output path
    await updateJob(id, {
      status: 'done',
      finishedAt: new Date().toISOString(),
      outputPath,
    });

    return res
      .status(201)
      .json({ id, output: { imageId: id, url: `/v1/images/${id}` } });
  } catch (e) {
    // best-effort: mark as failed if we created an ID above
    const failedId = jobId ?? (e as any)?.id ?? undefined;
    if (failedId) {
      await updateJob(failedId, {
        status: 'failed',
        finishedAt: new Date().toISOString(),
      }).catch(() => {});
    }
    next(e);
  }
});

/**
 * List jobs for the current user (paginated)
 * Query: ?page=1&limit=20
 */
r.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = (req as any).user || {};
    const userId = user.sub ?? user.username ?? 'unknown';

    const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1),
      100
    );

    const { items, total } = await listJobs(userId, page, limit);
    res.json({ items, page, limit, total });
  } catch (e) {
    next(e);
  }
});

/**
 * Get a single job by id
 */
r.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: { code: 'not_found' } });
    res.json(job);
  } catch (e) {
    next(e);
  }
});

export default r;
