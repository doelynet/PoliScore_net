const express = require('express');
const router = express.Router({ mergeParams: true });
const { vote, results } = require('../controllers/pollController');
const { protect } = require('../middleware/auth');

// POST /api/posts/:postId/poll/vote
router.post('/:postId/poll/vote', protect, vote);
// GET /api/posts/:postId/poll/results
router.get('/:postId/poll/results', results);

module.exports = router;
