import cron from 'node-cron';
import { finalizeDueAccountDeletions } from '../modules/auth/service';
import { finalizeDueHouseholdDeletions } from '../modules/household/service';
import logger from '../shared/utils/logger';

/**
 * Finalizes accounts and households whose 30-day deletion grace period has
 * elapsed. Without this, scheduledDeletionAt is inert unless an admin/user
 * happens to call the confirm-deletion endpoint again after the window —
 * nothing previously enforced that the window had to pass, or ran this
 * automatically. Runs hourly, same cadence as the other maintenance jobs.
 */
export function startPurgeScheduledDeletionsJob(): void {
  cron.schedule('0 * * * *', async () => {
    try {
      const households = await finalizeDueHouseholdDeletions();
      if (households > 0) {
        logger.info(`[Purge-Deletions] Finalized ${households} household(s) past their 30-day grace period`);
      }
    } catch (err) {
      logger.error('[Purge-Deletions] Failed to finalize household deletions:', err);
    }

    try {
      const accounts = await finalizeDueAccountDeletions();
      if (accounts > 0) {
        logger.info(`[Purge-Deletions] Finalized ${accounts} account(s) past their 30-day grace period`);
      }
    } catch (err) {
      logger.error('[Purge-Deletions] Failed to finalize account deletions:', err);
    }
  });

  logger.info('[Purge-Deletions] Cron job registered — runs every hour');
}
