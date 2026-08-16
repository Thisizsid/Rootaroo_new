'use strict';

/**
 * Add a `points` column to tasks (screen 17/18 of the Tasks mock design).
 * Default 1 so existing tasks get a sensible value without a backfill.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'points', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tasks', 'points');
  },
};
