const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    post_id: { type: DataTypes.INTEGER, allowNull: false, field: 'post_id' },
    user_id: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' }
}, {
    tableName: 'likes',
    timestamps: false,
    createdAt: 'created_at'
});

module.exports = Like;
