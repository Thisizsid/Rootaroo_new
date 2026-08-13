"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_BUCKET = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("./env");
const s3Config = {
    region: env_1.env.s3.region || 'auto',
    endpoint: env_1.env.s3.endpoint || undefined,
    forcePathStyle: !!env_1.env.s3.endpoint,
    credentials: {
        accessKeyId: env_1.env.s3.accessKeyId,
        secretAccessKey: env_1.env.s3.secretAccessKey,
    },
};
exports.s3Client = new client_s3_1.S3Client(s3Config);
exports.S3_BUCKET = env_1.env.s3.bucket;
//# sourceMappingURL=s3.js.map