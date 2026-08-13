import type { DashboardResponse } from './types';
export declare function getDashboard(userId: string): Promise<DashboardResponse>;
/**
 * Quick-notify selected household members with a status action.
 */
export declare function quickNotify(userId: string, action: string, memberIds: string[]): Promise<void>;
//# sourceMappingURL=service.d.ts.map