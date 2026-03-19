const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
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
    type: {
        type: DataTypes.ENUM(
            'follow',
            'like',
            'comment',
            'mention',
            'reply',
            'share',
            'system',
            'announcement'
        ),
        allowNull: false
    },
    senderId: {
        type: DataTypes.UUID,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    postId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'posts',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    commentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'comments',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    content: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        {
            fields: ['userId', 'isRead']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Notification;
