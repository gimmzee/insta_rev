const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    post_id: { type: DataTypes.INTEGER, allowNull: false, field: 'post_id' },
    user_id: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    content: { type: DataTypes.TEXT, allowNull: false }
}, {
    tableName: 'comments',
    timestamps: true,
    underscored: true
});

module.exports = Comment;
