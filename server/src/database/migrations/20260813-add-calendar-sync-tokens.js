'use strict';

/**
 * Add OAuth token storage to `calendar_sync_states` for Google Calendar
 * two-way sync — access/refresh tokens obtained via the incremental-scope
 * connect flow, refreshed automatically when expired.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('calendar_sync_states', 'access_token', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('calendar_sync_states', 'refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('calendar_sync_states', 'token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('calendar_sync_states', 'access_token');
    await queryInterface.removeColumn('calendar_sync_states', 'refresh_token');
    await queryInterface.removeColumn('calendar_sync_states', 'token_expires_at');
  },
};
