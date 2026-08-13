"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../../config/database"));
class FeedMedia extends sequelize_1.Model {
}
FeedMedia.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    postId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'post_id',
    },
    mediaUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        field: 'media_url',
    },
    mediaType: {
        type: sequelize_1.DataTypes.ENUM('photo', 'video'),
        allowNull: false,
        field: 'media_type',
    },
    thumbnailUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        field: 'thumbnail_url',
    },
    fileSizeBytes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        field: 'file_size_bytes',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'created_at',
    },
}, {
    sequelize: database_1.default,
    tableName: 'feed_media',
    timestamps: true,
    paranoid: false,
});
exports.default = FeedMedia;
//# sourceMappingURL=FeedMedia.js.map