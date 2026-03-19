const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { messageValidator } = require('../middleware/validator');
const {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage
} = require('../controllers/messageController');

// All routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations/with/:userId', getOrCreateConversation);
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/:conversationId/messages', messageValidator, sendMessage);

module.exports = router;
