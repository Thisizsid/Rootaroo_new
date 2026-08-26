'use strict';

/**
 * Journal entries gain a mood and a tag list.
 *
 * `mood` is one of the five ordinal moods the composer offers (see
 * `MOOD_VALUES` in modules/journal/validation.ts) — nullable, because an entry
 * written before this migration (or saved without picking a face) simply has
 * no mood, and the History chart skips those days rather than inventing one.
 *
 * `tags` is JSON rather than a join table: tags here are free-text labels
 * private to one author's own entry, never queried across users and never
 * needing referential integrity. A `journal_tags` table would buy nothing and
 * cost a join on every list page.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('journal_entries', 'mood', {
      type: Sequelize.STRING(16),
      allowNull: true,
    });
    await queryInterface.addColumn('journal_entries', 'tags', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('journal_entries', 'tags');
    await queryInterface.removeColumn('journal_entries', 'mood');
  },
};
