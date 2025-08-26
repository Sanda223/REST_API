import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

type Op =
  | { op: 'resize'; width: number; height: number }
  | { op: 'blur'; sigma: number }
  | { op: 'sharpen'; sigma?: number };

export async function runPipeline(sourceId: string, ops: Op[], outId: string) {
  const inputPath = path.join('storage/originals', `${sourceId}.png`);
  const outputPath = path.join('storage/outputs', `${outId}.png`);

  let img = sharp(inputPath, { failOn: 'none' });
  for (const step of ops) {
    if (step.op === 'resize') img = img.resize(step.width, step.height, { fit: 'fill' });
    if (step.op === 'blur') img = img.blur(step.sigma);
    if (step.op === 'sharpen') img = img.sharpen(step.sigma);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await img.toFile(outputPath);

  return { outputPath };
}
