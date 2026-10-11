const { loadFocusTasks } = require('../focusTasks');

const t = (id) => ({ id, title: `Task ${id}` });

describe("Home's Today's Focus", () => {
  it("asks the server for tasks grouped by status (the only grouping it accepts)", async () => {
    const api = { list: jest.fn(async () => ({ pending: [], overdue: [], completedToday: [] })) };
    await loadFocusTasks(api);
    expect(api.list).toHaveBeenCalledWith({ group: 'status' });
  });

  it('shows the first three open tasks, overdue ones first, never completed ones', async () => {
    const api = { list: jest.fn(async () => ({
      overdue: [t('o1')],
      pending: [t('p1'), t('p2'), t('p3')],
      completedToday: [t('c1')],
    })) };
    expect((await loadFocusTasks(api)).map((x) => x.id)).toEqual(['o1', 'p1', 'p2']);
  });

  it('copes with an empty household', async () => {
    const api = { list: jest.fn(async () => ({ pending: [], overdue: [], completedToday: [] })) };
    expect(await loadFocusTasks(api)).toEqual([]);
  });
});
