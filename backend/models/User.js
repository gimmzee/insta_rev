const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    full_name: { type: DataTypes.STRING(100), field: 'full_name' },
    bio: { type: DataTypes.TEXT },
    profile_picture: { type: DataTypes.STRING(255), defaultValue: 'default-avatar.png', field: 'profile_picture' },
    followers_count: { type: DataTypes.INTEGER, defaultValue: 0, field: 'followers_count' },
    following_count: { type: DataTypes.INTEGER, defaultValue: 0, field: 'following_count' },
    posts_count: { type: DataTypes.INTEGER, defaultValue: 0, field: 'posts_count' }
}, {
    tableName: 'users',
    timestamps: true,
    underscored: true
});

User.beforeCreate(async (user) => {
    if (user.password) user.password = await bcrypt.hash(user.password, 10);
});

User.prototype.comparePassword = async function(pwd) {
    return await bcrypt.compare(pwd, this.password);
};

module.exports = User;
