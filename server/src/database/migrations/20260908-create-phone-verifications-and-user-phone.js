'use strict';

/**
 * Baseline for phone auth (login/signup via SMS OTP) never got a migration —
 * the phone_verifications table and users.phone/is_phone_verified columns
 * only existed via sequelize.sync() in development. This creates them for
 * any environment that relies on migrations instead (staging/production).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('phone_verifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      phone: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('phone_verifications', ['phone', 'token'], {
      name: 'idx_phone_verification_phone_token',
    });

    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(32),
      allowNull: true,
      unique: true,
    });
    await queryInterface.addColumn('users', 'is_phone_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addIndex('users', ['phone'], {
      name: 'idx_users_phone',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'idx_users_phone');
    await queryInterface.removeColumn('users', 'is_phone_verified');
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.dropTable('phone_verifications');
  },
};
