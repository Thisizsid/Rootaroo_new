"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGroceryArchiveJob = startGroceryArchiveJob;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const models_1 = require("../database/models");
const logger_1 = __importDefault(require("../shared/utils/logger"));
/**
 * Archive grocery items that were bought more than 24 hours ago.
 * Runs every hour. Sets archivedAt to the current timestamp.
 */
function startGroceryArchiveJob() {
    node_cron_1.default.schedule('0 * * * *', async () => {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
            const [count] = await models_1.GroceryItem.update({ archivedAt: new Date() }, {
                where: {
                    isBought: true,
                    boughtAt: { [sequelize_1.Op.lte]: cutoff },
                    archivedAt: null,
                },
            });
            if (count > 0) {
                logger_1.default.info(`[Auto-Archive] Archived ${count} grocery items older than 24h`);
            }
        }
        catch (err) {
            logger_1.default.error('[Auto-Archive] Failed:', err);
        }
    });
    logger_1.default.info('[Auto-Archive] Cron job registered — runs every hour');
}
//# sourceMappingURL=grocery-archive.js.map