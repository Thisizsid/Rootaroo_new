'use strict';

const { createTableIfMissing, addIndexIfMissing } = require('../migrationHelpers');

/**
 * A permanent log of when each person accepted the Terms of Service and the Privacy Policy
 * (issue #15): one row per document per acceptance, never updated. Holds the version accepted,
 * how (sign-up checkbox or the Sign In notice), the phone's time of the tap, the server's time,
 * and the IP and app version as proof.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await createTableIfMissing(queryInterface, 'legal_acceptances', {
      id: { type: Sequelize.UUID, primaryKey: true },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      document: { type: Sequelize.STRING(16), allowNull: false },
      version: { type: Sequelize.STRING(32), allowNull: false },
      method: { type: Sequelize.STRING(32), allowNull: false },
      agreed_at_client: { type: Sequelize.DATE, allowNull: false },
      accepted_at: { type: Sequelize.DATE, allowNull: false },
      ip: { type: Sequelize.STRING(64), allowNull: true },
      app_version: { type: Sequelize.STRING(32), allowNull: true },
      platform: { type: Sequelize.STRING(16), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await addIndexIfMissing(queryInterface, 'legal_acceptances', ['user_id'], { name: 'idx_legal_acceptances_user' });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes('legal_acceptances')) {
      await queryInterface.dropTable('legal_acceptances');
    }
  },
};
