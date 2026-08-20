'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('households', 'timezone', {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'UTC',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('households', 'timezone');
  },
};
