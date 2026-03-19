const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { reportValidator } = require('../middleware/validator');
const {
    createReport,
    getReports,
    resolveReport
} = require('../controllers/reportController');

router.post('/', protect, reportValidator, createReport);
router.get('/', protect, adminOnly, getReports);
router.put('/:id/resolve', protect, adminOnly, resolveReport);

module.exports = router;
