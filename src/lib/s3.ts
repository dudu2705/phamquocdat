import { randomUUID } from "node:crypto";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IMAGE_EXTENSIONS } from "@/lib/images";
import { DOWNLOAD_URL_TTL_SECONDS } from "@/lib/orders";

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

// Purchasable original files. Kept in their own (non-public) bucket, unlike
// product photos: a download URL is only ever handed out to a paying
// customer, and only as a short-lived presigned link.
export async function uploadDownloadFile(file: File) {
  const key = `downloads/${randomUUID()}-${file.name}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_DOWNLOADS_BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || "application/octet-stream",
    }),
  );
  return key;
}

export async function deleteDownloadFiles(keys: string[]) {
  if (keys.length === 0) {
    return;
  }

  try {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: process.env.S3_DOWNLOADS_BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
  } catch (error) {
    console.error("Failed to delete S3 download objects", keys, error);
  }
}

// Re-checked and freshly signed on every download, so access can't outlive
// the entitlement check that produced it.
export async function getDownloadUrl(key: string, filename: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: process.env.S3_DOWNLOADS_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename.replace(/"/g, "")}"`,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
}
