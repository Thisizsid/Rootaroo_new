import { Sequelize } from 'sequelize';
import { env } from './env';

const socketPath = process.env.DB_SOCKET || '';

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  // When DB_SOCKET is set (XAMPP), prefer unix socket over TCP
  ...(socketPath
    ? { dialectOptions: { socketPath } }
    : { host: env.db.host, port: env.db.port }),
  dialect: 'mysql',
  logging: env.nodeEnv === 'development' ? console.log : false,
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

export default sequelize;

export async function testDatabaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully.');
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    throw error;
  }
}
