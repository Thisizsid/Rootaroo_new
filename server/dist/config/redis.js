"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
const redis = new ioredis_1.default({
    host: env_1.env.redis.host,
    port: env_1.env.redis.port,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
});
redis.on('connect', () => {
    console.log('✓ Redis connection established.');
});
redis.on('error', (err) => {
    console.error('✗ Redis connection error:', err.message);
});
exports.default = redis;
//# sourceMappingURL=redis.js.map