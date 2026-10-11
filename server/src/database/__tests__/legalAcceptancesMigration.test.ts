// A module, not a global script, so these names don't clash with the other migration tests.
export {};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const migration = require('../migrations/20261018-legal-acceptances');

function fake() {
  const tables: Record<string, Record<string, unknown>> = { users: {} };
  const indexes: Record<string, string[]> = {};
  const qi: any = {
    showAllTables: jest.fn(async () => Object.keys(tables)),
    createTable: jest.fn(async (t: string, attrs: Record<string, unknown>) => { tables[t] = attrs; }),
    dropTable: jest.fn(async (t: string) => { delete tables[t]; }),
    showIndex: jest.fn(async (t: string) => (indexes[t] ?? []).map((name) => ({ name }))),
    addIndex: jest.fn(async (t: string, _f: string[], o: { name: string }) => { (indexes[t] ??= []).push(o.name); }),
  };
  return { qi, tables, indexes };
}

const Sequelize = {
  UUID: 'UUID', DATE: 'DATE', STRING: (n: number) => `STRING(${n})`, literal: (s: string) => s,
};

describe('20261018-legal-acceptances migration', () => {
  it('creates the table with every proof field, tied to the user, and is safe to re-run', async () => {
    const { qi, tables, indexes } = fake();
    await migration.up(qi, Sequelize);
    await migration.up(qi, Sequelize);
    expect(qi.createTable).toHaveBeenCalledTimes(1);
    expect(Object.keys(tables.legal_acceptances).sort()).toEqual([
      'accepted_at', 'agreed_at_client', 'app_version', 'created_at', 'document', 'id', 'ip', 'method', 'platform', 'user_id', 'version',
    ]);
    expect(tables.legal_acceptances.user_id).toEqual(expect.objectContaining({
      allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
    }));
    expect(indexes.legal_acceptances).toEqual(['idx_legal_acceptances_user']);
  });

  it('down drops the table, and does nothing when it is already gone', async () => {
    const { qi, tables } = fake();
    await migration.up(qi, Sequelize);
    await migration.down(qi);
    expect(tables.legal_acceptances).toBeUndefined();
    await migration.down(qi);
    expect(qi.dropTable).toHaveBeenCalledTimes(1);
  });
});
