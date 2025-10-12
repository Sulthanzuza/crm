
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');


const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });



const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS'];
for (const k of required) {
  if (!process.env[k] || String(process.env[k]).trim() === '') {
    throw new Error(`Missing env ${k} for database connection`);
  }
}

let sslOption = undefined;
const useSSL = (process.env.DB_SSL || 'true').toLowerCase() !== 'false';
const caPath = process.env.DB_SSL_CA_PATH; 
if (useSSL) {
  if (caPath && fs.existsSync(caPath)) {
    sslOption = { ca: fs.readFileSync(caPath, 'utf8') }; 
  } else {
    sslOption = { require: true, rejectUnauthorized: false }; 
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslOption ? { ssl: sslOption } : {},
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
  }
}

module.exports = { sequelize, connectDB };
