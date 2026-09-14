'use strict';

/**
 * CheckIn, PingRequest, and TodoItem had no indexes at all — every
 * dashboard load filters check_ins/ping_requests by household + a date
 * range (streak/activity widgets) and todo_items by household + completion
 * status (todo summary widget), all as full table scans. Purely additive;
 * doesn't change any query results.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('check_ins', ['household_id', 'checked_in_at'], {
      name: 'idx_check_ins_household_checked_in',
    });
    await queryInterface.addIndex('ping_requests', ['household_id', 'created_at'], {
      name: 'idx_ping_requests_household_created',
    });
    await queryInterface.addIndex('todo_items', ['household_id', 'is_completed'], {
      name: 'idx_todo_items_household_completed',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('check_ins', 'idx_check_ins_household_checked_in');
    await queryInterface.removeIndex('ping_requests', 'idx_ping_requests_household_created');
    await queryInterface.removeIndex('todo_items', 'idx_todo_items_household_completed');
  },
};
