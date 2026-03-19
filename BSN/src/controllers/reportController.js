const { Report, User } = require('../models');
const { Op } = require('sequelize');

// @route   POST /api/reports
// @desc    File a report
// @access  Private
exports.createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        // Check for existing report by same user on same target
        const existing = await Report.findOne({
            where: {
                reporterId: req.user.id,
                targetType,
                targetId,
                status: { [Op.in]: ['pending', 'reviewed'] }
            }
        });

        if (existing) {
            return res.status(409).json({ success: false, message: 'You have already reported this content' });
        }

        const report = await Report.create({
            reporterId: req.user.id,
            targetType,
            targetId,
            reason,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted',
            data: { report }
        });
    } catch (error) {
        console.error('Error in createReport:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   GET /api/reports
// @desc    List reports (admin only, filterable by status)
// @access  Admin
exports.getReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { status, targetType } = req.query;

        const where = {};
        if (status) where.status = status;
        if (targetType) where.targetType = targetType;

        const { count, rows: reports } = await Report.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'reporter',
                    attributes: ['id', 'username', 'fullName', 'profilePicture']
                },
                {
                    model: User,
                    as: 'resolver',
                    attributes: ['id', 'username', 'fullName']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(count / limit),
                    totalItems: count,
                    itemsPerPage: limit
                }
            }
        });
    } catch (error) {
        console.error('Error in getReports:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// @route   PUT /api/reports/:id/resolve
// @desc    Resolve or dismiss a report (admin)
// @access  Admin
exports.resolveReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        if (['resolved', 'dismissed'].includes(report.status)) {
            return res.status(400).json({ success: false, message: `Report already ${report.status}` });
        }

        const { status, resolution } = req.body;
        if (!['resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be "resolved" or "dismissed"' });
        }

        report.status = status;
        report.resolution = resolution || null;
        report.resolvedBy = req.user.id;
        await report.save();

        res.json({
            success: true,
            message: `Report ${status}`,
            data: { report }
        });
    } catch (error) {
        console.error('Error in resolveReport:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
