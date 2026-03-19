const { User, Connection, Notification } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// @route   POST /api/connections/:userId
// @desc    Send connection request
// @access  Private
exports.sendRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const addresseeId = req.params.userId;

        if (addresseeId === req.user.id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'You cannot connect with yourself' });
        }

        const addressee = await User.findByPk(addresseeId);
        if (!addressee) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check for existing connection in either direction
        const existing = await Connection.findOne({
            where: {
                [Op.or]: [
                    { requesterId: req.user.id, addresseeId },
                    { requesterId: addresseeId, addresseeId: req.user.id }
                ]
            }
        });

        if (existing) {
            await transaction.rollback();
            if (existing.status === 'blocked') {
                return res.status(403).json({ success: false, message: 'Cannot send connection request' });
            }
            return res.status(409).json({ success: false, message: `Connection already exists (${existing.status})` });
        }

        const connection = await Connection.create({
            requesterId: req.user.id,
            addresseeId
        }, { transaction });

        // Notify the addressee
        await Notification.create({
            userId: addresseeId,
            senderId: req.user.id,
            type: 'system',
            content: `${req.user.username} sent you a connection request`
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Connection request sent',
            data: { connection }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in sendRequest:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/connections/:connectionId/accept
// @desc    Accept a connection request
// @access  Private
exports.acceptRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const connection = await Connection.findByPk(req.params.connectionId);
        if (!connection) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Connection request not found' });
        }

        if (connection.addresseeId !== req.user.id) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: 'Only the addressee can accept this request' });
        }

        if (connection.status !== 'pending') {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: `Request already ${connection.status}` });
        }

        connection.status = 'accepted';
        await connection.save({ transaction });

        // Notify the requester
        await Notification.create({
            userId: connection.requesterId,
            senderId: req.user.id,
            type: 'system',
            content: `${req.user.username} accepted your connection request`
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: 'Connection accepted',
            data: { connection }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in acceptRequest:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/connections/:connectionId/reject
// @desc    Reject a connection request
// @access  Private
exports.rejectRequest = async (req, res) => {
    try {
        const connection = await Connection.findByPk(req.params.connectionId);
        if (!connection) {
            return res.status(404).json({ success: false, message: 'Connection request not found' });
        }

        if (connection.addresseeId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the addressee can reject this request' });
        }

        if (connection.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Request already ${connection.status}` });
        }

        await connection.destroy();

        res.json({
            success: true,
            message: 'Connection request rejected'
        });
    } catch (error) {
        console.error('Error in rejectRequest:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   POST /api/connections/:userId/block
// @desc    Block a user (creates or updates connection to 'blocked')
// @access  Private
exports.blockUser = async (req, res) => {
    try {
        const targetId = req.params.userId;

        if (targetId === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot block yourself' });
        }

        const target = await User.findByPk(targetId);
        if (!target) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Find existing connection in either direction
        let connection = await Connection.findOne({
            where: {
                [Op.or]: [
                    { requesterId: req.user.id, addresseeId: targetId },
                    { requesterId: targetId, addresseeId: req.user.id }
                ]
            }
        });

        if (connection) {
            connection.requesterId = req.user.id;
            connection.addresseeId = targetId;
            connection.status = 'blocked';
            await connection.save();
        } else {
            connection = await Connection.create({
                requesterId: req.user.id,
                addresseeId: targetId,
                status: 'blocked'
            });
        }

        res.json({
            success: true,
            message: `Blocked ${target.username}`,
            data: { connection }
        });
    } catch (error) {
        console.error('Error in blockUser:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/connections
// @desc    Get accepted connections
// @access  Private
exports.getConnections = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: connections } = await Connection.findAndCountAll({
            where: {
                status: 'accepted',
                [Op.or]: [
                    { requesterId: req.user.id },
                    { addresseeId: req.user.id }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
                },
                {
                    model: User,
                    as: 'addressee',
                    attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
                }
            ],
            order: [['updatedAt', 'DESC']],
            limit,
            offset
        });

        // Map to show the "other" user for each connection
        const mapped = connections.map(c => {
            const other = c.requesterId === req.user.id ? c.addressee : c.requester;
            return { connectionId: c.id, user: other, connectedAt: c.updatedAt };
        });

        res.json({
            success: true,
            data: {
                connections: mapped,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getConnections:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/connections/pending
// @desc    Get pending connection requests (received)
// @access  Private
exports.getPendingRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: requests } = await Connection.findAndCountAll({
            where: {
                addresseeId: req.user.id,
                status: 'pending'
            },
            include: [{
                model: User,
                as: 'requester',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                requests: requests.map(r => ({
                    connectionId: r.id,
                    user: r.requester,
                    requestedAt: r.createdAt
                })),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getPendingRequests:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
