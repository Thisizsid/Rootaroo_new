import { Server as SocketIOServer } from 'socket.io';
/**
 * Registers chat-related socket event handlers.
 *
 * All events are scoped to the household room — the auth middleware
 * in socketAuth.ts handles JWT verification and room joining.
 * Each event handler re-checks household membership via the guard.
 */
export declare function registerChatSocket(io: SocketIOServer): void;
//# sourceMappingURL=chatSocket.d.ts.map