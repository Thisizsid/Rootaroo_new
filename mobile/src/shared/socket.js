import { io } from 'socket.io-client';
import apiClient from './api/client';
import { useFeedStore } from './store/feedStore';
import { usePingStore } from './store/pingStore';

let socket = null;
let listenersAttached = false;
let currentToken = null;

function getBaseURL() {
  const base = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
  return base.replace(/\/api\/v1\/?$/, '');
}

/**
 * Connect to WebSocket with the given auth token.
 * Safe to call multiple times — reconnects with a new token if it changes.
 */
export function connectSocket(token) {
  // If connected with the same token, reuse existing connection
  if (socket?.connected && currentToken === token) {
    return socket;
  }

  // If token changed, disconnect first so auth is refreshed
  if (socket?.connected && currentToken !== token) {
    listenersAttached = false;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  socket = io(getBaseURL(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[WS] connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS] disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[WS] connection error:', err.message);
  });

  attachListeners();
  return socket;
}

function attachListeners() {
  if (listenersAttached || !socket) return;
  listenersAttached = true;

  socket.on('feed:new-post', (post) => {
    useFeedStore.getState().prependPost(post);
  });

  socket.on('ping:request', (request) => {
    usePingStore.getState().addIncoming(request);
  });

  socket.on('ping:response', (request) => {
    usePingStore.getState().upsertOutgoing(request);
  });
}

/**
 * Disconnect socket. Call on logout.
 */
export function disconnectSocket() {
  if (socket) {
    listenersAttached = false;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
