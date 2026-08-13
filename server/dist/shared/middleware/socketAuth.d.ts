import { Server as SocketIOServer, Socket } from 'socket.io';
export interface SocketUserData {
    userId: string;
    email: string;
    role: string;
    householdId: string | null;
}
export interface AuthenticatedSocket extends Socket {
    data: SocketUserData;
}
export declare function socketAuthMiddleware(io: SocketIOServer): void;
export declare function setupSocketConnectionHandlers(io: SocketIOServer): void;
export declare function requireHouseholdAccess(socket: AuthenticatedSocket, targetHouseholdId: string): boolean;
//# sourceMappingURL=socketAuth.d.ts.map