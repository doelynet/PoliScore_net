const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'conversations',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    senderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 2000]
        }
    },
    messageType: {
        type: DataTypes.ENUM('text', 'image', 'link'),
        allowNull: false,
        defaultValue: 'text'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
        {
            fields: ['conversationId', 'createdAt']
        },
        {
            fields: ['senderId']
        }
    ]
});

module.exports = Message;
