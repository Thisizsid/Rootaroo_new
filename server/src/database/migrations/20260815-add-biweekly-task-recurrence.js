'use strict';

/** Adds 'biweekly' as a valid Task.recurrence value. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('tasks', 'recurrence', {
      type: Sequelize.ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly'),
      defaultValue: 'none',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('tasks', 'recurrence', {
      type: Sequelize.ENUM('none', 'daily', 'weekly', 'monthly'),
      defaultValue: 'none',
    });
  },
};
