const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    participantIds: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: 'Array of 2 user UUIDs'
    },
    lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'conversations',
    timestamps: true,
    indexes: [
        {
            fields: ['lastMessageAt']
        }
    ]
});

module.exports = Conversation;
