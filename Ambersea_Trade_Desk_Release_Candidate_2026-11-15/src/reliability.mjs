/**
 * Separate acknowledgement of a successful action from the subsequent UI reload.
 * A successful Supabase mutation must never be presented as an unsuccessful save
 * just because the follow-up read fails (which could cause duplicate entries).
 */
export async function executeAndRefresh(action, refresh, {refreshOnly = false} = {}) {
  if (refreshOnly) {
    await refresh();
    return {actionCompleted: false, refreshed: true, refreshError: null};
  }
  await action();
  try {
    await refresh();
    return {actionCompleted: true, refreshed: true, refreshError: null};
  } catch (refreshError) {
    return {actionCompleted: true, refreshed: false, refreshError};
  }
}

export function describeError(error) {
  const message = typeof error?.message === 'string' ? error.message : String(error || 'Unknown error');
  return message.length > 300 ? `${message.slice(0,297)}...` : message;
}
