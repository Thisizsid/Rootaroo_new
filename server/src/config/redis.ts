import Redis from 'ioredis';
import { env } from './env';

const redis = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  // Keep retrying forever with capped backoff — Redis is used for
  // best-effort caching/rate-limiting, not a hard dependency. Returning
  // `null` here (give up permanently) makes the client transition to a
  // closed state where every subsequent command rejects; on Node 20+ an
  // unhandled rejection from one of those (e.g. from rate-limit-redis)
  // crashes the whole process instead of just degrading.
  retryStrategy(times) {
    return Math.min(times * 500, 10_000);
  },
  // Don't let commands queue up and time out for minutes while Redis is
  // down — fail fast so callers (e.g. the rate limiter) can catch and
  // fall back instead of hanging.
  maxRetriesPerRequest: 1,
});

let hasWarnedDown = false;

redis.on('connect', () => {
  hasWarnedDown = false;
  console.log('✓ Redis connection established.');
});

redis.on('error', (err) => {
  // ioredis retries in the background regardless; avoid log-spamming once
  // we've already told the operator Redis is unreachable.
  if (!hasWarnedDown) {
    console.error('✗ Redis connection error (will keep retrying in the background):', err.message);
    hasWarnedDown = true;
  }
});

export default redis;
