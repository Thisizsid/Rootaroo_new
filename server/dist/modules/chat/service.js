"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.getUserConversations = getUserConversations;
exports.sendMessage = sendMessage;
exports.listMessages = listMessages;
exports.getMessageById = getMessageById;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;
exports.addReaction = addReaction;
exports.removeReaction = removeReaction;
exports.getReactions = getReactions;
exports.typingStart = typingStart;
exports.typingStop = typingStop;
exports.addParticipant = addParticipant;
exports.removeParticipant = removeParticipant;
exports.deleteConversation = deleteConversation;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
const socket_1 = require("../../shared/utils/socket");
const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '😲', '😢'];
// ── Conversation Helpers ──
function toConversationResponse(conv) {
    const participants = conv.get('participants') || [];
    const lastMsg = conv.get('messages')?.[0] || null;
    return {
        id: conv.id,
        householdId: conv.householdId,
        type: conv.type,
        name: conv.name,
        participants: participants.map((u) => ({
            id: u.id,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
        })),
        lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                createdAt: lastMsg.createdAt.toISOString(),
                senderName: lastMsg.get('sender')?.displayName || 'Unknown',
            }
            : null,
        createdAt: conv.createdAt.toISOString(),
    };
}
async function createConversation(userId, body) {
    const householdId = await ensureHouseholdMember(userId);
    // For DMs, check if a conversation already exists between these users
    if (body.type === 'dm' && body.participantIds.length === 1) {
        const otherUserId = body.participantIds[0];
        // Query participants to find conversations where both users participate
        const myParts = await models_1.ConversationParticipant.findAll({ where: { userId } });
        const otherParts = await models_1.ConversationParticipant.findAll({ where: { userId: otherUserId } });
        const myConvIds = new Set(myParts.map((p) => p.conversationId));
        const commonConvIds = otherParts.filter((p) => myConvIds.has(p.conversationId)).map((p) => p.conversationId);
        for (const cid of commonConvIds) {
            const parts = await models_1.ConversationParticipant.findAll({ where: { conversationId: cid } });
            const partIds = parts.map((p) => p.userId);
            if (partIds.length === 2 && partIds.includes(userId) && partIds.includes(otherUserId)) {
                const convType = await models_1.Conversation.findByPk(cid, { attributes: ['type'] });
                if (convType && convType.type === 'dm') {
                    const full = await models_1.Conversation.findByPk(cid, {
                        include: [
                            { model: models_1.User, as: 'participants' },
                            { model: models_1.ChatMessage, as: 'messages', limit: 1, order: [['createdAt', 'DESC']], include: [{ model: models_1.User, as: 'sender' }] },
                        ],
                    });
                    if (full)
                        return toConversationResponse(full);
                }
            }
        }
    }
    const conv = await models_1.Conversation.create({
        id: (0, uuid_1.v4)(),
        householdId,
        type: body.type,
        name: body.name || null,
        createdBy: userId,
    });
    // Add all participants including the creator
    const allParticipantIds = [...new Set([userId, ...body.participantIds])];
    await models_1.ConversationParticipant.bulkCreate(allParticipantIds.map((uid) => ({
        id: (0, uuid_1.v4)(),
        conversationId: conv.id,
        userId: uid,
    })));
    const full = await models_1.Conversation.findByPk(conv.id, {
        include: [
            { model: models_1.User, as: 'participants' },
            {
                model: models_1.ChatMessage,
                as: 'messages',
                limit: 1,
                order: [['createdAt', 'DESC']],
                include: [{ model: models_1.User, as: 'sender' }],
            },
        ],
    });
    if (!full)
        throw new Error('Failed to create conversation');
    // Join socket room for all participants
    for (const pid of allParticipantIds) {
        try {
            const sockets = await (0, socket_1.getIO)().fetchSockets();
            for (const s of sockets) {
                if (s.data.userId === pid)
                    s.join(conv.id);
            }
        }
        catch {
            /* ignore */
        }
    }
    return toConversationResponse(full);
}
async function getUserConversations(userId) {
    await ensureHouseholdMember(userId);
    // Find conversations where user is a participant
    const participations = await models_1.ConversationParticipant.findAll({
        where: { userId },
        attributes: ['conversationId'],
    });
    const convIds = participations.map((p) => p.conversationId);
    if (convIds.length === 0)
        return [];
    const convs = await models_1.Conversation.findAll({
        where: { id: convIds },
        include: [
            { model: models_1.User, as: 'participants' },
            {
                model: models_1.ChatMessage,
                as: 'messages',
                limit: 1,
                order: [['createdAt', 'DESC']],
                include: [{ model: models_1.User, as: 'sender' }],
            },
        ],
        order: [['createdAt', 'DESC']],
    });
    return convs.map(toConversationResponse);
}
// ── Helpers ──
async function ensureHouseholdMember(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership)
        throw new errors_1.ForbiddenError('You must belong to a household to send messages');
    return membership.householdId;
}
function toSenderResponse(user) {
    if (!user)
        return null;
    return {
        id: user.get('id'),
        displayName: user.get('displayName') || 'Unknown',
        avatarUrl: user.get('avatarUrl'),
        avatarEmoji: user.get('avatarEmoji'),
    };
}
async function toMessageResponse(msg) {
    const sender = msg.get('sender') || null;
    const reactions = msg.get('reactions') || [];
    const replies = msg.get('replies') || [];
    const replyCount = replies.length;
    // Build reaction counts
    const reactionCounts = ALLOWED_REACTIONS.map((emoji) => ({
        emoji,
        count: reactions.filter((r) => r.reaction === emoji).length,
        userReacted: false, // caller fills this in
    }));
    let replyPreview = null;
    const replyToId = msg.get('replyToId');
    if (replyToId) {
        // Fetch replied-to message for preview
        const replyToMsg = await models_1.ChatMessage.findByPk(replyToId, {
            include: [{ model: models_1.User, as: 'sender', attributes: ['id', 'displayName', 'avatarUrl', 'avatarEmoji'] }],
        });
        if (replyToMsg) {
            const replySender = replyToMsg.get('sender') || null;
            replyPreview = {
                id: replyToId,
                content: replyToMsg.get('content'),
                senderName: replySender?.get('displayName') || 'Unknown',
            };
        }
    }
    return {
        id: msg.get('id'),
        householdId: msg.get('householdId'),
        senderId: msg.get('senderId'),
        sender: toSenderResponse(sender) || { id: '', displayName: 'Deleted', avatarUrl: null, avatarEmoji: null },
        content: msg.get('content'),
        mediaUrl: msg.get('mediaUrl'),
        replyToId,
        replyPreview,
        reactions: reactionCounts,
        replyCount,
        editedAt: msg.get('editedAt')?.toISOString() || null,
        createdAt: msg.get('createdAt').toISOString(),
        updatedAt: msg.get('updatedAt').toISOString(),
        deletedAt: msg.get('deletedAt')?.toISOString() || null,
    };
}
// ── Send Message (FR-140) ──
async function sendMessage(userId, body) {
    const householdId = await ensureHouseholdMember(userId);
    // Verify user is a participant in the conversation
    const participant = await models_1.ConversationParticipant.findOne({
        where: { conversationId: body.conversationId, userId },
    });
    if (!participant)
        throw new errors_1.ForbiddenError('You are not a participant in this conversation');
    if (!body.content && (!body.mediaIds || body.mediaIds.length === 0)) {
        throw new errors_1.ValidationError('Message must contain content or media');
    }
    let mediaUrl = null;
    // FR-143: Attach media from feed upload
    if (body.mediaIds && body.mediaIds.length > 0) {
        const medias = await models_1.FeedMedia.findAll({
            where: { id: { [sequelize_1.Op.in]: body.mediaIds }, householdId },
        });
        if (medias.length > 0) {
            mediaUrl = medias[0].get('secureUrl');
        }
    }
    // FR-144: Validate replyTo exists
    if (body.replyToId) {
        const parentMsg = await models_1.ChatMessage.findByPk(body.replyToId);
        if (!parentMsg)
            throw new errors_1.NotFoundError('Message to reply to not found');
    }
    const msg = await models_1.ChatMessage.create({
        householdId,
        conversationId: body.conversationId,
        senderId: userId,
        content: body.content || null,
        mediaUrl,
        replyToId: body.replyToId || null,
    });
    // Reload with associations
    const saved = await models_1.ChatMessage.findByPk(msg.get('id'), {
        include: [
            { model: models_1.User, as: 'sender', attributes: ['id', 'displayName', 'avatarUrl', 'avatarEmoji'] },
            { model: models_1.ChatReaction, as: 'reactions' },
            { model: models_1.ChatMessage, as: 'replies', attributes: ['id'] },
        ],
    });
    if (!saved)
        throw new Error('Message not found after create');
    const response = await toMessageResponse(saved);
    // FR-141: Broadcast via Socket.io to conversation room
    try {
        const io = (0, socket_1.getIO)();
        io.to(body.conversationId).emit('new_message', response);
    }
    catch {
        /* socket not available */
    }
    return response;
}
// ── List Messages (FR-140) ──
async function listMessages(userId, query) {
    const householdId = await ensureHouseholdMember(userId);
    const limit = Math.min(query.limit || 30, 50);
    const where = {};
    if (query.conversationId) {
        where.conversationId = query.conversationId;
    }
    else {
        where.householdId = householdId;
    }
    if (query.cursor) {
        where.createdAt = { [sequelize_1.Op.lt]: new Date(query.cursor) };
    }
    const messages = await models_1.ChatMessage.findAll({
        where,
        include: [
            { model: models_1.User, as: 'sender', attributes: ['id', 'displayName', 'avatarUrl', 'avatarEmoji'] },
            { model: models_1.ChatReaction, as: 'reactions' },
            { model: models_1.ChatMessage, as: 'replies', attributes: ['id'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
    });
    const hasMore = messages.length > limit;
    const slice = hasMore ? messages.slice(0, limit) : messages;
    const messageResponses = await Promise.all(slice.map((m) => toMessageResponse(m)));
    // Fill in userReacted after building responses
    const userReactions = await models_1.ChatReaction.findAll({
        where: {
            userId,
            messageId: { [sequelize_1.Op.in]: slice.map((m) => m.get('id')) },
        },
    });
    const userReactedSet = new Set(userReactions.map((r) => `${r.messageId}:${r.reaction}`));
    for (const resp of messageResponses) {
        for (const r of resp.reactions) {
            r.userReacted = userReactedSet.has(`${resp.id}:${r.emoji}`);
        }
    }
    const nextCursor = hasMore
        ? slice[slice.length - 1].get('createdAt')?.toISOString() || null
        : null;
    return { messages: messageResponses, nextCursor, hasMore };
}
// ── Get Message By ID ──
async function getMessageById(messageId, userId) {
    const householdId = await ensureHouseholdMember(userId);
    const msg = await models_1.ChatMessage.findOne({
        where: { id: messageId, householdId },
        include: [
            { model: models_1.User, as: 'sender', attributes: ['id', 'displayName', 'avatarUrl', 'avatarEmoji'] },
            { model: models_1.ChatReaction, as: 'reactions' },
            { model: models_1.ChatMessage, as: 'replies', attributes: ['id'] },
        ],
    });
    if (!msg)
        throw new errors_1.NotFoundError('Message not found');
    const response = await toMessageResponse(msg);
    // Check user reactions
    const userReactions = await models_1.ChatReaction.findAll({ where: { userId, messageId } });
    for (const r of response.reactions) {
        r.userReacted = userReactions.some((ur) => ur.reaction === r.emoji);
    }
    return response;
}
// ── Update Message (FR-150: not E2EE) ──
async function updateMessage(messageId, userId, userRole, body) {
    const householdId = await ensureHouseholdMember(userId);
    const msg = await models_1.ChatMessage.findOne({ where: { id: messageId, householdId } });
    if (!msg)
        throw new errors_1.NotFoundError('Message not found');
    const conversationId = msg.get('conversationId');
    // FR-150: Self-only edit
    const senderId = msg.get('senderId');
    if (senderId !== userId && userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only the sender can edit a message');
    }
    await msg.update({
        content: body.content || msg.get('content'),
        editedAt: new Date(),
    });
    const saved = await models_1.ChatMessage.findByPk(messageId, {
        include: [
            { model: models_1.User, as: 'sender', attributes: ['id', 'displayName', 'avatarUrl', 'avatarEmoji'] },
            { model: models_1.ChatReaction, as: 'reactions' },
            { model: models_1.ChatMessage, as: 'replies', attributes: ['id'] },
        ],
    });
    if (!saved)
        throw new errors_1.NotFoundError('Message not found after update');
    const response = await toMessageResponse(saved);
    // Broadcast edit to conversation room
    try {
        const io = (0, socket_1.getIO)();
        io.to(conversationId).emit('message_edited', response);
    }
    catch {
        /* ignore */
    }
    return response;
}
// ── Delete Message (FR-145, FR-146) ──
async function deleteMessage(messageId, userId, userRole) {
    const householdId = await ensureHouseholdMember(userId);
    const msg = await models_1.ChatMessage.findOne({ where: { id: messageId, householdId } });
    if (!msg)
        throw new errors_1.NotFoundError('Message not found');
    const senderId = msg.get('senderId');
    const conversationId = msg.get('conversationId');
    const isOwn = senderId === userId;
    const isAdmin = userRole === 'admin';
    // Allow user to delete their own message, or admin/conversation participant
    if (!isOwn && !isAdmin) {
        const participant = await models_1.ConversationParticipant.findOne({ where: { conversationId, userId } });
        if (!participant) {
            throw new errors_1.ForbiddenError('You can only delete messages in your conversations');
        }
    }
    await models_1.sequelize.transaction(async (transaction) => {
        await models_1.ChatReaction.destroy({ where: { messageId }, transaction });
        await msg.destroy({ force: true, transaction });
    });
    // Broadcast deletion event to conversation room
    try {
        const io = (0, socket_1.getIO)();
        io.to(conversationId).emit('message_deleted', {
            id: messageId,
            hardDelete: true,
        });
    }
    catch {
        /* ignore */
    }
}
// ── Add Reaction (FR-148) ──
async function addReaction(messageId, userId, emoji) {
    await ensureHouseholdMember(userId);
    const msg = await models_1.ChatMessage.findByPk(messageId);
    if (!msg)
        throw new errors_1.NotFoundError('Message not found');
    if (!ALLOWED_REACTIONS.includes(emoji))
        throw new errors_1.ValidationError('Invalid reaction');
    // Upsert reaction
    await models_1.ChatReaction.upsert({
        messageId,
        userId,
        reaction: emoji,
    });
    const reactions = await getReactions(messageId);
    // Broadcast to conversation room
    try {
        const conversationId = msg.get('conversationId');
        const io = (0, socket_1.getIO)();
        io.to(conversationId).emit('reaction_added', { messageId, reactions, userId, emoji });
    }
    catch {
        /* ignore */
    }
    return reactions;
}
// ── Remove Reaction ──
async function removeReaction(messageId, userId, emoji) {
    await ensureHouseholdMember(userId);
    await models_1.ChatReaction.destroy({
        where: { messageId, userId, reaction: emoji },
    });
    const reactions = await getReactions(messageId);
    try {
        const msg = await models_1.ChatMessage.findByPk(messageId);
        if (msg) {
            const conversationId = msg.get('conversationId');
            const io = (0, socket_1.getIO)();
            io.to(conversationId).emit('reaction_removed', { messageId, reactions, userId, emoji });
        }
    }
    catch {
        /* ignore */
    }
    return reactions;
}
// ── Get Reactions ──
async function getReactions(messageId) {
    const allReactions = await models_1.ChatReaction.findAll({ where: { messageId } });
    const counts = ALLOWED_REACTIONS.map((emoji) => {
        const users = allReactions.filter((r) => r.reaction === emoji);
        return { emoji, count: users.length, userReacted: false };
    });
    return counts;
}
// ── Typing Indicator (FR-149) ──
async function typingStart(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership)
        throw new errors_1.ForbiddenError('You must belong to a household');
    const householdId = membership.householdId;
    const user = await models_1.User.findByPk(userId, { attributes: ['id', 'displayName'] });
    const displayName = user?.get('displayName') || 'Someone';
    try {
        const io = (0, socket_1.getIO)();
        io.to(householdId).emit('typing_start', { userId, displayName });
    }
    catch {
        /* ignore */
    }
}
async function typingStop(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership)
        return; // silently ignore if not member
    const householdId = membership.householdId;
    try {
        const io = (0, socket_1.getIO)();
        io.to(householdId).emit('typing_stop', { userId });
    }
    catch {
        /* ignore */
    }
}
// ── Participant Management ──
async function addParticipant(conversationId, userId, requesterId) {
    const householdId = await ensureHouseholdMember(requesterId);
    const conv = await models_1.Conversation.findOne({ where: { id: conversationId, householdId } });
    if (!conv)
        throw new errors_1.NotFoundError('Conversation');
    await models_1.ConversationParticipant.findOrCreate({
        where: { conversationId, userId },
        defaults: { id: (0, uuid_1.v4)(), conversationId, userId },
    });
}
async function removeParticipant(conversationId, userId, requesterId) {
    const householdId = await ensureHouseholdMember(requesterId);
    const conv = await models_1.Conversation.findOne({ where: { id: conversationId, householdId } });
    if (!conv)
        throw new errors_1.NotFoundError('Conversation');
    await models_1.ConversationParticipant.destroy({ where: { conversationId, userId } });
}
async function deleteConversation(conversationId, userId) {
    const householdId = await ensureHouseholdMember(userId);
    const conv = await models_1.Conversation.findOne({ where: { id: conversationId, householdId } });
    if (!conv)
        throw new errors_1.NotFoundError('Conversation not found');
    await models_1.sequelize.transaction(async (transaction) => {
        const messages = await models_1.ChatMessage.findAll({ where: { conversationId }, attributes: ['id'], transaction });
        const msgIds = messages.map((m) => m.id);
        if (msgIds.length > 0) {
            await models_1.ChatReaction.destroy({ where: { messageId: { [sequelize_1.Op.in]: msgIds } }, transaction });
            await models_1.ChatMessage.destroy({ where: { conversationId }, force: true, transaction });
        }
        await models_1.ConversationParticipant.destroy({ where: { conversationId }, transaction });
        await conv.destroy({ force: true, transaction });
    });
}
//# sourceMappingURL=service.js.map