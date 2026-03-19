const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Connection = sequelize.define('Connection', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    requesterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    addresseeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    tableName: 'connections',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['requesterId', 'addresseeId']
        },
        {
            fields: ['addresseeId', 'status']
        }
    ]
});

module.exports = Connection;
