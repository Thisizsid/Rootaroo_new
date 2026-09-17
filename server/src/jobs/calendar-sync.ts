import cron from 'node-cron';
import { CalendarSyncState } from '../database/models';
import { syncUserCalendar, syncAppleUserCalendar } from '../modules/calendar/service';
import logger from '../shared/utils/logger';

/**
 * Two-way calendar sync — pulls each connected user's Google/Apple events in
 * and pushes their not-yet-synced Rootaroo events out. Runs every 15
 * minutes, same cadence as the event-reminder job. Outlook isn't polled
 * here — it's a one-way ICS subscription feed Outlook fetches on its own
 * schedule (see modules/calendar/feedRoutes.ts).
 */
export function startCalendarSyncJob(): void {
  cron.schedule('*/15 * * * *', async () => {
    const states = await CalendarSyncState.findAll({
      where: { isActive: true, provider: ['google', 'apple'] },
      attributes: ['userId', 'provider'],
    });
    for (const state of states) {
      try {
        if (state.provider === 'google') await syncUserCalendar(state.userId);
        else if (state.provider === 'apple') await syncAppleUserCalendar(state.userId);
      } catch (err) {
        logger.error(`[Calendar Sync] Failed for user ${state.userId} (${state.provider}):`, err);
      }
    }
    if (states.length > 0) {
      logger.info(`[Calendar Sync] Synced ${states.length} connected Calendar(s)`);
    }
  });

  logger.info('[Calendar Sync] Cron job registered — runs every 15 minutes');
}
