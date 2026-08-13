"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class FeedPost extends sequelize_1.Model {
}
FeedPost.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    householdId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'household_id',
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    mediaType: {
        type: sequelize_1.DataTypes.ENUM('text', 'photo', 'video'),
        allowNull: false,
        field: 'media_type',
    },
    activity: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    location: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true,
    },
    privacy: {
        type: sequelize_1.DataTypes.ENUM('household', 'members'),
        defaultValue: 'household',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'updated_at',
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'feed_posts',
    paranoid: true,
    indexes: [
        { name: 'idx_feed_posts_household_created', fields: ['household_id', 'created_at'] },
    ],
});
exports.default = FeedPost;
//# sourceMappingURL=FeedPost.js.map