import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
const QUT_USERNAME = process.env.QUT_USERNAME!;
const TABLE = process.env.DDB_TABLE || "a2-n11594128-imgproc-jobs";

export type JobStatus = 'waiting_upload' | 'processing' | 'done' | 'failed';

export interface JobRecord {
  id: string;
  userId: string;
  sourceId: string;
  ops: any[];
  status: JobStatus;
  createdAt: string;
  finishedAt?: string;
  inputKey?: string;
  outputKey?: string;
  outputPath?: string;
}

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

// Helper: build sort key so we can query per user quickly
function skFor(userId: string, jobId: string) {
  return `user#${userId}#job#${jobId}`;
}

// Keep the same API as jobs.store.ts

export async function initStore() {
  // no-op for Dynamo
}

export async function addJob(job: JobRecord) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      "qut-username": QUT_USERNAME,   // required by unit permissions
      sk: skFor(job.userId, job.id),  // sort key encodes user + job
      // attributes
      ...job,
    }
  }));
}

export async function updateJob(id: string, patch: Partial<JobRecord>) {
  // Need userId to compute SK; store userId in patch or fetch it first
  const current = await getJobById(id);
  if (!current) return;

  const updates: Record<string, any> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) updates[k] = v;
  }
  const setExpr = Object.keys(updates).map((k, i) => `#k${i} = :v${i}`).join(", ");
  const exprAttrNames = Object.keys(updates).reduce((acc, k, i) => ({ ...acc, [`#k${i}`]: k }), {} as any);
  const exprAttrValues = Object.values(updates).reduce((acc, v, i) => ({ ...acc, [`:v${i}`]: v }), {} as any);

  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { "qut-username": QUT_USERNAME, sk: skFor(current.userId, id) },
    UpdateExpression: `SET ${setExpr}`,
    ExpressionAttributeNames: exprAttrNames,
    ExpressionAttributeValues: exprAttrValues,
  }));
}

export async function getJobById(id: string): Promise<JobRecord | undefined> {
  // We don’t know userId → query begins_with by job id suffix
  // (Cheaper alternative: store a small "idIndex" item; but this keeps it simple.)
  const q = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "qut-username", "#sk": "sk" },
    ExpressionAttributeValues: {
      ":pk": QUT_USERNAME,
      ":prefix": "#job#" + id, // ensure we match the tail
    },
  }));
  // If above is too strict, we can scan user buckets; simpler approach:
  // query all jobs for the student and find the one with id === requested
  const wide = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: { "#pk": "qut-username" },
    ExpressionAttributeValues: { ":pk": QUT_USERNAME },
  }));
  const item = (wide.Items || []).find((it: any) => it.id === id);
  return item as JobRecord | undefined;
}

export async function listJobs(userId: string, page = 1, limit = 20) {
  // Query all jobs for this user via begins_with on SK
  const prefix = `user#${userId}#job#`;
  const q = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "qut-username", "#sk": "sk" },
    ExpressionAttributeValues: { ":pk": QUT_USERNAME, ":prefix": prefix },
  }));

  const all = (q.Items || []) as JobRecord[];
  const total = all.length;
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);
  return { items, total };
}