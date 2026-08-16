import { getSocket } from '../socket';
import { useChatStore } from '../store/chatStore';

let listenersAttached = false;

export function registerChatSocket() {
  const socket = getSocket();
  if (!socket || listenersAttached) return;
  listenersAttached = true;

  const store = useChatStore.getState;

  // FR-141: New message from another user
  socket.on('new_message', (msg) => {
    useChatStore.getState().prependMessage(msg);
  });

  // FR-145/146: Message deleted
  socket.on('message_deleted', (data) => {
    useChatStore.getState().removeMessage(data.id);
  });

  // FR-150: Message edited
  socket.on('message_edited', (msg) => {
    useChatStore.getState().patchMessage(msg);
  });

  // FR-148: Reaction added
  socket.on('reaction_added', (data) => {
    useChatStore.getState().patchReactions(data.messageId, data.reactions);
  });

  // FR-148: Reaction removed
  socket.on('reaction_removed', (data) => {
    useChatStore.getState().patchReactions(data.messageId, data.reactions);
  });

  // FR-149: Typing indicator
  socket.on('typing_start', (data) => {
    useChatStore.getState().addTypingUser(data);
  });

  socket.on('typing_stop', (data) => {
    useChatStore.getState().removeTypingUser(data.userId);
  });
}

export function unregisterChatSocket() {
  const socket = getSocket();
  if (!socket) return;
  listenersAttached = false;
  socket.off('new_message');
  socket.off('message_deleted');
  socket.off('message_edited');
  socket.off('reaction_added');
  socket.off('reaction_removed');
  socket.off('typing_start');
  socket.off('typing_stop');
}
