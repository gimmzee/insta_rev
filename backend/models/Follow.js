const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Follow = sequelize.define('Follow', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    follower_id: { type: DataTypes.INTEGER, allowNull: false, field: 'follower_id' },
    following_id: { type: DataTypes.INTEGER, allowNull: false, field: 'following_id' }
}, {
    tableName: 'follows',
    timestamps: false,
    createdAt: 'created_at'
});

module.exports = Follow;
