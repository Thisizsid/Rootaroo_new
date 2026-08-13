const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const now = new Date();

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('password123', 12);

    const adminId = uuidv4();
    const memberId = uuidv4();
    const childId = uuidv4();
    const householdId = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        email: 'admin@rootaroo.dev',
        password_hash: hash,
        display_name: 'Admin User',
        role: 'admin',
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: memberId,
        email: 'member@rootaroo.dev',
        password_hash: hash,
        display_name: 'Member User',
        role: 'member',
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: childId,
        email: 'child@rootaroo.dev',
        password_hash: hash,
        display_name: 'Child User',
        role: 'child',
        is_verified: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('households', [
      {
        id: householdId,
        name: 'Demo Family',
        avatar_emoji: '\u{1F3E0}',
        invite_code: 'DEMO2026',
        created_by: adminId,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('household_members', [
      {
        id: uuidv4(),
        household_id: householdId,
        user_id: adminId,
        role: 'admin',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        household_id: householdId,
        user_id: memberId,
        role: 'member',
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        household_id: householdId,
        user_id: childId,
        role: 'child',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('household_members', null, {});
    await queryInterface.bulkDelete('households', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
