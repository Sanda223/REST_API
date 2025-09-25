// src/routes/jobs.routes.ts
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth";
import { runPipelineS3 } from "../services/process";
import { presignUpload, presignDownload } from "../services/s3.service";
import { initStore, addJob, updateJob, listJobs, getJobById, JobRecord } from "../data/jobs.ddb";

const r = Router();

// ensure the JSON store exists on first import
initStore().catch(() => {
  /* best-effort */
});

/**
 * Create a processing job
 * Body: { sourceId?: 'seed' | 'upload', ops: Array }
 * - seed   => uses s3://<bucket>/seed/seed.png and processes immediately
 * - upload => returns a pre-signed PUT URL; job set to waiting_upload
 *
 * Returns:
 *  - seed:   { id, output: { imageId, url } }
 *  - upload: { id, upload: { url, key }, inputKey, outputKey }
 */
r.post("/", requireAuth, async (req, res, next) => {
  try {
    const { sourceId = "seed", ops } = req.body || {};
    if (!Array.isArray(ops) || ops.length === 0) {
      return res
        .status(400)
        .json({ error: { code: "bad_request", message: "Provide ops array" } });
    }

    const id = randomUUID();
    const user = (req as any).user || {};
    const userId = user.sub ?? user.username ?? "unknown";

    // S3 keys we will use for this job
    const inputKey =
      sourceId === "seed"
        ? "seed/seed.png"
        : `users/${userId}/jobs/${id}/input`;
    const outputKey = `users/${userId}/jobs/${id}/output.png`;

    // 1) record the job
    const job: JobRecord = {
      id,
      userId,
      sourceId,
      ops,
      status: sourceId === "seed" ? "processing" : "waiting_upload",
      createdAt: new Date().toISOString(),
      // store S3 keys in your JSON store for now (DynamoDB later)
      inputKey,
      outputKey,
    } as any;
    await addJob(job);

    if (sourceId === "seed") {
      // 2) process immediately using S3 pipeline (reads seed from S3, writes output to S3)
      await runPipelineS3(inputKey, ops, outputKey);

      // 3) mark as done and return a pre-signed download URL
      await updateJob(id, {
        status: "done",
        finishedAt: new Date().toISOString(),
      });

      const downloadUrl = await presignDownload(outputKey);
      return res
        .status(201)
        .json({ id, output: { imageId: id, url: downloadUrl } });
    }

    // For upload flow: hand back a pre-signed PUT URL so the client can upload the original file
    const uploadUrl = await presignUpload(inputKey, "image/png");
    return res.status(201).json({
      id,
      inputKey,
      outputKey,
      upload: { url: uploadUrl, key: inputKey },
      message:
        "Upload your image to the provided URL, then call the processing endpoint when ready.",
    });
  } catch (e) {
    // best-effort: mark as failed if we created an ID above
    try {
      const possibleId = (e as any)?.id ?? undefined;
      if (possibleId) await updateJob(possibleId, { status: "failed" });
    } catch {}
    next(e);
  }
});

/**
 * OPTIONAL: Trigger processing after client upload (for 'upload' flow)
 * POST /:id/process
 */
r.post("/:id/process", requireAuth, async (req, res, next) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: { code: "not_found" } });
    if (job.status !== "waiting_upload" && job.status !== "failed") {
      return res
        .status(400)
        .json({ error: { code: "bad_state", message: `Job is ${job.status}` } });
    }

    await updateJob(job.id, { status: "processing" });
    await runPipelineS3(job.inputKey!, job.ops, job.outputKey!);
    await updateJob(job.id, { status: "done", finishedAt: new Date().toISOString() });

    const downloadUrl = await presignDownload(job.outputKey!);
    res.json({ id: job.id, output: { imageId: job.id, url: downloadUrl } });
  } catch (e) {
    next(e);
  }
});

/**
 * List jobs for the current user (paginated)
 * Query: ?page=1&limit=20
 */
r.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = (req as any).user || {};
    const userId = user.sub ?? user.username ?? "unknown";

    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(String(req.query.limit ?? "20"), 10) || 20, 1),
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
r.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const job = await getJobById(req.params.id);
    if (!job) return res.status(404).json({ error: { code: "not_found" } });
    res.json(job);
  } catch (e) {
    next(e);
  }
});

export default r;