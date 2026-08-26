const { Sequelize } = require('sequelize');
require('dotenv').config();

const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  min: parseInt(process.env.DB_POOL_MIN) || 0,
  acquire: 30000,
  idle: 5000,
  evict: 1000
};

const dialectOptions = {
  ssl: process.env.DB_SSL === 'false' ? false : {
    require: true,
    rejectUnauthorized: false
  },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  statement_timeout: 30000
};

const retryConfig = {
  max: 3,
  match: [
    /SequelizeConnectionError/,
    /SequelizeConnectionRefusedError/,
    /SequelizeHostNotFoundError/,
    /SequelizeHostNotReachableError/,
    /SequelizeInvalidConnectionError/,
    /SequelizeConnectionTimedOutError/,
    /ECONNRESET/,
    /ETIMEDOUT/
  ]
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions,
    logging: false,
    pool: poolConfig,
    retry: retryConfig
  })
  : new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      dialectOptions,
      logging: false,
      pool: poolConfig,
      retry: retryConfig
    }
  );

module.exports = sequelize;
