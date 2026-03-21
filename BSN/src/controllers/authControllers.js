const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/mailer');

//Token JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};
//@route POST /api/auth/register
//@desc Register a new user
//@access Public
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username, email, password, fullName, businessType, industry } = req.body;

        //check if user exists
        const existingUser = await User.findOne({
            where: {
                username
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        //Create user(Model has beforeCreate hook to hash password)
        const user = await User.create({
            username,
            email,
            passwordHash: password,
            fullName,
            businessType,
            industry
        });
        //Generate Token
        const token = generateToken(user.id);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    businessType: user.businessType,
                    industry: user.industry
                },
                token
            }
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ message: 'Server error in registration', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        const { email, password } = req.body;
        //Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        //validate pass
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
        //Generate token
        const token = generateToken(user.id);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    businessType: user.businessType,
                    industry: user.industry,
                    emailVerified: user.emailVerified,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ success: false, message: 'Server error in login', error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['passwordHash'] }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Error in getMe:', error);
        res.status(500).json({ success: false, message: 'Server error in getMe', error: error.message });
    }
};

// POST /api/auth/request-password-reset
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(200).json({ success: true, message: 'If that email exists we sent reset instructions' });

        const token = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = token;
        user.passwordResetExpires = new Date(Date.now() + 3600 * 1000); // 1 hour
        await user.save();

        const resetLink = `${process.env.APP_URL || ''}/api/auth/reset-password?token=${token}`;
        // send email (hook)
        await sendEmail({
            to: user.email,
            subject: 'Password reset instructions',
            text: `Use this link to reset your password: ${resetLink}`,
            html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
        });

        res.status(200).json({ success: true, message: 'If that email exists we sent reset instructions' });
    } catch (error) {
        console.error('requestPasswordReset error', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password required' });
        const user = await User.findOne({ where: { passwordResetToken: token } });
        if (!user || !user.passwordResetExpires || new Date() > new Date(user.passwordResetExpires)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        // Optionally return a login token
        const jwtToken = generateToken(user.id);
        res.status(200).json({ success: true, message: 'Password reset successful', token: jwtToken });
    } catch (error) {
        console.error('resetPassword error', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/auth/request-email-verification
exports.requestEmailVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(200).json({ success: true, message: 'If that email exists we sent verification instructions' });

        const verificationToken = jwt.sign({ id: user.id, action: 'verify_email' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const verifyLink = `${process.env.APP_URL || ''}/api/auth/verify-email?token=${verificationToken}`;

        await sendEmail({
            to: user.email,
            subject: 'Verify your email',
            text: `Click the link to verify your email: ${verifyLink}`,
            html: `<p>Click the link to verify your email:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
        });

        res.status(200).json({ success: true, message: 'If that email exists we sent verification instructions' });
    } catch (error) {
        console.error('requestEmailVerification error', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ success: false, message: 'Token required' });
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }
        if (payload.action !== 'verify_email') return res.status(400).json({ success: false, message: 'Invalid token' });
        const user = await User.findByPk(payload.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.emailVerified = true;
        await user.save();
        res.status(200).json({ success: true, message: 'Email verified' });
    } catch (error) {
        console.error('verifyEmail error', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
