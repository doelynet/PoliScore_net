const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            len: [1, 500]
        }
    },
    mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    mediaType: {
        type: DataTypes.ENUM('image', 'video', 'link'),
        allowNull: true,
    },
    likesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    // v2.0 fields
    postType: {
        type: DataTypes.ENUM('standard', 'poll', 'conference'),
        allowNull: false,
        defaultValue: 'standard'
    },
    pollData: {
        type: DataTypes.JSON,
        allowNull: true
    },
    conferenceData: {
        type: DataTypes.JSON,
        allowNull: true
    },
    viewsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    sharesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    commentsCount:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    userId:{
        type: DataTypes.UUID,
        allowNull: false,
        references:{
            model:'users',
            key:'id'
        }
    },
    billId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'bills', key: 'id' }
    },
    forumCategory: {
        type: DataTypes.ENUM('general','taxation','trade','labor','investment','digital'),
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'posts'
});

module.exports = Post;

