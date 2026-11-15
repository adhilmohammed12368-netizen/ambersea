export interface ActionResult {
  actionCompleted: boolean;
  refreshed: boolean;
  refreshError: unknown | null;
}
export function executeAndRefresh(action: () => Promise<unknown> | unknown, refresh: () => Promise<unknown> | unknown, options?: {refreshOnly?: boolean}): Promise<ActionResult>;
export function describeError(error: unknown): string;
