import { randomUUID } from "node:crypto";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { IMAGE_EXTENSIONS } from "@/lib/images";

const endpoint = process.env.S3_ENDPOINT;

const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint,
  forcePathStyle: Boolean(endpoint),
});

export async function uploadImage(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function uploadImageFiles(files: File[], folder: string) {
  const keys: string[] = [];
  for (const file of files) {
    keys.push(`${folder}/${randomUUID()}.${IMAGE_EXTENSIONS[file.type]}`);
  }

  await Promise.all(
    files.map(async (file, index) =>
      uploadImage(keys[index], Buffer.from(await file.arrayBuffer()), file.type),
    ),
  );

  return keys;
}

// Orphaned objects are harmless, so a failed cleanup is logged instead of failing the request.
export async function deleteImages(keys: string[]) {
  if (keys.length === 0) {
    return;
  }

  try {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: process.env.S3_BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
  } catch (error) {
    console.error("Failed to delete S3 objects", keys, error);
  }
}

export function imageUrl(key: string) {
  return `${process.env.S3_PUBLIC_URL}/${key}`;
}
