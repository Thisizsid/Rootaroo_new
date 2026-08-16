import cron from 'node-cron';
import logger from '../shared/utils/logger';
import { notifyUpcomingEvents } from '../modules/calendar/service';

/**
 * FR-186: Push notification for events starting within 1 hour.
 * Runs every 15 minutes; the service scans events starting in [now, now+1h]
 * and notifies the whole household. Idempotent per window by design —
 * repeated runs inside the same hour may re-notify; acceptable for P0,
 * and dedupe can be added later via a `last_notified_at` column.
 */
export function startEventReminderJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const sent = await notifyUpcomingEvents();
      if (sent > 0) {
        logger.info(`[Event Reminder] Sent ${sent} upcoming-event notification(s)`);
      }
    } catch (err) {
      logger.error('[Event Reminder] Failed:', err);
    }
  });

  logger.info('[Event Reminder] Cron job registered — runs every 15 minutes');
}
