const { User, Post, Follow } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// @route   GET /api/users/:username
// @desc    Get user profile by username
// @access  Public
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { username: req.params.username },
            attributes: { exclude: ['passwordHash'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const followersCount = await Follow.count({ where: { followingId: user.id } });
        const followingCount = await Follow.count({ where: { followerId: user.id } });
        const postsCount = await Post.count({ where: { userId: user.id } });

        res.json({
            success: true,
            data: {
                user,
                stats: { followersCount, followingCount, postsCount }
            }
        });
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/users/profile
// @desc    Update own profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const allowedFields = [
            'fullName', 'bio', 'profilePicture', 'coverPhoto',
            'businessType', 'industry', 'website', 'location'
        ];
        const updates = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        await User.update(updates, { where: { id: req.user.id }, individualHooks: true });

        const updatedUser = await User.findByPk(req.user.id, {
            attributes: { exclude: ['passwordHash'] }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/users/search
// @desc    Search users by username, fullName, businessType, or industry
// @access  Public
exports.searchUsers = async (req, res) => {
    try {
        const { q, businessType, industry } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const where = {};

        if (q) {
            where[Op.or] = [
                { username: { [Op.iLike]: `%${q}%` } },
                { fullName: { [Op.iLike]: `%${q}%` } }
            ];
        }

        if (businessType) {
            where.businessType = businessType;
        }

        if (industry) {
            where.industry = { [Op.iLike]: `%${industry}%` };
        }

        const { count, rows: users } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['passwordHash'] },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in searchUsers:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   DELETE /api/users/me
// @desc    Delete own account and all associated data
// @access  Private
exports.deleteAccount = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const user = await User.findByPk(req.user.id, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // onDelete: 'CASCADE' on all FK constraints handles
        // posts, comments, likes, follows, notifications, connections, messages
        await user.destroy({ transaction: t });
        await t.commit();

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error in deleteAccount:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};