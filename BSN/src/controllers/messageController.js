const { User, Conversation, Message, Connection } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the current user
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Find conversations where user is a participant
        const { count, rows: conversations } = await Conversation.findAndCountAll({
            where: sequelize.where(
                sequelize.fn('JSON_CONTAINS', sequelize.col('participantIds'), JSON.stringify(req.user.id)),
                true
            ),
            order: [['lastMessageAt', 'DESC']],
            limit,
            offset
        });

        // Enrich with other participant info and last message
        const enriched = await Promise.all(conversations.map(async (conv) => {
            const otherId = conv.participantIds.find(id => id !== req.user.id);
            const otherUser = await User.findByPk(otherId, {
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified']
            });

            const lastMessage = await Message.findOne({
                where: { conversationId: conv.id },
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'content', 'senderId', 'messageType', 'isRead', 'createdAt']
            });

            const unreadCount = await Message.count({
                where: {
                    conversationId: conv.id,
                    senderId: { [Op.ne]: req.user.id },
                    isRead: false
                }
            });

            return {
                id: conv.id,
                participant: otherUser,
                lastMessage,
                unreadCount,
                lastMessageAt: conv.lastMessageAt
            };
        }));

        res.json({
            success: true,
            data: {
                conversations: enriched,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        // PostgreSQL doesn't have JSON_CONTAINS — use fallback query
        if (error.message && error.message.includes('JSON_CONTAINS')) {
            return exports._getConversationsPg(req, res);
        }
        console.error('Error in getConversations:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// PostgreSQL-compatible fallback for getConversations
exports._getConversationsPg = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: conversations } = await Conversation.findAndCountAll({
            where: sequelize.where(
            sequelize.cast(sequelize.col('participantIds'), 'jsonb'),
            { [Op.contains]: sequelize.cast(`["${req.user.id}"]`, 'jsonb') }
        ),
            order: [['lastMessageAt', 'DESC']],
            limit,
            offset
        });

        const enriched = await Promise.all(conversations.map(async (conv) => {
            const otherId = conv.participantIds.find(id => id !== req.user.id);
            const otherUser = await User.findByPk(otherId, {
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified']
            });

            const lastMessage = await Message.findOne({
                where: { conversationId: conv.id },
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'content', 'senderId', 'messageType', 'isRead', 'createdAt']
            });

            const unreadCount = await Message.count({
                where: {
                    conversationId: conv.id,
                    senderId: { [Op.ne]: req.user.id },
                    isRead: false
                }
            });

            return {
                id: conv.id,
                participant: otherUser,
                lastMessage,
                unreadCount,
                lastMessageAt: conv.lastMessageAt
            };
        }));

        res.json({
            success: true,
            data: {
                conversations: enriched,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getConversations (PG):', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   POST /api/messages/conversations/:userId
// @desc    Get or create conversation with a user
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
    try {
        const otherUserId = req.params.userId;

        if (otherUserId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
        }

        const otherUser = await User.findByPk(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if users are connected
        const connection = await Connection.findOne({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { requesterId: req.user.id, addresseeId: otherUserId },
                    { requesterId: otherUserId, addresseeId: req.user.id }
                ]
            }
        });

        if (!connection) {
            return res.status(403).json({ success: false, message: 'You must be connected to message this user' });
        }

        // Sort IDs for consistent lookup
        const sortedIds = [req.user.id, otherUserId].sort();

        // Try to find existing conversation (Postgres-compatible)
        let conversation = await Conversation.findOne({
            where: sequelize.where(
                sequelize.cast(sequelize.col('participantIds'), 'jsonb'),
                { [Op.contains]: sequelize.cast(JSON.stringify(sortedIds), 'jsonb') }
            )
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participantIds: sortedIds
            });
        }

        res.json({
            success: true,
            data: {
                conversation: {
                    id: conversation.id,
                    participant: {
                        id: otherUser.id,
                        username: otherUser.username,
                        fullName: otherUser.fullName,
                        profilePicture: otherUser.profilePicture,
                        isVerified: otherUser.isVerified
                    },
                    lastMessageAt: conversation.lastMessageAt
                }
            }
        });
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
// @route   GET /api/messages/conversations/:conversationId
// @desc    Get messages in a conversation (paginated)
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const conversation = await Conversation.findByPk(req.params.conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Verify user is a participant
        if (!conversation.participantIds.includes(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const offset = (page - 1) * limit;

        const { count, rows: messages } = await Message.findAndCountAll({
            where: { conversationId: conversation.id },
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'fullName', 'profilePicture']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Mark unread messages from the other user as read
        await Message.update(
            { isRead: true },
            {
                where: {
                    conversationId: conversation.id,
                    senderId: { [Op.ne]: req.user.id },
                    isRead: false
                }
            }
        );

        res.json({
            success: true,
            data: {
                messages: messages.reverse(),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   POST /api/messages/conversations/:conversationId
// @desc    Send a message in a conversation
// @access  Private
exports.sendMessage = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const conversation = await Conversation.findByPk(req.params.conversationId);
        if (!conversation) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        if (!conversation.participantIds.includes(req.user.id)) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: 'Not a participant in this conversation' });
        }

        const { content, messageType } = req.body;

        const message = await Message.create({
            conversationId: conversation.id,
            senderId: req.user.id,
            content,
            messageType: messageType || 'text'
        }, { transaction });

        // Update conversation timestamp
        conversation.lastMessageAt = new Date();
        await conversation.save({ transaction });

        await transaction.commit();

        // Reload with sender info
        const fullMessage = await Message.findByPk(message.id, {
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'fullName', 'profilePicture']
            }]
        });

        res.status(201).json({
            success: true,
            data: { message: fullMessage }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in sendMessage:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
