const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    sendRequest,
    acceptRequest,
    rejectRequest,
    blockUser,
    getConnections,
    getPendingRequests
} = require('../controllers/connectionController');

// All routes require authentication
router.use(protect);

router.get('/', getConnections);
router.get('/pending', getPendingRequests);
router.post('/:userId', sendRequest);
router.put('/:connectionId/accept', acceptRequest);
router.put('/:connectionId/reject', rejectRequest);
router.post('/:userId/block', blockUser);

module.exports = router;
