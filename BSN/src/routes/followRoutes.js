const express = require('express');
const router = express.Router();
const { toggleFollow, getFollowers, getFollowing } = require('../controllers/followController');
const { protect } = require('../middleware/auth');

// Public
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Private
router.post('/:userId/follow', protect, toggleFollow);

module.exports = router;
