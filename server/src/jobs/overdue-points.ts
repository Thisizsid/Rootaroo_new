import cron from 'node-cron';
import { Op } from 'sequelize';
import { Task } from '../database/models';
import logger from '../shared/utils/logger';

/**
 * One-time points penalty for tasks that have gone overdue.
 * Runs every hour; halves (floored, min 0) the points of any incomplete task
 * whose due date has passed. `pointsReduced` marks the penalty as applied so
 * repeated runs don't keep halving the same task.
 *
 * "Overdue" here matches the definition already used elsewhere in the task
 * module (getTasks/getTaskSummary): due date earlier than the current moment.
 */
export function startOverduePointsReductionJob(): void {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const candidates = await Task.findAll({
        where: {
          status: { [Op.in]: ['pending', 'reopened'] },
          pointsReduced: false,
          dueDate: { [Op.not]: null },
        },
      });

      let count = 0;
      for (const task of candidates) {
        if (!task.dueDate || new Date(task.dueDate) >= now) continue;

        const reduced = Math.max(0, Math.floor(task.points / 2));
        await task.update({ points: reduced, pointsReduced: true });
        count++;
      }

      if (count > 0) {
        logger.info(`[Overdue Points] Reduced points for ${count} overdue task(s)`);
      }
    } catch (err) {
      logger.error('[Overdue Points] Failed:', err);
    }
  });

  logger.info('[Overdue Points] Cron job registered — runs every hour');
}
