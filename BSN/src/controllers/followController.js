const { User, Follow, Notification } = require('../models');
const { sequelize } = require('../config/database');

// @route   POST /api/users/:userId/follow
// @desc    Toggle follow/unfollow a user
// @access  Private
exports.toggleFollow = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const targetUserId = req.params.userId;

        if (targetUserId === req.user.id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
        }

        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if already following
        const existingFollow = await Follow.findOne({
            where: { followerId: req.user.id, followingId: targetUserId }
        });

        if (existingFollow) {
            // Unfollow
            await existingFollow.destroy({ transaction });
            await transaction.commit();

            return res.json({
                success: true,
                message: `Unfollowed ${targetUser.username}`,
                data: { following: false }
            });
        }

        // Follow
        await Follow.create({
            followerId: req.user.id,
            followingId: targetUserId
        }, { transaction });

        // Create notification
        await Notification.create({
            userId: targetUserId,
            senderId: req.user.id,
            type: 'follow',
            content: `${req.user.username} started following you`
        }, { transaction });

        await transaction.commit();

        res.json({
            success: true,
            message: `Now following ${targetUser.username}`,
            data: { following: true }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in toggleFollow:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/users/:userId/followers
// @desc    Get followers of a user
// @access  Public
exports.getFollowers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const targetUser = await User.findByPk(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { count, rows: follows } = await Follow.findAndCountAll({
            where: { followingId: req.params.userId },
            include: [{
                model: User,
                as: 'follower',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                followers: follows.map(f => f.follower),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getFollowers:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/users/:userId/following
// @desc    Get users that a user is following
// @access  Public
exports.getFollowing = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const targetUser = await User.findByPk(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { count, rows: follows } = await Follow.findAndCountAll({
            where: { followerId: req.params.userId },
            include: [{
                model: User,
                as: 'following',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                following: follows.map(f => f.following),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getFollowing:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
