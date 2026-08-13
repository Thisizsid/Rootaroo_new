"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../../config/env");
const logger = winston_1.default.createLogger({
    level: env_1.env.logLevel,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), env_1.env.nodeEnv === 'development'
        ? winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level}]: ${message}${stack ? '\n' + stack : ''}`;
        }))
        : winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
    ],
});
exports.default = logger;
//# sourceMappingURL=logger.js.map