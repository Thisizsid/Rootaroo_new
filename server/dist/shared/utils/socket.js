"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setIO = setIO;
exports.getIO = getIO;
let io = null;
function setIO(instance) {
    io = instance;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized — call setIO() before getIO()');
    }
    return io;
}
//# sourceMappingURL=socket.js.map