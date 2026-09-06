'use strict';

/**
 * Create the `household_action_requests` table — leave-household and
 * delete-household no longer take effect directly; both create a row here
 * that Rootaroo staff review via the admin-only API before anything happens.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('household_action_requests', {
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
      requested_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('leave', 'delete'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reviewer_note: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('household_action_requests', ['status'], {
      name: 'idx_household_action_requests_status',
    });
    await queryInterface.addIndex('household_action_requests', ['household_id'], {
      name: 'idx_household_action_requests_household',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('household_action_requests');
  },
};
