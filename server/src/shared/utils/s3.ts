import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl as presign } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { s3Client, S3_BUCKET } from '../../config/s3';
import logger from './logger';

const SIGNED_URL_TTL_SECONDS = 3600;

export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  contentType?: string,
  extension?: string,
): Promise<{ key: string }> {
  const key = `${folder}/${randomUUID()}${extension ? `.${extension.replace(/^\./, '')}` : ''}`;
  try {
    const upload = new Upload({
      client: s3Client,
      params: { Bucket: S3_BUCKET, Key: key, Body: buffer, ContentType: contentType },
    });
    await upload.done();
    return { key };
  } catch (error) {
    logger.error('[S3] Upload failed:', (error as Error).message);
    throw error;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

/**
 * Turns a stored S3 key into a time-limited signed GET URL. Pass-through
 * null/undefined for unset fields, and pass through anything that's already
 * a full URL unchanged — some fields (e.g. `User.avatarUrl` for Google
 * sign-ins) store an external URL we don't own, not an S3 key, and signing
 * that would produce a broken link.
 */
export async function getSignedUrl(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  return presign(s3Client, new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
