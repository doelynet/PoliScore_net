const express = require('express');
const router = express.Router();
const { toggleLike, getPostLikes } = require('../controllers/likeController');
const { protect } = require('../middleware/auth');

// Public
router.get('/posts/:postId/likes', getPostLikes);

// Private
router.post('/posts/:postId/like', protect, toggleLike);

module.exports = router;
