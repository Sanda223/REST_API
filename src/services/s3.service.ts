import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || "ap-southeast-2";
export const S3_BUCKET = process.env.S3_BUCKET || "";

export const s3 = new S3Client({ region: REGION });

export async function presignUpload(key: string, contentType = "application/octet-stream") {
  const cmd = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 min
}

export async function presignDownload(key: string) {
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}