import cron from 'node-cron';
import { CalendarSyncState } from '../database/models';
import { syncUserCalendar } from '../modules/calendar/service';
import logger from '../shared/utils/logger';

/**
 * Two-way Google Calendar sync — pulls each connected user's Google events
 * in and pushes their not-yet-synced Rootaroo events out. Runs every 15
 * minutes, same cadence as the event-reminder job.
 */
export function startCalendarSyncJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    const states = await CalendarSyncState.findAll({ where: { isActive: true }, attributes: ['userId'] });
    for (const state of states) {
      try {
        await syncUserCalendar(state.userId);
      } catch (err) {
        logger.error(`[Calendar Sync] Failed for user ${state.userId}:`, err);
      }
    }
    if (states.length > 0) {
      logger.info(`[Calendar Sync] Synced ${states.length} connected Google Calendar(s)`);
    }
  });

  logger.info('[Calendar Sync] Cron job registered — runs every 15 minutes');
}
