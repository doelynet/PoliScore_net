const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
    let token;

    // Check if the token is in the header and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }

    try {
        // Verify the token and get the user id from it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['passwordHash'] }
        });

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, user not found'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed',
            error: error.message
        });
    }
};