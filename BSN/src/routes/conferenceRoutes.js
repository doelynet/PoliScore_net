const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createConference,
    joinConference,
    leaveConference,
    getActiveConferences
} = require('../controllers/conferenceController');

router.get('/', getActiveConferences);
router.post('/', protect, createConference);
router.post('/:id/join', protect, joinConference);
router.post('/:id/leave', protect, leaveConference);

module.exports = router;
