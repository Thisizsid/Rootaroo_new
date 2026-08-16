require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// When DB_SOCKET is set (XAMPP), prefer a unix socket over TCP — mirrors
// src/config/database.ts so CLI migrations hit the same database.
const socketPath = process.env.DB_SOCKET || '';

const socketOptions = socketPath
  ? { dialectOptions: { socketPath } }
  : {};

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rootaroo_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    ...socketOptions,
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders',
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rootaroo_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    ...socketOptions,
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    ...socketOptions,
    logging: false,
    pool: {
      max: 25,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },
};
