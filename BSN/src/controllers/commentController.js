const { Comment, Post, User, Notification } = require('../models');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');

// @route   POST /api/posts/:postId/comments
// @desc    Add comment to a post
// @access  Private
exports.addComment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await transaction.rollback();
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const post = await Post.findByPk(req.params.postId);
        if (!post) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const comment = await Comment.create({
            content: req.body.content,
            userId: req.user.id,
            postId: post.id
        }, { transaction });

        // Increment comment count on the post
        await post.increment('commentsCount', { transaction });

        // Create notification for post owner (if not self-commenting)
        if (post.userId !== req.user.id) {
            await Notification.create({
                userId: post.userId,
                senderId: req.user.id,
                type: 'comment',
                postId: post.id,
                commentId: comment.id,
                content: `${req.user.username} commented on your post`
            }, { transaction });
        }

        await transaction.commit();

        // Re-fetch with author
        const fullComment = await Comment.findByPk(comment.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: { comment: fullComment }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in addComment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/posts/:postId/comments
// @desc    Get comments for a post (paginated)
// @access  Public
exports.getPostComments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const post = await Post.findByPk(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const { count, rows: comments } = await Comment.findAndCountAll({
            where: { postId: req.params.postId },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                comments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getPostComments:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   DELETE /api/comments/:id
// @desc    Delete own comment
// @access  Private
exports.deleteComment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const comment = await Comment.findByPk(req.params.id);

        if (!comment) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        if (comment.userId !== req.user.id) {
            await transaction.rollback();
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
        }

        const post = await Post.findByPk(comment.postId);

        await comment.destroy({ transaction });

        // Decrement comment count on the post
        if (post) {
            await post.decrement('commentsCount', { transaction });
        }

        await transaction.commit();

        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in deleteComment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
