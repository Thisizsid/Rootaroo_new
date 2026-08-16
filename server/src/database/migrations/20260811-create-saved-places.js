'use strict';

/**
 * Create the `saved_places` table (Ping feature: Home/Office/School/Custom
 * location bookmarks). The table is created by model sync in dev; this
 * migration covers production deployments.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('saved_places', {
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
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      icon: {
        type: Sequelize.ENUM('home', 'office', 'school', 'custom'),
        allowNull: false,
        defaultValue: 'custom',
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('saved_places', ['user_id'], {
      name: 'idx_saved_places_user',
    });
    await queryInterface.addIndex('saved_places', ['household_id'], {
      name: 'idx_saved_places_household',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('saved_places');
  },
};
