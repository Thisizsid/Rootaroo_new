'use strict';

/**
 * Tracks whether the one-time overdue points reduction has already been
 * applied to a task, so the hourly cron job doesn't keep halving it.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'points_reduced', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tasks', 'points_reduced');
  },
};
