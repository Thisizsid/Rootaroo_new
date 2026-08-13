'use strict';

/**
 * Add `scheduled_deletion_at` to `households` — mirrors the existing
 * User.scheduledDeletionAt 30-day-grace-period pattern for household
 * deletion (schedule/cancel/confirm, admin-only, password-confirmed).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('households', 'scheduled_deletion_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('households', 'scheduled_deletion_at');
  },
};
