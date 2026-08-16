import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { env } from './env';

const s3Config: S3ClientConfig = {
  region: env.s3.region || 'auto',
  endpoint: env.s3.endpoint || undefined,
  forcePathStyle: !!env.s3.endpoint,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
};

export const s3Client = new S3Client(s3Config);
export const S3_BUCKET = env.s3.bucket;
