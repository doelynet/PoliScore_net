const { Post, User, Comment, Like } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @route   POST /api/posts/:id/poll-vote
// @desc    Vote on a poll in a post
// @access  Private
exports.voteOnPoll = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified']
            }]
        });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.postType !== 'poll' || !post.pollData) {
            return res.status(400).json({ success: false, message: 'Not a poll post' });
        }
        
        const optionIndex = req.body.optionIndex;
        
        if (optionIndex === undefined || optionIndex < 0 || optionIndex >= post.pollData.options.length) {
            return res.status(400).json({ success: false, message: 'Invalid option index' });
        }
        
        const pollData = JSON.parse(JSON.stringify(post.pollData));
        
        if (!pollData.voters) pollData.voters = [];
        
        if (pollData.voters.includes(req.user.id)) {
            return res.status(400).json({ success: false, message: 'You have already voted on this poll' });
        }
        
        pollData.options[optionIndex].votes = (pollData.options[optionIndex].votes || 0) + 1;
        pollData.voters.push(req.user.id);
        
        await post.update({ pollData });

        res.json({ success: true, message: 'Vote registered successfully', data: { post } });
    } catch (error) {
        console.error('Error in voteOnPoll:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
exports.createPost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { content, mediaUrl, mediaType } = req.body;

        const post = await Post.create({
            content,
            mediaUrl,
            mediaType,
            userId: req.user.id
        });

        // Re-fetch with author info
        const fullPost = await Post.findByPk(post.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: { post: fullPost }
        });
    } catch (error) {
        console.error('Error in createPost:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/posts
// @desc    Get paginated feed (all posts, newest first)
// @access  Public
exports.getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: posts } = await Post.findAndCountAll({
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Public
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
                },
                {
                    model: Comment,
                    as: 'comments',
                    include: [{
                        model: User,
                        as: 'author',
                        attributes: ['id', 'username', 'fullName', 'profilePicture']
                    }],
                    order: [['createdAt', 'DESC']],
                    limit: 20
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        res.json({ success: true, data: { post } });
    } catch (error) {
        console.error('Error in getPostById:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/posts/:id
// @desc    Update own post
// @access  Private
exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this post' });
        }

        const { content, mediaUrl, mediaType } = req.body;
        await post.update({ content, mediaUrl, mediaType });

        const updatedPost = await Post.findByPk(post.id, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified']
            }]
        });

        res.json({
            success: true,
            message: 'Post updated successfully',
            data: { post: updatedPost }
        });
    } catch (error) {
        console.error('Error in updatePost:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   DELETE /api/posts/:id
// @desc    Delete own post
// @access  Private
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }

        await post.destroy();

        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error in deletePost:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user
// @access  Public
exports.getUserPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: posts } = await Post.findAndCountAll({
            where: { userId: req.params.userId },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username', 'fullName', 'profilePicture', 'isVerified', 'businessType']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getUserPosts:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
