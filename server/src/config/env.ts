import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  fcm: {
    enabled: process.env.FCM_ENABLED === 'true',
    serverKey: process.env.FCM_SERVER_KEY || '',
    projectId: process.env.FCM_PROJECT_ID || '',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'rootaroo_dev',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
  },

  apple: {
    bundleId: process.env.APPLE_BUNDLE_ID || 'com.rootaroo.app',
  },

  sns: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },

  s3: {
    // No fallback default here — an empty/unset S3_ENDPOINT must mean "use
    // real AWS S3" (config/s3.ts treats a falsy endpoint as "let the SDK
    // resolve it"), not silently redirect to a local MinIO instance that
    // won't exist in production. Local dev sets S3_ENDPOINT explicitly in
    // its own .env instead of relying on a code-level default.
    endpoint: process.env.S3_ENDPOINT || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'rootaroo-dev',
    region: process.env.S3_REGION || 'us-east-1',
    useSsl: process.env.S3_USE_SSL === 'true',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@rootaroo.com',
  },

  sentryDsn: process.env.SENTRY_DSN || '',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  logLevel: process.env.LOG_LEVEL || 'debug',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
};

// The JWT/S3 fallbacks above exist purely for local dev convenience. In
// production they must never be reachable — a well-known 'dev-access-secret'
// or 'minioadmin' credential live in prod is a full auth/storage bypass, and
// silently booting on them (rather than refusing to start) is the actual bug
// this closes. Checked here, at import time, so it runs before anything else
// in the app does.
if (env.nodeEnv === 'production') {
  const missing = [
    !process.env.JWT_ACCESS_SECRET && 'JWT_ACCESS_SECRET',
    !process.env.S3_ACCESS_KEY_ID && 'S3_ACCESS_KEY_ID',
    !process.env.S3_SECRET_ACCESS_KEY && 'S3_SECRET_ACCESS_KEY',
  ].filter(Boolean);

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`FATAL: refusing to start in production without required secrets: ${missing.join(', ')}`);
    process.exit(1);
  }
}
