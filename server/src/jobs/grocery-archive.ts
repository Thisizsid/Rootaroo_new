import cron from 'node-cron';
import { Op } from 'sequelize';
import { GroceryItem } from '../database/models';
import logger from '../shared/utils/logger';

/**
 * Archive grocery items that were bought more than 24 hours ago.
 * Runs every hour. Sets archivedAt to the current timestamp.
 */
export function startGroceryArchiveJob(): void {
  cron.schedule('0 * * * *', async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const [count] = await GroceryItem.update(
        { archivedAt: new Date() },
        {
          where: {
            isBought: true,
            boughtAt: { [Op.lte]: cutoff },
            archivedAt: null,
          },
        },
      );

      if (count > 0) {
        logger.info(`[Auto-Archive] Archived ${count} grocery items older than 24h`);
      }
    } catch (err) {
      logger.error('[Auto-Archive] Failed:', err);
    }
  });

  logger.info('[Auto-Archive] Cron job registered — runs every hour');
}
