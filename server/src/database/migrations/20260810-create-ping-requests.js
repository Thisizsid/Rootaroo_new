'use strict';

/**
 * Create the `ping_requests` table (Ping feature: ask a household member to
 * share their current location) and add the `ping_request` notification
 * preference column. The table is created by model sync in dev; this
 * migration covers production deployments.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ping_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      household_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'households', key: 'id' },
        onDelete: 'CASCADE',
      },
      requester_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      target_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('pending', 'fulfilled', 'declined', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
      },
      note: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      check_in_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'check_ins', key: 'id' },
        onDelete: 'SET NULL',
      },
      responded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ping_requests', ['target_user_id', 'status'], {
      name: 'idx_ping_requests_target_status',
    });
    await queryInterface.addIndex('ping_requests', ['requester_id'], {
      name: 'idx_ping_requests_requester',
    });

    await queryInterface.addColumn('notification_preferences', 'ping_request', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('notification_preferences', 'ping_request');
    await queryInterface.dropTable('ping_requests');
  },
};
