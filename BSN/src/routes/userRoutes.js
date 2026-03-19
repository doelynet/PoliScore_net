const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateProfile,
    searchUsers,
    deleteAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { updateProfileValidator } = require('../middleware/validator');

// ── Public ──
router.get('/search', searchUsers);
router.get('/:username', getUserProfile);

// ── Private ──
router.put('/profile', protect, updateProfileValidator, updateProfile);
router.delete('/me', protect, deleteAccount);

module.exports = router;