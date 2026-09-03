import cron from 'node-cron';
import { Op } from 'sequelize';
import { PingRequest } from '../database/models';
import logger from '../shared/utils/logger';

const PENDING_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Expires ping requests that were never responded to. Previously,
 * 'expired' was only ever set as a side effect of a *different* pending
 * request to the same target being answered (respondToPingRequest) —
 * a ping nobody responds to at all sat in 'pending' forever (F-19).
 */
export function startPingExpiryJob(): void {
  cron.schedule('0 * * * *', async () => {
    try {
      const [count] = await PingRequest.update(
        { status: 'expired', respondedAt: new Date() },
        {
          where: {
            status: 'pending',
            createdAt: { [Op.lte]: new Date(Date.now() - PENDING_TTL_MS) },
          },
        },
      );

      if (count > 0) {
        logger.info(`[Ping-Expiry] Expired ${count} ping request(s) pending over 24h`);
      }
    } catch (err) {
      logger.error('[Ping-Expiry] Failed:', err);
    }
  });

  logger.info('[Ping-Expiry] Cron job registered — runs every hour');
}
