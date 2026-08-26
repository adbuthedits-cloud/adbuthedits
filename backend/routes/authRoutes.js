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
        if (!targetAccount.password_hash) {
            // User does not have a password set yet (e.g., registered via Google or OTP).
            // Allow setting the password directly without extra verification.
        } else if (currentPassword) {
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



// ─────────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/complete-profile
// Called after OTP login for new/incomplete users to fill in their details.
// Smart merge: if email/phone matches a partial (incomplete) existing account, merge them.
// ─────────────────────────────────────────────────────────────────────────────────
router.put('/complete-profile', authMiddleware, async (req, res) => {
    try {
        const { first_name, last_name, email, phone_number } = req.body;

        if (!first_name || !email || !phone_number) {
            return res.status(400).json({ msg: 'First name, email, and phone number are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ field: 'email', msg: 'Invalid email address.' });
        }

        if (!phone_number.code || !phone_number.number) {
            return res.status(400).json({ field: 'phone', msg: 'Valid phone number with country code is required.' });
        }

        // Load the current user
        const currentUser = await User.findByPk(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // ─ Check email conflict ────────────────────────────────────────────────
        if (email !== currentUser.email) {
            const emailConflict = await User.findOne({ where: { email } });
            if (emailConflict && emailConflict.user_id !== currentUser.user_id) {
                return res.status(400).json({
                    field: 'email',
                    msg: 'This email belongs to another account. Please use a different email or log in with that account.'
                });
            }
        }

        // ─ Check phone conflict ──────────────────────────────────────────────
        const allUsersWithPhone = await User.findAll({
            where: { phone_number: { [Op.ne]: null } }
        });
        const phoneConflict = allUsersWithPhone.find(u => {
            if (u.user_id === currentUser.user_id) return false;
            try {
                const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                return p && p.code === phone_number.code && p.number === phone_number.number;
            } catch { return false; }
        });

        if (phoneConflict) {
            return res.status(400).json({
                field: 'phone',
                msg: 'This phone number belongs to another account. Please use a different number.'
            });
        }

        // ─ Apply updates to current user ─────────────────────────────────────────
        currentUser.first_name = first_name;
        currentUser.last_name = last_name || currentUser.last_name || null;
        currentUser.email = email;
        currentUser.email_verified = true; // They verified via OTP already
        currentUser.phone_number = phone_number;
        await currentUser.save();

        console.log(`[complete-profile] Profile completed for user ${currentUser.user_id}`);

        res.json({
            success: true,
            msg: 'Profile completed successfully!',
            user: {
                id: currentUser.user_id,
                email: currentUser.email,
                role: currentUser.role,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                phone: currentUser.phone_number,
                name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
            }
        });

    } catch (err) {
        console.error('[Auth] complete-profile error:', err.message);
        res.status(500).json({ msg: 'Failed to save profile. Please try again.' });
    }
});


// POST /api/auth/check-availability
// Validates email + phone availability WITHOUT creating any user.
// Called by the frontend before sending registration OTP.
router.post('/check-availability', async (req, res) => {
    try {
        const { email, phone_number } = req.body;

        if (!email && !phone_number) {
            return res.status(400).json({ msg: 'Email or phone number is required.' });
        }

        let existingEmail = null;
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ field: 'email', msg: 'Invalid email address.' });
            }

            // Check if email is taken by a verified account
            existingEmail = await User.findOne({ where: { email } });
            if (existingEmail && existingEmail.email_verified) {
                return res.status(400).json({ field: 'email', msg: 'An account with this email already exists.' });
            }
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
    const returnTo = req.query.returnTo || '';
    const state = returnTo ? Buffer.from(returnTo).toString('base64url') : undefined;
    passport.authenticate('google', { scope: ['profile', 'email'], state, session: false })(req, res, next);
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
        const rawState = req.query.state || '';
        let returnTo = '';
        if (rawState) {
            try {
                returnTo = Buffer.from(rawState, 'base64url').toString('utf8');
            } catch (e) {}
        }

        // If the account is deactivated, redirect to login with a deactivated flag
        if (req.user._isDeactivated) {
            const email = encodeURIComponent(req.user.email || '');
            return res.redirect(`${FRONTEND_URL}/login?error=account_deactivated&deactivatedEmail=${email}`);
        }

        const payload = { user: { id: req.user.user_id, role: req.user.role, type: 'customer' } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' }, (err, token) => {
            if (err) return res.redirect(`${FRONTEND_URL}/login?error=jwt_failed`);
            const redirectUrl = returnTo && !returnTo.includes('/login') && !returnTo.includes('/signup')
                ? `${FRONTEND_URL}/login?token=${token}&returnTo=${encodeURIComponent(returnTo)}`
                : `${FRONTEND_URL}/login?token=${token}`;
            res.redirect(redirectUrl);
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
        const { email, loginIdentifier, password } = req.body;
        const identifier = (loginIdentifier || email || '').trim();

        if (!identifier || !password) {
            return res.status(400).json({ msg: 'Please provide email or phone number and password' });
        }

        let user = null;

        // 1. If identifier contains '@', lookup user by email
        if (identifier.includes('@')) {
            user = await User.findOne({ where: { email: identifier.toLowerCase() } });
        } else {
            // 2. Otherwise, lookup user by phone number
            const cleanedInput = identifier.replace(/[^\d+]/g, '');
            const digitsOnly = identifier.replace(/\D/g, '');

            const allUsersWithPhone = await User.findAll({
                where: { phone_number: { [Op.ne]: null } }
            });

            const candidateUsers = allUsersWithPhone.filter(u => {
                try {
                    const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                    if (!p) return false;

                    const storedCode = (p.code || '').replace(/\D/g, '');
                    const storedNum = (p.number || '').replace(/\D/g, '');
                    const storedFullDigits = storedCode + storedNum;

                    // Match full digits (code + number)
                    if (storedFullDigits && digitsOnly && storedFullDigits === digitsOnly) return true;
                    // Match local number (digits only matching stored number)
                    if (storedNum && digitsOnly && storedNum === digitsOnly) return true;

                    // Compare E.164 strings if + was supplied in input or stored
                    const storedE164 = `${p.code || ''}${p.number || ''}`.replace(/[^\d+]/g, '');
                    if (cleanedInput.startsWith('+') && storedE164 && storedE164 === cleanedInput) return true;

                    return false;
                } catch {
                    return false;
                }
            });

            for (const cand of candidateUsers) {
                if (cand.password_hash && (await cand.checkPassword(password))) {
                    user = cand;
                    break;
                }
            }

            // If no password matched among phone candidates, default user to first candidate (so error reporting remains standard)
            if (!user && candidateUsers.length > 0) {
                user = candidateUsers[0];
            }

            // Fallback: Check if identifier matches email directly just in case
            if (!user) {
                user = await User.findOne({ where: { email: identifier } });
            }
        }

        if (!user) {
            return res.status(404).json({ msg: 'Account not found. Please register first.' });
        }

        if (user.is_deactivated) {
            return res.status(403).json({
                isDeactivated: true,
                email: user.email,
                phone_number: user.phone_number,
                msg: 'Account is deactivated. Kindly activate your account through OTP verification.'
            });
        }

        if (!user.password_hash) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await user.checkPassword(password);
        if (!isMatch) {
            const oldPassCheck = await user.checkOldPassword(password);
            if (oldPassCheck.matched) {
                return res.status(400).json({
                    msg: `You changed your password ${oldPassCheck.timeAgo}. Please enter your current password.`
                });
            }
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
                attributes: ['user_id', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'profile_picture', 'password_hash']
            });
            if (!user) return res.status(404).json({ msg: 'User not found' });
            userData = {
                id: user.user_id,
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                phone_number: user.phone_number,
                profile_picture: user.profile_picture || null,
                name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                hasPassword: !!user.password_hash
            };
        }

        res.json({ user: userData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// ─── PUT /api/auth/complete-profile ────────────────────────────────────────────
// Called by ProfileCompleteModal after OTP login. Applies smart merge:
//  - If a partial account (same email/phone, no other identifier) exists, merge it.
//  - Conflicts with full accounts (both email + phone present) are rejected.
router.put('/complete-profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, email, phone_number } = req.body;

        if (!first_name || !email || !phone_number) {
            return res.status(400).json({ msg: 'First name, email, and phone are required.' });
        }

        const phoneStr = typeof phone_number === 'object' ? JSON.stringify(phone_number) : phone_number;
        const phoneSearch = typeof phone_number === 'object'
            ? { [Op.or]: [{ phone_number: phoneStr }, { phone_number: JSON.stringify(phone_number) }] }
            : { phone_number: phoneStr };

        // Check for conflict: another user already has this email with a full profile
        const emailConflict = await User.findOne({
            where: { email, user_id: { [Op.ne]: userId } }
        });
        if (emailConflict) {
            const fullProfile = emailConflict.first_name && emailConflict.phone_number;
            if (fullProfile) {
                return res.status(409).json({ field: 'email', msg: 'This email is already linked to another account.' });
            }
            // Merge: this partial account can be absorbed
            await User.destroy({ where: { user_id: emailConflict.user_id } });
        }

        // Check for conflict: another user already has this phone with a full profile
        const phoneConflict = await User.findOne({
            where: { ...phoneSearch, user_id: { [Op.ne]: userId } }
        });
        if (phoneConflict) {
            const fullProfile = phoneConflict.first_name && phoneConflict.email;
            if (fullProfile) {
                return res.status(409).json({ field: 'phone', msg: 'This phone number is already linked to another account.' });
            }
            // Merge: absorb partial account
            await User.destroy({ where: { user_id: phoneConflict.user_id } });
        }

        // Update current user
        await User.update(
            { first_name, last_name: last_name || null, email, phone_number: phoneStr },
            { where: { user_id: userId } }
        );

        const updated = await User.findByPk(userId, {
            attributes: ['user_id', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'profile_picture']
        });

        return res.json({
            msg: 'Profile complete!',
            user: {
                id: updated.user_id,
                email: updated.email,
                first_name: updated.first_name,
                last_name: updated.last_name,
                phone_number: updated.phone_number,
                role: updated.role,
                profile_picture: updated.profile_picture || null,
                name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim()
            }
        });
    } catch (err) {
        console.error('[complete-profile] error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─── PUT /api/auth/update-profile ──────────────────────────────────────────────
// Settings page: update name, email (verified by OTP), or phone (verified by Firebase)
router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { first_name, last_name, email, phone_number } = req.body;

        const isAdmin = req.user.type === 'admin';
        const TargetModel = isAdmin ? Admin : User;
        const pkField = isAdmin ? 'admin_id' : 'user_id';

        const currentUser = await TargetModel.findByPk(userId);
        if (!currentUser) {
            return res.status(404).json({ msg: 'Account not found' });
        }

        const updates = {};
        if (first_name !== undefined) updates.first_name = first_name;
        if (last_name !== undefined) updates.last_name = last_name;

        // Email change: verify it's different and check for conflicts
        if (email !== undefined && email.trim() !== '') {
            const cleanEmail = email.toLowerCase().trim();
            if (currentUser.email && cleanEmail === currentUser.email.toLowerCase().trim()) {
                // Email is unchanged, allow update
            } else {
                const conflict = await User.findOne({ where: { email: cleanEmail, user_id: { [Op.ne]: userId } } });
                if (conflict) {
                    return res.status(409).json({ msg: 'This email is already registered with another account.' });
                }
                updates.email = cleanEmail;
            }
        }

        // Phone change: verify it's different and check for conflicts
        if (phone_number !== undefined && phone_number !== null) {
            const newPhone = typeof phone_number === 'string' ? JSON.parse(phone_number) : phone_number;
            const currentPhone = currentUser.phone_number ? (typeof currentUser.phone_number === 'string' ? JSON.parse(currentUser.phone_number) : currentUser.phone_number) : null;
            
            const isPhoneDifferent = !currentPhone || currentPhone.code !== newPhone.code || currentPhone.number !== newPhone.number;
            
            if (isPhoneDifferent) {
                const allUsersWithPhone = await User.findAll({
                    where: { phone_number: { [Op.ne]: null }, user_id: { [Op.ne]: userId } }
                });
                const phoneConflict = allUsersWithPhone.find(u => {
                    try {
                        const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                        return p && p.code === newPhone.code && p.number === newPhone.number;
                    } catch { return false; }
                });
                if (phoneConflict) {
                    return res.status(409).json({ msg: 'This phone number is already registered with another account.' });
                }
                updates.phone_number = JSON.stringify(newPhone);
            }
        }

        await TargetModel.update(updates, { where: { [pkField]: userId } });

        const updated = await TargetModel.findByPk(userId);

        return res.json({
            msg: 'Profile updated successfully!',
            user: {
                id: updated.admin_id || updated.user_id,
                email: updated.email,
                first_name: updated.first_name,
                last_name: updated.last_name,
                phone_number: updated.phone_number,
                role: updated.role,
                profile_picture: updated.profile_picture || null,
                name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim()
            }
        });
    } catch (err) {
        console.error('[update-profile] error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

/**
 * POST /api/auth/deactivate-account
 * Deactivates user account (soft delete - retains data, blocks access)
 */
router.post('/deactivate-account', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { reason } = req.body || {};
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        await user.update({
            is_deactivated: true,
            deactivated_at: new Date()
        });

        // Send deactivation notification email
        const userEmail = user.email;
        if (userEmail) {
            try {
                const { safeSendMail, senders } = require('../utils/emailService');
                const { getAccountDeactivatedTemplate } = require('../utils/emailTemplates');
                const { getBrandLogoUrl } = require('../utils/brandSettings');
                const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Valued Customer';
                const logoUrl = await getBrandLogoUrl();
                const html = await getAccountDeactivatedTemplate(userName, reason, logoUrl);

                await safeSendMail({
                    from: `"Adbuth Verse Security" <${senders.system}>`,
                    to: userEmail,
                    subject: 'Your Adbuth Verse Account Has Been Deactivated',
                    html
                });
            } catch (e) {
                console.error('[deactivate-account] Email setup error:', e.message);
            }
        }

        res.json({
            success: true,
            msg: 'Account deactivated successfully. All your data remains saved, but your account is blocked from access until reactivated.'
        });
    } catch (err) {
        console.error('[deactivate-account] Error:', err);
        res.status(500).json({ msg: 'Failed to deactivate account.' });
    }
});

/**
 * POST /api/auth/delete-account
 * Permanently deletes user account and all child data
 */
router.post('/delete-account', authMiddleware, async (req, res) => {
    const sequelize = require('../config/database');
    const t = await sequelize.transaction();
    try {
        const userId = req.user.id;
        const { reason } = req.body || {};
        const user = await User.findByPk(userId, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ msg: 'User not found' });
        }

        const userEmail = user.email;
        const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Valued Customer';

        const { Order, OrderItem, OrderTimeline, Payment, Cart, CartItem, Wishlist, Review, ReviewVote, CouponUsage } = require('../models');
        const { Op } = require('sequelize');

        // 1. Get user orders
        const userOrders = await Order.findAll({ where: { user_id: userId }, attributes: ['order_id'], transaction: t });
        const orderIds = userOrders.map(o => o.order_id);

        if (orderIds.length > 0) {
            // Delete OrderItems & Timelines
            await OrderItem.destroy({ where: { order_id: { [Op.in]: orderIds } }, transaction: t });
            await OrderTimeline.destroy({ where: { order_id: { [Op.in]: orderIds } }, transaction: t });
        }

        // Delete payments
        await Payment.destroy({ where: { [Op.or]: [{ user_id: userId }, ...(orderIds.length ? [{ order_id: { [Op.in]: orderIds } }] : [])] }, transaction: t });

        // Delete coupon usages
        await CouponUsage.destroy({ where: { user_id: userId }, transaction: t });

        // Delete orders
        await Order.destroy({ where: { user_id: userId }, transaction: t });

        // Delete cart & cart items
        const userCart = await Cart.findOne({ where: { user_id: userId }, transaction: t });
        if (userCart) {
            await CartItem.destroy({ where: { cart_id: userCart.cart_id }, transaction: t });
            await userCart.destroy({ transaction: t });
        }

        // Delete wishlist
        await Wishlist.destroy({ where: { user_id: userId }, transaction: t });

        // Delete review votes & reviews
        await ReviewVote.destroy({ where: { user_id: userId }, transaction: t });
        await Review.destroy({ where: { user_id: userId }, transaction: t });

        // Delete user record
        await user.destroy({ transaction: t });

        await t.commit();

        // Send deletion notification email
        if (userEmail) {
            try {
                const { safeSendMail, senders } = require('../utils/emailService');
                const { getAccountDeletedTemplate } = require('../utils/emailTemplates');
                const { getBrandLogoUrl } = require('../utils/brandSettings');
                const logoUrl = await getBrandLogoUrl();
                const html = await getAccountDeletedTemplate(userName, reason, logoUrl);

                await safeSendMail({
                    from: `"Adbuth Verse Security" <${senders.system}>`,
                    to: userEmail,
                    subject: 'Your Adbuth Verse Account Has Been Permanently Deleted',
                    html
                });
            } catch (e) {
                console.error('[delete-account] Email setup error:', e.message);
            }
        }

        res.json({
            success: true,
            msg: 'Your account and all associated data have been permanently deleted.'
        });

    } catch (err) {
        await t.rollback();
        console.error('[delete-account] Error:', err);
        res.status(500).json({ msg: 'Failed to delete account. Please try again.' });
    }
});


/**
 * POST /api/auth/reactivate-account
 * Reactivates a deactivated account upon verifying OTP
 */
router.post('/reactivate-account', async (req, res) => {
    try {
        const { email, phone, otp } = req.body;
        if (!otp || otp.trim().length !== 6) {
            return res.status(400).json({ msg: 'Please enter a valid 6-digit OTP.' });
        }

        const { Op } = require('sequelize');
        let user = null;

        if (email) {
            user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        } else if (phone) {
            const allUsers = await User.findAll({ where: { phone_number: { [Op.ne]: null } } });
            user = allUsers.find(u => {
                try {
                    const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                    if (!p) return false;
                    const cleanIn = phone.replace(/\D/g, '');
                    const cleanP = `${p.code}${p.number}`.replace(/\D/g, '');
                    return cleanP === cleanIn || p.number.replace(/\D/g, '') === cleanIn;
                } catch { return false; }
            });
        }

        if (!user) {
            return res.status(404).json({ msg: 'Account not found.' });
        }

        // Check OTP code and expiration
        const isOtpValid = user.otp_code === otp &&
                           user.otp_expires_at &&
                           new Date() < new Date(user.otp_expires_at);

        if (!isOtpValid) {
            return res.status(400).json({ msg: 'Invalid or expired OTP. Please resend a new OTP.' });
        }

        // Reactivate account and clear OTP
        await user.update({
            is_deactivated: false,
            deactivated_at: null,
            otp_code: null,
            otp_expires_at: null,
            otp_type: null
        });

        // Send reactivation confirmation email
        if (user.email) {
            try {
                const { safeSendMail, senders } = require('../utils/emailService');
                const { getAccountReactivatedTemplate } = require('../utils/emailTemplates');
                const { getBrandLogoUrl } = require('../utils/brandSettings');
                const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Valued Customer';
                const logoUrl = await getBrandLogoUrl();
                const html = await getAccountReactivatedTemplate(userName, logoUrl);

                await safeSendMail({
                    from: `"Adbuth Verse Security" <${senders.system}>`,
                    to: user.email,
                    subject: 'Your Adbuth Verse Account Has Been Reactivated!',
                    html
                });
            } catch (e) {
                console.error('[reactivate-account] Email notification error:', e.message);
            }
        }

        // Issue JWT token
        const jwt = require('jsonwebtoken');
        const payload = { user: { id: user.user_id, role: user.role, type: 'customer' } };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' });

        return res.json({
            success: true,
            msg: 'Account successfully reactivated!',
            token,
            user: {
                id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone_number: user.phone_number,
                role: user.role
            }
        });
    } catch (err) {
        console.error('[reactivate-account] Error:', err);
        res.status(500).json({ msg: 'Reactivation failed.' });
    }
});

module.exports = router;

module.exports = router;
