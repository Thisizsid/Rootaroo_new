'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('chat_messages', 'type', {
      type: Sequelize.ENUM('text', 'image', 'voice'),
      allowNull: false,
      defaultValue: 'text',
    });
    await queryInterface.addColumn('chat_messages', 'duration_seconds', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('chat_messages', 'type');
    await queryInterface.removeColumn('chat_messages', 'duration_seconds');
  },
};
