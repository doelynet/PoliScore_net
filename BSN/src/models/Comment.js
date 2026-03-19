const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 350]
        }
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
    },
    likesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0
        }
    }
    ,
    // v2.0 fields
    commentType: {
        type: DataTypes.ENUM('comment', 'message', 'reply'),
        allowNull: false,
        defaultValue: 'comment'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    },
    isQuestion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isAnswered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'comments',
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'comments',
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['postId']
        },
        {
            fields: ['createdAt']
        }

    ]
});

module.exports = Comment;