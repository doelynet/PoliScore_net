const { Post, User } = require('../models');
const { sequelize } = require('../config/database');
const { generateRtcToken } = require('../utils/agora');

// @route   POST /api/conferences
// @desc    Create a conference (creates a conference-type post + returns Agora token)
// @access  Private
exports.createConference = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { content, channelName } = req.body;
        const channel = channelName || `conf_${Date.now()}_${req.user.id.slice(0, 8)}`;

        // Create a conference post
        const post = await Post.create({
            content: content || 'Live Conference',
            userId: req.user.id,
            postType: 'conference',
            conferenceData: {
                channelName: channel,
                hostId: req.user.id,
                status: 'active',
                startedAt: new Date().toISOString(),
                participants: [req.user.id]
            }
        }, { transaction });

        await transaction.commit();

        // Generate Agora token for the host
        const tokenData = generateRtcToken(channel, 0, 'publisher');

        const fullPost = await Post.findByPk(post.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture']
            }]
        });

        res.status(201).json({
            success: true,
            data: {
                conference: fullPost,
                agora: tokenData
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in createConference:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   POST /api/conferences/:id/join
// @desc    Join a conference (returns Agora token)
// @access  Private
exports.joinConference = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post || post.postType !== 'conference') {
            return res.status(404).json({ success: false, message: 'Conference not found' });
        }

        const confData = post.conferenceData || {};
        if (confData.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Conference has ended' });
        }

        // Add participant if not already present
        const participants = confData.participants || [];
        if (!participants.includes(req.user.id)) {
            participants.push(req.user.id);
            post.conferenceData = { ...confData, participants };
            await post.save();
        }

        const tokenData = generateRtcToken(confData.channelName, 0, 'publisher');

        res.json({
            success: true,
            data: {
                channelName: confData.channelName,
                agora: tokenData,
                participantCount: participants.length
            }
        });
    } catch (error) {
        console.error('Error in joinConference:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   POST /api/conferences/:id/leave
// @desc    Leave a conference
// @access  Private
exports.leaveConference = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post || post.postType !== 'conference') {
            return res.status(404).json({ success: false, message: 'Conference not found' });
        }

        const confData = post.conferenceData || {};
        const participants = (confData.participants || []).filter(id => id !== req.user.id);

        // If host leaves, end the conference
        if (confData.hostId === req.user.id) {
            post.conferenceData = {
                ...confData,
                participants,
                status: 'ended',
                endedAt: new Date().toISOString()
            };
        } else {
            post.conferenceData = { ...confData, participants };
        }

        await post.save();

        res.json({
            success: true,
            message: confData.hostId === req.user.id ? 'Conference ended' : 'Left conference',
            data: { participantCount: participants.length }
        });
    } catch (error) {
        console.error('Error in leaveConference:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/conferences
// @desc    List active conferences
// @access  Public
exports.getActiveConferences = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: conferences } = await Post.findAndCountAll({
            where: { postType: 'conference' },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Filter to only active conferences in the response
        const active = conferences.filter(c => c.conferenceData?.status === 'active');

        res.json({
            success: true,
            data: {
                conferences: active,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getActiveConferences:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
