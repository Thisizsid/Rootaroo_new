"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItem = createItem;
exports.getItems = getItems;
exports.updateItem = updateItem;
exports.deleteItem = deleteItem;
exports.toggleBought = toggleBought;
exports.archiveItem = archiveItem;
exports.getSummary = getSummary;
const uuid_1 = require("uuid");
const models_1 = require("../../database/models");
const errors_1 = require("../../shared/utils/errors");
// ── Helpers ──
function toAssignee(user) {
    if (!user)
        return null;
    return {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        avatarEmoji: user.avatarEmoji,
    };
}
async function getUserHousehold(userId) {
    const membership = await models_1.HouseholdMember.findOne({ where: { userId } });
    if (!membership)
        throw new errors_1.ForbiddenError('You must belong to a household');
    return membership.householdId;
}
function toGroceryResponse(item) {
    return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        note: item.note,
        assignedTo: toAssignee(item.get('assignee')),
        isBought: item.isBought,
        boughtBy: toAssignee(item.get('buyer')),
        boughtAt: item.boughtAt ? item.boughtAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
    };
}
// ── Public Methods ──
/** FR-080: Add grocery item. */
async function createItem(userId, body) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.GroceryItem.create({
        id: (0, uuid_1.v4)(),
        householdId,
        name: body.name,
        quantity: body.quantity || null,
        note: body.note || null,
        assignedTo: body.assignedTo || null,
        isBought: false,
    });
    const full = await models_1.GroceryItem.findByPk(item.id, {
        include: [
            { model: models_1.User, as: 'assignee' },
            { model: models_1.User, as: 'buyer' },
        ],
    });
    if (!full)
        throw new Error('Failed to load created item');
    return toGroceryResponse(full);
}
/** FR-087: List groceries with grouping. */
async function getItems(userId) {
    const householdId = await getUserHousehold(userId);
    const all = await models_1.GroceryItem.findAll({
        where: { householdId },
        include: [
            { model: models_1.User, as: 'assignee' },
            { model: models_1.User, as: 'buyer' },
        ],
        order: [['createdAt', 'DESC']],
    });
    const grouped = {
        pending: [],
        bought: [],
        archived: [],
    };
    for (const item of all) {
        const resp = toGroceryResponse(item);
        if (item.archivedAt) {
            grouped.archived.push(resp);
        }
        else if (item.isBought) {
            grouped.bought.push(resp);
        }
        else {
            grouped.pending.push(resp);
        }
    }
    return grouped;
}
/** FR-083: Edit a grocery item. */
async function updateItem(itemId, userId, userRole, body) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.GroceryItem.findOne({
        where: { id: itemId, householdId },
        include: [
            { model: models_1.User, as: 'assignee' },
            { model: models_1.User, as: 'buyer' },
        ],
    });
    if (!item)
        throw new errors_1.NotFoundError('Grocery item');
    // Only admin can edit
    if (userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only admins can edit grocery items');
    }
    if (body.name !== undefined)
        item.name = body.name;
    if (body.quantity !== undefined)
        item.quantity = body.quantity;
    if (body.note !== undefined)
        item.note = body.note;
    if (body.assignedTo !== undefined)
        item.assignedTo = body.assignedTo;
    await item.save();
    return toGroceryResponse(item);
}
/** FR-082: Delete item. */
async function deleteItem(itemId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.GroceryItem.findOne({ where: { id: itemId, householdId } });
    if (!item)
        throw new errors_1.NotFoundError('Grocery item');
    // Only admin can delete
    if (userRole !== 'admin') {
        throw new errors_1.ForbiddenError('Only admins can delete grocery items');
    }
    await item.destroy();
}
/** FR-081: Toggle bought status. */
async function toggleBought(itemId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.GroceryItem.findOne({
        where: { id: itemId, householdId },
        include: [
            { model: models_1.User, as: 'assignee' },
            { model: models_1.User, as: 'buyer' },
        ],
    });
    if (!item)
        throw new errors_1.NotFoundError('Grocery item');
    // Only admin or assignee can toggle
    const assignee = item.get('assignee');
    const isAssignee = assignee?.id === userId;
    if (userRole !== 'admin' && !isAssignee) {
        throw new errors_1.ForbiddenError('Only the assigned member or an admin can mark items as bought');
    }
    if (item.isBought) {
        item.isBought = false;
        item.boughtBy = null;
        item.boughtAt = null;
    }
    else {
        item.isBought = true;
        item.boughtBy = userId;
        item.boughtAt = new Date();
    }
    await item.save();
    return toGroceryResponse(item);
}
/** FR-088: Archive bought items (move out of default view). */
async function archiveItem(itemId, userId, userRole) {
    const householdId = await getUserHousehold(userId);
    const item = await models_1.GroceryItem.findOne({
        where: { id: itemId, householdId },
        include: [
            { model: models_1.User, as: 'assignee' },
            { model: models_1.User, as: 'buyer' },
        ],
    });
    if (!item)
        throw new errors_1.NotFoundError('Grocery item');
    // Only admin, buyer, or assignee can archive
    const buyer = item.get('buyer');
    const assignee = item.get('assignee');
    const canArchive = userRole === 'admin' || buyer?.id === userId || assignee?.id === userId;
    if (!canArchive) {
        throw new errors_1.ForbiddenError('Only the buyer, assignee, or an admin can archive this item');
    }
    item.archivedAt = new Date();
    await item.save();
    return toGroceryResponse(item);
}
/** FR-089: Summary counts for dashboard. */
async function getSummary(userId) {
    const householdId = await getUserHousehold(userId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const all = await models_1.GroceryItem.findAll({
        where: { householdId },
        attributes: ['id', 'isBought', 'boughtAt', 'archivedAt'],
    });
    let pending = 0;
    let boughtToday = 0;
    for (const item of all) {
        if (item.archivedAt)
            continue;
        if (item.isBought) {
            if (item.boughtAt && item.boughtAt >= todayStart && item.boughtAt <= todayEnd) {
                boughtToday++;
            }
        }
        else {
            pending++;
        }
    }
    return { pending, boughtToday };
}
//# sourceMappingURL=service.js.map