// Global error-handling middleware
// Must have 4 parameters (err, req, res, next) so Express recognises it as error middleware
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors.map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: messages
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Default
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};

module.exports = errorHandler;
