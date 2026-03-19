const { body } = require('express-validator');

exports.registerValidator = [
    body('username')
        .trim()
        .isLength({ min: 4, max: 20 })
        .withMessage('Username must be between 4 and 20 characters')
        .isAlphanumeric()
        .withMessage('Username must be alphanumeric'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 9 })
        .withMessage('Password must be at least 9 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{9,}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required'),
    body('businessType')
        .optional()
        .isIn(['startup', 'smb', 'enterprise', 'enthusiast', 'freelancer', 'investor'])
        .withMessage('Invalid business type'),
    body('industry')
        .optional()
        .isIn(['technology', 'finance', 'healthcare', 'education', 'retail', 'manufacturing', 'transportation', 'energy', 'entertainment'])
        .withMessage('Invalid industry type')
];

exports.loginValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

exports.postValidator = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Post content must be between 1 and 500 characters'),
    body('mediaUrl')
        .optional()
        .isURL()
        .withMessage('Media URL must be a valid URL'),
    body('mediaType')
        .optional()
        .isIn(['image', 'video', 'link'])
        .withMessage('Media type must be image, video, or link')
];

exports.commentValidator = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 350 })
        .withMessage('Comment must be between 1 and 350 characters')
];

exports.updateProfileValidator = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Full name must be between 1 and 50 characters'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio must be at most 500 characters'),
    body('website')
        .optional()
        .isURL()
        .withMessage('Website must be a valid URL'),
    body('businessType')
        .optional()
        .isIn(['startup', 'smb', 'enterprise', 'enthusiast', 'freelancer', 'investor'])
        .withMessage('Invalid business type'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location must be at most 100 characters')
];

exports.messageValidator = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 2000 })
        .withMessage('Message must be between 1 and 2000 characters'),
    body('messageType')
        .optional()
        .isIn(['text', 'image', 'link'])
        .withMessage('Message type must be text, image, or link')
];

exports.reportValidator = [
    body('targetType')
        .isIn(['post', 'comment', 'user'])
        .withMessage('Target type must be post, comment, or user'),
    body('targetId')
        .isUUID()
        .withMessage('Target ID must be a valid UUID'),
    body('reason')
        .isIn(['spam', 'harassment', 'misinformation', 'hate_speech', 'other'])
        .withMessage('Invalid reason'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be at most 1000 characters')
];
