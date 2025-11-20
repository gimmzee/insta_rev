const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    caption: { type: DataTypes.TEXT },
    image_url: { type: DataTypes.STRING(255), allowNull: false, field: 'image_url' },
    likes_count: { type: DataTypes.INTEGER, defaultValue: 0, field: 'likes_count' },
    comments_count: { type: DataTypes.INTEGER, defaultValue: 0, field: 'comments_count' }
}, {
    tableName: 'posts',
    timestamps: true,
    underscored: true
});

module.exports = Post;
