const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, getPostById, updatePost, deletePost, getUserPosts, voteOnPoll } = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const { postValidator } = require('../middleware/validator');

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.get('/user/:userId', getUserPosts);

// Private routes
router.post('/', protect, postValidator, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/poll-vote', protect, voteOnPoll);

module.exports = router;
