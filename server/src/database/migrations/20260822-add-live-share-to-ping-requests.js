'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ping_requests', 'share_duration_minutes', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('ping_requests', 'share_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('ping_requests', 'live_latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('ping_requests', 'live_longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true,
    });
    await queryInterface.addColumn('ping_requests', 'live_updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('ping_requests', 'share_duration_minutes');
    await queryInterface.removeColumn('ping_requests', 'share_expires_at');
    await queryInterface.removeColumn('ping_requests', 'live_latitude');
    await queryInterface.removeColumn('ping_requests', 'live_longitude');
    await queryInterface.removeColumn('ping_requests', 'live_updated_at');
  },
};
