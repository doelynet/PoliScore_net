const express = require('express');
const router = express.Router();
const { addComment, getPostComments, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { commentValidator } = require('../middleware/validator');

// Public
router.get('/posts/:postId/comments', getPostComments);

// Private
router.post('/posts/:postId/comments', protect, commentValidator, addComment);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;
