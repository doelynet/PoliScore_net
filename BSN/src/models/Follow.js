const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Follow = sequelize.define('Follow', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    followerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    followingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'follows',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['followerId', 'followingId']
        },
        {
            fields: ['followerId']
        },
        {
            fields: ['followingId']
        }
    ]
});

module.exports = Follow;