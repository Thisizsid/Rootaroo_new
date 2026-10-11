/**
 * Home's "Today's Focus": the first three open tasks, overdue ones first.
 * The server groups tasks only with `group: 'status'` (any other group is a 400),
 * answering { pending, overdue, completedToday }.
 */
export const FOCUS_TASK_COUNT = 3;

export async function loadFocusTasks(api) {
  const res = await api.list({ group: 'status' });
  const open = Array.isArray(res) ? res : [...(res?.overdue || []), ...(res?.pending || [])];
  return open.slice(0, FOCUS_TASK_COUNT);
}
