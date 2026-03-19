const express = require('express');
const router = express.Router({ mergeParams: true });
const { vote, results, report } = require('../controllers/billVoteController');
const { protect } = require('../middleware/auth');

// POST /api/bills/:id/vote
router.post('/:id/vote', protect, vote);
// GET /api/bills/:id/vote/results
router.get('/:id/vote/results', results);
// GET /api/bills/:id/vote/reports - optional industry filter
router.get('/:id/vote/reports', report); // Reuse results for now, can differentiate in controller by req.path
// GET /api/bills/:id/vote/history - current user's voting history
router.get('/:id/vote/history', protect, require('../controllers/billVoteController').myVotes);

module.exports = router;
