export declare const env: {
    nodeEnv: string;
    port: number;
    fcm: {
        enabled: boolean;
        serverKey: string;
        projectId: string;
    };
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
    };
    redis: {
        host: string;
        port: number;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
    };
    s3: {
        endpoint: string;
        accessKeyId: string;
        secretAccessKey: string;
        bucket: string;
        region: string;
        useSsl: boolean;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    sentryDsn: string;
    corsOrigins: string[];
    logLevel: string;
    uploadDir: string;
};
//# sourceMappingURL=env.d.ts.map