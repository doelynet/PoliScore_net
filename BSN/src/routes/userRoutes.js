const express = require('express');
const router = express.Router();
const { updateProfile ,deleteAccount} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { updateProfileValidator } = require('../middleware/validator');
const { myVotes } = require('../controllers/billVoteController'); 

router.put('/profile', protect, ...updateProfileValidator, updateProfile);
router.delete('/me', protect, deleteAccount);
router.get('/me/votes', protect, myVotes);

module.exports = router;