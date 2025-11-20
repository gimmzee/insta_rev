const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config/config.env' });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
        timezone: '+09:00'
    }
);

sequelize.authenticate()
    .then(() => console.log('✓ MariaDB 연결 성공'))
    .catch(err => console.error('✗ MariaDB 연결 실패:', err));

module.exports = sequelize;
