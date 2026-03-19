const { sequelize } = require('../config/database');
const User = require('./user');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');
const Follow = require('./Follow');
const Notification = require('./Notification');
const Bill = require('./Bill');
const BillFollow = require('./BillFollow');
const BillVote = require('./BillVote');
const Connection = require('./Connection');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Report = require('./Report');
const BillStage = require('./BillStage');

// ── User ↔ Post ──
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// ── User ↔ Comment ──
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// ── Post ↔ Comment ──
Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// ── Comment (parent/child) ──
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

// ── User ↔ Like ──
User.hasMany(Like, { foreignKey: 'userId', as: 'likes' });
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Post ↔ Like ──
Post.hasMany(Like, { foreignKey: 'postId', as: 'likes' });
Like.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// ── Follow (direct associations for controller includes) ──
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'following' });

// ── Follow (self-referential User ↔ User through table) ──
User.belongsToMany(User, {
    through: Follow,
    as: 'following',
    foreignKey: 'followerId',
    otherKey: 'followingId'
});
User.belongsToMany(User, {
    through: Follow,
    as: 'followers',
    foreignKey: 'followingId',
    otherKey: 'followerId'
});

// ── User ↔ Notification (recipient) ──
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'recipient' });

// ── User ↔ Notification (sender) ──
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// ── Post ↔ Notification ──
Notification.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// ── Comment ↔ Notification ──
Notification.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });

// ── Bill & BillFollow ──
User.hasMany(Bill, { foreignKey: 'creatorId', as: 'bills' });
Bill.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

Bill.belongsToMany(User, {
    through: BillFollow,
    as: 'followers',
    foreignKey: 'billId',
    otherKey: 'userId'
});
User.belongsToMany(Bill, {
    through: BillFollow,
    as: 'followedBills',
    foreignKey: 'userId',
    otherKey: 'billId'
});

// Bill votes
Bill.hasMany(BillVote, { foreignKey: 'billId', as: 'votes' });
BillVote.belongsTo(Bill, { foreignKey: 'billId', as: 'bill' });
BillVote.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Bill.hasMany(BillStage, { foreignKey: 'billId', as: 'stageHistory' });
BillStage.belongsTo(Bill, { foreignKey: 'billId' });

// ── Connection (self-referential User ↔ User) ──
Connection.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
Connection.belongsTo(User, { foreignKey: 'addresseeId', as: 'addressee' });

// ── Conversation ↔ Message ──
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// ── Message ↔ User (sender) ──
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });

// ── Report ↔ User ──
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });

// Sync tables
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Error synchronizing database:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Post,
    Comment,
    Like,
    Follow,
    Notification,
    Bill,
    BillFollow,
    BillStage,
    BillVote,
    Connection,
    Conversation,
    Message,
    Report,
    syncDatabase
};