'use strict';

/**
 * Adds 'household' as a valid Conversation.type value — represents the one
 * auto-synced "message everyone in this household" conversation, distinct
 * from 'dm' and ad-hoc 'group' conversations.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('conversations', 'type', {
      type: Sequelize.ENUM('dm', 'group', 'household'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('conversations', 'type', {
      type: Sequelize.ENUM('dm', 'group'),
      allowNull: false,
    });
  },
};
