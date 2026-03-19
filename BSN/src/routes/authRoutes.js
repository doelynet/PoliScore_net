const express = require('express');
const router = express.Router();
const { register, login, getMe, requestPasswordReset, resetPassword, requestEmailVerification, verifyEmail } = require('../controllers/authControllers');
const { registerValidator, loginValidator } = require('../middleware/validator');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
//private route to get user profile, requires authentication
router.get('/me', protect, getMe);
// Password reset & email verification
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/request-email-verification', requestEmailVerification);
router.get('/verify-email', verifyEmail);

module.exports = router;