const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    postId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'posts',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'likes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'postId']
        },
        {
            fields: ['postId']
        },
        {
            fields: ['userId']
        }
    ]
});

module.exports = Like;