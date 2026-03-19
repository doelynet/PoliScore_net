const { User, Post, Comment, Report, Notification, Bill } = require('../models');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// @route   GET /api/admin/stats
// @desc    Dashboard statistics
// @access  Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalPosts, totalComments, pendingReports, totalBills] = await Promise.all([
            User.count(),
            Post.count(),
            Comment.count(),
            Report.count({ where: { status: 'pending' } }),
            Bill.count()
        ]);

        const newUsersToday = await User.count({
            where: {
                createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
        });

        const newPostsToday = await Post.count({
            where: {
                createdAt: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
        });

        // Count bills by stage
        const stages = ['draft', 'first_reading', 'committee_stage', 'second_reading', 'third_reading', 'presidential_assent', 'enacted', 'rejected'];
        const billsByStage = {};
        for (const stage of stages) {
            billsByStage[stage] = await Bill.count({ where: { status: stage } });
        }

        res.json({
            success: true,
            data: {
                totalUsers,
                totalPosts,
                totalComments,
                pendingReports,
                newUsersToday,
                newPostsToday,
                totalBills,
                billsByStage
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/admin/users
// @desc    List users (paginated, filterable)
// @access  Admin
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { role, search, businessType } = req.query;

        const where = {};
        if (role) where.role = role;
        if (businessType) where.businessType = businessType;
        if (search) {
            where[Op.or] = [
                { username: { [Op.iLike]: `%${search}%` } },
                { fullName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows: users } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['passwordHash', 'passwordResetToken', 'passwordResetExpires'] },
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
        console.error('Error in getUsers:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'moderator', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be user, moderator, or admin' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent demoting yourself
        if (user.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot change your own role' });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: `User role updated to ${role}`,
            data: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error in updateUserRole:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/admin/users/:id/suspend
// @desc    Suspend/unsuspend a user (sets isVerified to false as a soft disable)
// @access  Admin
exports.suspendUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot suspend yourself' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot suspend another admin' });
        }

        // Toggle: if role is 'user', change to a suspended state; we use the 'role' field
        // by setting a flag in a separate column or simply toggling a boolean
        // For simplicity, we use isVerified as a "suspended" indicator in reverse
        const wasSuspended = !user.isVerified;
        user.isVerified = wasSuspended; // Toggle

        await user.save();

        res.json({
            success: true,
            message: wasSuspended ? `User ${user.username} reinstated` : `User ${user.username} suspended`,
            data: { id: user.id, username: user.username, suspended: !user.isVerified }
        });
    } catch (error) {
        console.error('Error in suspendUser:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   DELETE /api/admin/content/:type/:id
// @desc    Delete any post or comment (admin moderation)
// @access  Admin
exports.deleteContent = async (req, res) => {
    try {
        const { type, id } = req.params;

        if (type === 'post') {
            const post = await Post.findByPk(id);
            if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
            await post.destroy();
            return res.json({ success: true, message: 'Post deleted by admin' });
        }

        if (type === 'comment') {
            const comment = await Comment.findByPk(id);
            if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
            await comment.destroy();
            return res.json({ success: true, message: 'Comment deleted by admin' });
        }

        return res.status(400).json({ success: false, message: 'Type must be "post" or "comment"' });
    } catch (error) {
        console.error('Error in deleteContent:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
