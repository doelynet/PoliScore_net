const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Report = sequelize.define('Report', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    targetType: {
        type: DataTypes.ENUM('post', 'comment', 'user'),
        allowNull: false
    },
    targetId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    reason: {
        type: DataTypes.ENUM('spam', 'harassment', 'misinformation', 'hate_speech', 'other'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'pending'
    },
    resolvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    resolution: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'reports',
    timestamps: true,
    indexes: [
        {
            fields: ['status']
        },
        {
            fields: ['targetType', 'targetId']
        },
        {
            fields: ['reporterId']
        }
    ]
});

module.exports = Report;
