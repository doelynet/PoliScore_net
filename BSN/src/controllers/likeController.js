const { Like, Post, User, Notification } = require('../models');
const { sequelize } = require('../config/database');

// @route   POST /api/posts/:postId/like
// @desc    Toggle like on a post
// @access  Private
exports.toggleLike = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const post = await Post.findByPk(req.params.postId);
        if (!post) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Check if already liked
        const existingLike = await Like.findOne({
            where: { userId: req.user.id, postId: post.id }
        });

        if (existingLike) {
            // Unlike
            await existingLike.destroy({ transaction });
            await post.decrement('likesCount', { transaction });
            await transaction.commit();

            return res.json({
                success: true,
                message: 'Post unliked',
                data: { liked: false, likesCount: post.likesCount - 1 }
            });
        }

        // Like
        await Like.create({
            userId: req.user.id,
            postId: post.id
        }, { transaction });

        await post.increment('likesCount', { transaction });

        // Create notification for post owner (if not self-liking)
        if (post.userId !== req.user.id) {
            await Notification.create({
                userId: post.userId,
                senderId: req.user.id,
                type: 'like',
                postId: post.id,
                content: `${req.user.username} liked your post`
            }, { transaction });
        }

        await transaction.commit();

        res.json({
            success: true,
            message: 'Post liked',
            data: { liked: true, likesCount: post.likesCount + 1 }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in toggleLike:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/posts/:postId/likes
// @desc    Get users who liked a post
// @access  Public
exports.getPostLikes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const post = await Post.findByPk(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const { count, rows: likes } = await Like.findAndCountAll({
            where: { postId: req.params.postId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                likes,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getPostLikes:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
