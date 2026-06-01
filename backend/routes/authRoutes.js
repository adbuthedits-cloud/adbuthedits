const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const crypto = require('crypto');
const { User, Admin, Role, AdminSession, sequelize } = require('../models');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const passport = require('../config/passport');

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const BACKEND_URL = (process.env.BACKEND_URL || 'https://adbuth-backend.onrender.com').replace(/\/$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://www.adbuthverse.com').replace(/\/$/, '');
const TWITTER_CALLBACK_URL = `${BACKEND_URL}/api/auth/twitter/callback`;

// Helper: PKCE code verifier & challenge
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword, otp, idToken } = req.body;

        if (!newPassword) {
            return res.status(400).json({ msg: 'Please provide a new password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        if (!hasUpperCase) {
            return res.status(400).json({ msg: 'Password must contain at least one uppercase letter' });
        }
        if (!hasSpecialChar) {
            return res.status(400).json({ msg: 'Password must contain at least one special character' });
        }

        let targetAccount = null;
        if (req.user.type === 'admin') {
            targetAccount = await Admin.findByPk(req.user.id);
        } else {
            targetAccount = await User.findByPk(req.user.id);
        }

        if (!targetAccount) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        // Verify method
        if (currentPassword) {
            // Traditional verify
            const isMatch = await targetAccount.checkPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Incorrect current password' });
            }
        } else if (otp) {
            // Verify via Email OTP
            if (targetAccount.otp_type !== 'change_password_settings') {
                return res.status(400).json({ msg: 'Invalid OTP request. Please request a new OTP.' });
            }
            if (!targetAccount.otp_expires_at || new Date() > new Date(targetAccount.otp_expires_at)) {
                return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
            }
            if (targetAccount.otp_code !== String(otp).trim()) {
                return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });
            }

            // Clear OTP
            await targetAccount.update({
                otp_code: null,
                otp_expires_at: null,
                otp_type: null
            });
        } else if (idToken) {
            // Verify via Firebase Phone ID Token
            const { getFirebaseAdmin } = require('../config/firebaseAdmin');
            const admin = getFirebaseAdmin();
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (firebaseErr) {
                console.error('[Firebase Change Password] Token verification failed:', firebaseErr.message);
                return res.status(401).json({ msg: 'Invalid or expired Firebase token. Please try again.' });
            }

            const firebasePhone = decodedToken.phone_number;
            if (!firebasePhone) {
                return res.status(400).json({ msg: 'No phone number found in Firebase token.' });
            }

            // Verify the phone number matches the user's phone number
            const phone = targetAccount.phone_number;
            if (!phone) {
                return res.status(400).json({ msg: 'No registered phone number found on your account to verify against.' });
            }

            const parsedPhone = typeof phone === 'string' ? JSON.parse(phone) : phone;
            const storedE164 = `${parsedPhone.code}${parsedPhone.number.replace(/[\s\-()]/g, '')}`;

            if (storedE164 !== firebasePhone) {
                return res.status(400).json({ msg: 'The verified phone number does not match your registered phone number.' });
            }
        } else {
            return res.status(400).json({ msg: 'Verification required. Provide current password or verify via OTP.' });
        }

        targetAccount.password_hash = newPassword;
        await targetAccount.save();

        res.json({ msg: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// PUT /api/auth/update-profile
router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { first_name, last_name } = req.body;

        let targetAccount = null;
        if (req.user.type === 'admin') {
            targetAccount = await Admin.findByPk(req.user.id);
        } else {
            targetAccount = await User.findByPk(req.user.id);
        }

        if (!targetAccount) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        targetAccount.first_name = first_name || targetAccount.first_name;
        targetAccount.last_name = last_name || targetAccount.last_name;
        await targetAccount.save();

        res.json({
            msg: 'Profile updated successfully',
            user: {
                id: req.user.type === 'admin' ? targetAccount.admin_id : targetAccount.user_id,
                email: targetAccount.email,
                role: targetAccount.role,
                first_name: targetAccount.first_name,
                last_name: targetAccount.last_name,
                name: `${targetAccount.first_name || ''} ${targetAccount.last_name || ''}`.trim()
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/auth/check-availability
// Validates email + phone availability WITHOUT creating any user.
// Called by the frontend before sending registration OTP.
router.post('/check-availability', async (req, res) => {
    try {
        const { email, phone_number } = req.body;

        if (!email) {
            return res.status(400).json({ msg: 'Email is required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Invalid email address.' });
        }

        // Check if email is taken by a verified account
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail && existingEmail.email_verified) {
            return res.status(400).json({ field: 'email', msg: 'An account with this email already exists.' });
        }

        // Check if phone is taken by a verified account
        if (phone_number && phone_number.code && phone_number.number) {
            const allUsers = await User.findAll({
                where: { phone_number: { [Op.ne]: null } }
            });
            const existingPhone = allUsers.find(u => {
                try {
                    // Skip the same unverified email user (same person re-trying)
                    if (existingEmail && u.user_id === existingEmail.user_id) return false;
                    const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                    if (!p) return false;
                    return p.code === phone_number.code && p.number === phone_number.number;
                } catch {
                    return false;
                }
            });
            if (existingPhone) {
                return res.status(400).json({ field: 'phone', msg: 'An account with this phone number already exists.' });
            }
        }

        res.json({ available: true });

    } catch (err) {
        console.error('[Auth] check-availability error:', err.message);
        res.status(500).json({ msg: 'Server error. Please try again.' });
    }
});

/* ── OLD /register route (DEPRECATED — kept for reference only) ────────────────
   This route was removed because it created a user in the DB BEFORE email OTP
   verification, causing ghost accounts and data overwrite bugs.
   User creation now happens in POST /api/otp/verify-registration-otp ONLY after
   OTP is confirmed successfully.
──────────────────────────────────────────────────────────────────────────────── */
/*
router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone_number } = req.body;
        // ... old code removed — DO NOT RESTORE ...
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});
*/

router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
    }
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get('/google/callback',
    (req, res, next) => {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
        }
        passport.authenticate('google', {
            failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
            session: false
        })(req, res, next);
    },
    (req, res) => {
        const payload = { user: { id: req.user.user_id, role: req.user.role, type: 'customer' } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' }, (err, token) => {
            if (err) return res.redirect(`${FRONTEND_URL}/login?error=jwt_failed`);
            res.redirect(`${FRONTEND_URL}/login?token=${token}`);
        });
    }
);

/* ── Facebook & Twitter OAuth routes disabled ──────────────────────────────────
   These routes have been disabled. To re-enable, uncomment below and add the
   app credentials to your .env file.
─────────────────────────────────────────────────────────────────────────────── */

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({
            where: {
                [Op.and]: [
                    { is_active: true },
                    {
                        [Op.or]: [
                            { email: email },
                            { username: email },
                            { staff_id: email }
                        ]
                    }
                ]
            },
            include: [{
                model: Role,
                as: 'roleDetails',
                attributes: ['role_id', 'name', 'permissions', 'is_system'],
                required: false
            }]
        });

        if (!admin) {
            return res.status(400).json({ msg: 'Invalid Credentials or Inactive Account' });
        }

        const isMatch = await admin.checkPassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Create a session record for time tracking
        const session = await AdminSession.create({
            admin_id: admin.admin_id,
            admin_name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || email,
            admin_role: admin.role,
            ip_address: req.ip || req.connection?.remoteAddress,
            status: 'active',
        });

        // Update admin's login status and session reference
        await admin.update({
            last_login: new Date(),
            is_logged_in: true,
            current_session_id: session.session_id
        });

        // Use permissions from Role table if role_id is set, else fall back to admin.permissions
        const effectivePermissions = admin.roleDetails?.permissions || admin.permissions || {};
        // Super Admin = the role has is_system:true AND is the top-level system role
        const isSuperAdmin = admin.roleDetails?.is_system === true;

        // Build JWT with permissions, is_super_admin, and session_id embedded
        const payload = {
            user: {
                id: admin.admin_id,
                role: admin.role,
                role_id: admin.role_id || null,
                is_super_admin: isSuperAdmin,
                type: 'admin',
                permissions: effectivePermissions,
                session_id: session.session_id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: admin.admin_id,
                        email: admin.email,
                        role: admin.role,
                        role_id: admin.role_id || null,
                        is_super_admin: isSuperAdmin,
                        first_name: admin.first_name,
                        last_name: admin.last_name,
                        permissions: effectivePermissions
                    }
                });
            }
        );
    } catch (err) {
        console.error('[Admin Login Error]', err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/auth/admin/logout
router.post('/admin/logout', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const sessionId = req.user.session_id;

        if (sessionId) {
            const session = await AdminSession.findByPk(sessionId);
            if (session && session.status === 'active') {
                const logoutTime = new Date();
                const loginTime = new Date(session.login_at);
                const durationMs = logoutTime - loginTime;
                const durationMinutes = Math.round(durationMs / 60000);

                await session.update({
                    logout_at: logoutTime,
                    duration_minutes: durationMinutes,
                    status: 'closed'
                });
            }
        }

        // Mark admin as logged out
        await Admin.update(
            { is_logged_in: false, current_session_id: null },
            { where: { admin_id: req.user.id } }
        );

        res.json({ success: true, msg: 'Logged out successfully' });
    } catch (err) {
        console.error('[Admin Logout Error]', err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await user.checkPassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.user_id,
                role: user.role,
                type: 'customer'
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.user_id, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        let userData;

        if (req.user.type === 'admin') {
            const admin = await Admin.findByPk(req.user.id, {
                attributes: ['admin_id', 'email', 'role', 'role_id', 'first_name', 'last_name', 'is_active', 'permissions'],
                include: [{
                    model: Role,
                    as: 'roleDetails',
                    attributes: ['role_id', 'name', 'permissions', 'is_system'],
                    required: false
                }]
            });
            if (!admin) return res.status(404).json({ msg: 'Admin not found' });

            const effectivePermissions = admin.roleDetails?.permissions || admin.permissions || {};
            const isSuperAdmin = admin.roleDetails?.is_system === true;

            userData = {
                id: admin.admin_id,
                email: admin.email,
                role: admin.role,
                role_id: admin.role_id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim(),
                permissions: effectivePermissions,
                is_super_admin: isSuperAdmin
            };
        } else {
            const user = await User.findByPk(req.user.id, {
                attributes: ['user_id', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'profile_picture']
            });
            if (!user) return res.status(404).json({ msg: 'User not found' });
            userData = {
                id: user.user_id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone_number,
                profile_picture: user.profile_picture || null,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
            };
        }

        res.json({ user: userData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
