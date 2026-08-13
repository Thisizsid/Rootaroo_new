"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = testDatabaseConnection;
const sequelize_1 = require("sequelize");
const env_1 = require("./env");
const socketPath = process.env.DB_SOCKET || '';
const sequelize = new sequelize_1.Sequelize(env_1.env.db.name, env_1.env.db.user, env_1.env.db.password, {
    // When DB_SOCKET is set (XAMPP), prefer unix socket over TCP
    ...(socketPath
        ? { dialectOptions: { socketPath } }
        : { host: env_1.env.db.host, port: env_1.env.db.port }),
    dialect: 'mysql',
    logging: env_1.env.nodeEnv === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true,
        paranoid: true, // Enable soft deletes by default
        freezeTableName: false,
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
exports.default = sequelize;
async function testDatabaseConnection() {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connection established successfully.');
    }
    catch (error) {
        console.error('✗ Unable to connect to the database:', error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map