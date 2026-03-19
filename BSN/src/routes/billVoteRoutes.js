const express = require('express');
const router = express.Router({ mergeParams: true });
const { vote, results } = require('../controllers/billVoteController');
const { protect } = require('../middleware/auth');

// POST /api/bills/:id/vote
router.post('/:id/vote', protect, vote);
// GET /api/bills/:id/vote/results
router.get('/:id/vote/results', results);

module.exports = router;
