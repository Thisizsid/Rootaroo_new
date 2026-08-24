'use strict';

/**
 * `email_verifications.token` was mistakenly given a unique DB constraint,
 * but 6-digit codes are meant to be reused across users (see
 * `password_resets`, which has no such constraint). Two users with
 * concurrently pending codes could collide and crash registration with an
 * unhandled DB error.
 *
 * Dev-mode model sync (`unique: true` re-applied on every restart) left
 * MySQL with a pile of duplicate single-column unique indexes on this
 * column (`token`, `token_2`, `token_3`, ... — MySQL just appends a new one
 * each time instead of recognizing an equivalent index already exists), all
 * equally capable of causing the collision. Drop every single-column unique
 * index found on `token`, but leave the compound
 * `idx_email_verification_user_token` (user_id, token) index alone — it's
 * non-unique and intentional.
 */
module.exports = {
  async up(queryInterface) {
    const [indexes] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM email_verifications WHERE Column_name = 'token' AND Non_unique = 0",
    );
    const names = [...new Set(indexes.map((row) => row.Key_name))];
    for (const name of names) {
      await queryInterface.removeIndex('email_verifications', name);
    }
  },

  async down(queryInterface) {
    await queryInterface.addIndex('email_verifications', ['token'], { unique: true });
  },
};
