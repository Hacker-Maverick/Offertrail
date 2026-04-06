const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { ensureGuest, ensureAuth } = require('../middleware/auth');
const mailer = require('../utils/mailer');
const crypto = require('crypto');

// Login Page
router.get('/login', ensureGuest, (req, res) => {
    res.render('auth/login');
});

// Signup Page
router.get('/signup', ensureGuest, (req, res) => {
    res.render('auth/signup');
});

// Login Handle
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        req.session.userId = user._id;
        req.session.userName = user.name;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/auth/login');
    }
});

// Signup Handle
router.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    let errors = [];

    if (!name || !email || !password || !confirmPassword) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('auth/signup', { errors, name, email, password, confirmPassword });
    } else {
        try {
            const user = await User.findOne({ email });
            if (user) {
                errors.push({ msg: 'Email already exists' });
                return res.render('auth/signup', { errors, name, email, password, confirmPassword });
            }

            const newUser = new User({ name, email, password });
            await newUser.save();
            
            // Send welcome email (non-blocking)
            mailer.sendWelcomeEmail(email, name).catch(err => console.error('Welcome email failed:', err));

            req.flash('success_msg', 'You are now registered and can log in');
            res.redirect('/auth/login');
        } catch (err) {
            console.error(err);
            res.redirect('/auth/signup');
        }
    }
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect('/auth/login');
    });
});

// Profile / Change Password
router.get('/profile', ensureAuth, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('auth/profile', { user });
});

router.post('/change-password', ensureAuth, async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    try {
        const user = await User.findById(req.session.userId);
        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            req.flash('error_msg', 'Current password is incorrect');
            return res.redirect('/auth/profile');
        }

        if (newPassword !== confirmNewPassword) {
            req.flash('error_msg', 'New passwords do not match');
            return res.redirect('/auth/profile');
        }

        user.password = newPassword;
        await user.save();
        req.flash('success_msg', 'Password updated successfully');
        res.redirect('/auth/profile');
    } catch (err) {
        console.error(err);
        res.redirect('/auth/profile');
    }
});

// Forgot Password
router.get('/forgot-password', ensureGuest, (req, res) => {
    res.render('auth/forgot-password');
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const token = crypto.randomBytes(32).toString('hex');
        const user = await User.findOne({ email });

        if (!user) {
            req.flash('error_msg', 'No account with that email found');
            return res.redirect('/auth/forgot-password');
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.BASE_URL}/auth/reset-password/${token}`;
        
        // Use Brevo mailer
        await mailer.sendPasswordResetEmail(email, user.name, resetUrl);

        req.flash('success_msg', 'Check your email for password reset link');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.redirect('/auth/forgot-password');
    }
});

router.get('/reset-password/:token', ensureGuest, async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }

        res.render('auth/reset-password', { token });
    } catch (err) {
        console.error(err);
        res.redirect('/auth/forgot-password');
    }
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired');
            return res.redirect('/auth/forgot-password');
        }

        user.password = password;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        await user.save();

        req.flash('success_msg', 'Password reset successful');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.redirect('/auth/forgot-password');
    }
});

module.exports = router;
