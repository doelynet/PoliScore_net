const { Notification, User } = require('../models');

// @route   GET /api/notifications
// @desc    Get notifications for current user (paginated)
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: notifications } = await Notification.findAndCountAll({
            where: { userId: req.user.id },
            include: [{
                model: User,
                as: 'sender',
                attributes: ['id', 'username', 'fullName', 'profilePicture']
            }],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // Count unread
        const unreadCount = await Notification.count({
            where: { userId: req.user.id, isRead: false }
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getNotifications:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await notification.update({ isRead: true });

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: { notification }
        });
    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.update(
            { isRead: true },
            { where: { userId: req.user.id, isRead: false } }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error in markAllAsRead:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
