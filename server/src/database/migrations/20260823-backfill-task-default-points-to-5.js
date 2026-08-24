'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Bump the old default (1) up to the new default (5) for every task
    // still sitting at the old default value. Tasks with any other custom
    // points value are left untouched.
    await queryInterface.bulkUpdate(
      'tasks',
      { points: 5 },
      { points: 1 },
    );
  },
  async down(queryInterface) {
    // Not perfectly reversible: we can't tell which rows were originally at
    // the old default (1) vs. tasks a user deliberately set to 5 after this
    // migration ran. Left as a no-op rather than guessing.
  },
};
