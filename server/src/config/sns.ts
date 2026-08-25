import { SNSClient } from '@aws-sdk/client-sns';
import { env } from './env';

export const snsClient = new SNSClient({
  region: env.sns.region,
  credentials: {
    accessKeyId: env.sns.accessKeyId,
    secretAccessKey: env.sns.secretAccessKey,
  },
});
