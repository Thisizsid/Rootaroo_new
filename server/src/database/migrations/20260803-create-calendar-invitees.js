'use strict';

/**
 * Create the `calendar_invitees` join table (CalendarEvent ↔ User) for the
 * family calendar (mock 07-Calendar-Household, screens 34/35).
 * The `calendar_events` table is created by model sync in dev; this migration
 * adds the invitee join table for production deployments.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('calendar_invitees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      calendar_event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'calendar_events', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('calendar_invitees', ['calendar_event_id'], {
      name: 'idx_calendar_invitee_event',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('calendar_invitees');
  },
};
