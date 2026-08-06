const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { transporter, senders } = require('../utils/emailService');
const { getBrandLogoUrl } = require('../utils/brandSettings');

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Generate a 6-digit numeric OTP */
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Expiry: 10 minutes from now */
function otpExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000);
}

/** Send OTP email */
async function sendOtpEmail({ to, otp, purpose, userName }) {
    const { getOtpEmailTemplate } = require('../utils/emailTemplates');
    const purposeLabels = {
        email_login: 'Login',
        email_verify: 'Email Verification',
        forgot_password: 'Password Reset',
        change_password_settings: 'Change Password',
        reactivate_account: 'Account Reactivation',
    };
    const label = purposeLabels[purpose] || 'Verification';
    const html = await getOtpEmailTemplate({ otp, purpose, userName });

    await transporter.sendMail({
        from: `"Adbuth Verse" <${senders.system}>`,
        to,
        subject: `${otp} — Your ${label} OTP | Adbuth Verse`,
        html,
    });
}

// ─── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/otp/send-registration-otp
 * Body: { first_name, last_name, email, password, phone_number }
 *
 * NEW secure registration flow:
 *  1. Validates email + phone are not already taken by a verified account
 *  2. Generates an OTP and sends it to the email
 *  3. Returns a signed 'pending registration token' containing all form data
 *     (NOT stored in DB yet)
 *  4. User is only created after /verify-registration-otp succeeds
 */
router.post('/send-registration-otp', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone_number } = req.body;

        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Invalid email address.' });
        }

        // Check email availability — reject if a verified account exists
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail && existingEmail.email_verified) {
            return res.status(400).json({ field: 'email', msg: 'An account with this email already exists.' });
        }

        // Check phone availability
        const { Op } = require('sequelize');
        if (phone_number && phone_number.code && phone_number.number) {
            const allUsers = await User.findAll({ where: { phone_number: { [Op.ne]: null } } });
            const existingPhone = allUsers.find(u => {
                try {
                    if (existingEmail && u.user_id === existingEmail.user_id) return false;
                    const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                    if (!p) return false;
                    return p.code === phone_number.code && p.number === phone_number.number;
                } catch { return false; }
            });
            if (existingPhone) {
                return res.status(400).json({ field: 'phone', msg: 'An account with this phone number already exists.' });
            }
        }

        // If there's an old unverified ghost record for this email, delete it to keep DB clean
        if (existingEmail && !existingEmail.email_verified) {
            await existingEmail.destroy();
        }

        // Generate OTP
        const otp = generateOtp();
        const expires = otpExpiry();

        // Store all registration data in a signed pending token (NOT in DB)
        const pendingToken = jwt.sign(
            {
                type: 'pending_registration',
                first_name,
                last_name,
                email,
                password,
                phone_number,
                otp_code: otp,
                otp_expires_at: expires.toISOString(),
            },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '15m' }
        );

        // Send OTP email
        await sendOtpEmail({ to: email, otp, purpose: 'email_verify' });

        res.json({
            success: true,
            pendingToken,
            msg: 'OTP sent to your email. Please verify to complete registration.'
        });

    } catch (err) {
        console.error('[OTP] send-registration-otp error:', err.message);
        res.status(500).json({ msg: 'Failed to send OTP. Please try again.' });
    }
});

/**
 * POST /api/otp/verify-registration-otp
 * Body: { pendingToken, otp }
 *
 * Verifies the OTP from the pending registration token.
 * If valid → creates the user in the DB and returns a JWT.
 * If invalid → returns error. NO user is created.
 */
router.post('/verify-registration-otp', async (req, res) => {
    try {
        const { pendingToken, otp } = req.body;

        if (!pendingToken || !otp) {
            return res.status(400).json({ msg: 'Pending token and OTP are required.' });
        }

        // Decode and verify the pending token
        let pending;
        try {
            pending = jwt.verify(pendingToken, process.env.JWT_SECRET || 'secretkey');
        } catch (e) {
            return res.status(400).json({ msg: 'Registration session has expired. Please start over.' });
        }

        if (pending.type !== 'pending_registration') {
            return res.status(400).json({ msg: 'Invalid registration token.' });
        }

        // Check OTP expiry
        if (!pending.otp_expires_at || new Date() > new Date(pending.otp_expires_at)) {
            return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
        }

        // Check OTP value
        if (pending.otp_code !== String(otp).trim()) {
            return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });
        }

        // Double-check email availability one more time (race condition protection)
        const existingEmail = await User.findOne({ where: { email: pending.email } });
        if (existingEmail && existingEmail.email_verified) {
            return res.status(400).json({ field: 'email', msg: 'An account with this email was just created. Please log in.' });
        }

        // Clean up any ghost unverified record
        if (existingEmail && !existingEmail.email_verified) {
            await existingEmail.destroy();
        }

        // OTP is valid — NOW create the user in the database
        const user = await User.create({
            first_name: pending.first_name,
            last_name: pending.last_name,
            email: pending.email,
            password_hash: pending.password,
            phone_number: pending.phone_number,
            email_verified: true,  // Mark verified immediately since they just verified the OTP
        });

        console.log(`[Registration] New user created: ${user.email} (ID: ${user.user_id})`);

        // Issue full auth JWT
        const payload = { user: { id: user.user_id, role: user.role, type: 'customer' } };
        const token = await new Promise((resolve, reject) => {
            jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' }, (err, t) => {
                if (err) reject(err); else resolve(t);
            });
        });

        res.json({
            success: true,
            token,
            user: { id: user.user_id, email: user.email, role: user.role, email_verified: true },
            msg: 'Email verified successfully! Welcome to Adbuth Edits.'
        });

    } catch (err) {
        console.error('[OTP] verify-registration-otp error:', err.message);
        res.status(500).json({ msg: 'Registration failed. Please try again.' });
    }
});



/**
 * POST /api/otp/send-email-otp
 * Body: { email, purpose }  — purpose: 'email_login' | 'email_verify' | 'forgot_password' | 'change_password_settings'
 */
router.post('/send-email-otp', async (req, res) => {
    try {
        const { email, purpose } = req.body;
        const allowedPurposes = ['email_login', 'email_verify', 'forgot_password', 'change_password_settings', 'reactivate_account'];

        if (!email || !purpose || !allowedPurposes.includes(purpose)) {
            return res.status(400).json({ msg: 'Email and a valid purpose are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Invalid email address.' });
        }

        // Check for authenticated profile settings email change
        const authHeader = req.headers['authorization'];
        const jwtToken = authHeader && authHeader.replace('Bearer ', '');
        if (jwtToken && purpose === 'email_verify') {
            try {
                const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || 'secretkey');
                const loggedInUser = await User.findByPk(decoded.user.id);
                if (loggedInUser) {
                    if (email.toLowerCase().trim() === loggedInUser.email.toLowerCase().trim()) {
                        return res.status(400).json({ msg: 'New email address must be different from current email address.' });
                    }
                    const conflict = await User.findOne({ where: { email } });
                    if (conflict) {
                        return res.status(400).json({ msg: 'This email is already registered with another account.' });
                    }
                    const otp = generateOtp();
                    const expires = otpExpiry();
                    await loggedInUser.update({
                        otp_code: otp,
                        otp_expires_at: expires,
                        otp_type: purpose,
                    });
                    await sendOtpEmail({ to: email, otp, purpose });
                    return res.json({ success: true, msg: 'OTP sent to your new email address.' });
                }
            } catch (jwtErr) {
                return res.status(401).json({ msg: 'Authorization token is not valid.' });
            }
        }

        let user = await User.findOne({ where: { email } });

        if (purpose === 'email_login' && !user) {
            return res.status(404).json({ msg: 'Account not found. Please register first.' });
        }

        // For forgot_password / change_password_settings / reactivate_account — user must exist
        if ((purpose === 'forgot_password' || purpose === 'change_password_settings' || purpose === 'reactivate_account') && !user) {
            return res.status(404).json({ msg: 'Email is not registered with us. Please check your email address or register.' });
        }

        // For email_verify — user must exist (they just registered)
        if (purpose === 'email_verify' && !user) {
            return res.status(404).json({ msg: 'Account not found. Please register first.' });
        }

        const otp = generateOtp();
        const expires = otpExpiry();

        await user.update({
            otp_code: otp,
            otp_expires_at: expires,
            otp_type: purpose,
        });

        await sendOtpEmail({ to: email, otp, purpose });

        res.json({ success: true, msg: 'OTP sent to your email.' });
    } catch (err) {
        console.error('[OTP] send-email-otp error:', err.message);
        res.status(500).json({ msg: 'Failed to send OTP. Please try again.' });
    }
});

/**
 * POST /api/otp/verify-email-otp
 * Body: { email, otp, purpose }
 * Returns JWT on success
 */
router.post('/verify-email-otp', async (req, res) => {
    try {
        const { email, otp, purpose, pendingToken } = req.body;

        // Check for authenticated profile settings email change verification
        const authHeader = req.headers['authorization'];
        const jwtToken = authHeader && authHeader.replace('Bearer ', '');
        if (jwtToken && purpose === 'email_verify') {
            try {
                const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || 'secretkey');
                const loggedInUser = await User.findByPk(decoded.user.id);
                if (loggedInUser) {
                    if (loggedInUser.otp_type !== purpose) {
                        return res.status(400).json({ msg: 'Invalid OTP request.' });
                    }
                    if (!loggedInUser.otp_expires_at || new Date() > new Date(loggedInUser.otp_expires_at)) {
                        return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
                    }
                    if (loggedInUser.otp_code !== String(otp).trim()) {
                        return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });
                    }
                    await loggedInUser.update({
                        otp_code: null,
                        otp_expires_at: null,
                        otp_type: null
                    });
                    return res.json({ success: true, msg: 'Email verified successfully!' });
                }
            } catch (jwtErr) {
                return res.status(401).json({ msg: 'Authorization token is not valid.' });
            }
        }

        // ── NEW USER PATH: pendingToken present (email not in DB, new registration via login page) ──
        if (pendingToken) {
            let pending;
            try {
                pending = jwt.verify(pendingToken, process.env.JWT_SECRET || 'secretkey');
            } catch (e) {
                return res.status(400).json({ msg: 'Session expired. Please request a new OTP.' });
            }

            if (pending.type !== 'pending_email_login') {
                return res.status(400).json({ msg: 'Invalid session token.' });
            }

            // Verify OTP from token
            if (!pending.otp_expires_at || new Date() > new Date(pending.otp_expires_at)) {
                return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
            }
            if (pending.otp_code !== String(otp).trim()) {
                return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });
            }

            // Double-check email not taken now (race condition)
            const existing = await User.findOne({ where: { email: pending.email } });
            if (existing && existing.email_verified) {
                return res.status(400).json({ field: 'email', msg: 'An account with this email was just created. Please log in.' });
            }
            if (existing && !existing.email_verified) {
                await existing.destroy();
            }

            // Create minimal user (profile incomplete — will need completion)
            const newUser = await User.create({
                email: pending.email,
                email_verified: true,
                auth_provider: 'local',
            });

            console.log(`[Email Login] New user created via OTP login: ${newUser.email} (ID: ${newUser.user_id})`);

            const payload = { user: { id: newUser.user_id, role: newUser.role, type: 'customer' } };
            const token = await new Promise((resolve, reject) => {
                jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' }, (err, t) => {
                    if (err) reject(err); else resolve(t);
                });
            });

            return res.json({
                success: true,
                isNewUser: true,
                token,
                user: { id: newUser.user_id, email: newUser.email, role: newUser.role, email_verified: true },
                msg: 'Logged in! Please complete your profile to continue.'
            });
        }
        // ─────────────────────────────────────────────────────────────────────────

        if (!email || !otp || !purpose) {
            return res.status(400).json({ msg: 'Email, OTP, and purpose are required.' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(404).json({ msg: 'Account not found.' });

        // Validate OTP type matches
        if (user.otp_type !== purpose) {
            return res.status(400).json({ msg: 'Invalid OTP request.' });
        }

        // Check expiry
        if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
        }

        // Check OTP value
        if (user.otp_code !== String(otp).trim()) {
            return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });
        }

        // Clear OTP
        const updates = { otp_code: null, otp_expires_at: null, otp_type: null };

        // If email verification, mark verified
        if (purpose === 'email_verify') {
            updates.email_verified = true;
        }

        await user.update(updates);

        // For forgot_password — issue short-lived reset token
        if (purpose === 'forgot_password') {
            const resetToken = jwt.sign(
                { userId: user.user_id, purpose: 'password_reset' },
                process.env.JWT_SECRET || 'secretkey',
                { expiresIn: '15m' }
            );
            return res.json({ success: true, resetToken, msg: 'OTP verified. You may now reset your password.' });
        }

        // For change_password_settings — just return success
        if (purpose === 'change_password_settings') {
            return res.json({ success: true, msg: 'OTP verified successfully.' });
        }

        // Check if profile is complete (existing user)
        const profileComplete = !!(user.first_name && user.email && user.phone_number);

        // For email_login or email_verify — issue full auth JWT
        const payload = { user: { id: user.user_id, role: user.role, type: 'customer' } };
        const token = await new Promise((resolve, reject) => {
            jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' }, (err, t) => {
                if (err) reject(err); else resolve(t);
            });
        });

        res.json({
            success: true,
            isNewUser: !profileComplete,
            token,
            user: { id: user.user_id, email: user.email, role: user.role, email_verified: true },
            msg: purpose === 'email_verify' ? 'Email verified successfully!' : 'Logged in successfully!'
        });

    } catch (err) {
        console.error('[OTP] verify-email-otp error:', err.message);
        res.status(500).json({ msg: 'OTP verification failed. Please try again.' });
    }
});

/**
 * POST /api/otp/send-phone-otp
 * Body: { phone: { code: '+91', number: '9876543210' } }
 * 
 * NOTE: We store the OTP in the user row matched by phone.
 * For now, we send the OTP via email if the user's email is on file.
 * A real SMS integration (Twilio/MSG91) can be plugged in here.
 */
router.post('/send-phone-otp', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || !phone.code || !phone.number) {
            return res.status(400).json({ msg: 'Phone number with country code is required.' });
        }

        const { Op } = require('sequelize');

        // Find user by phone JSON { code, number }
        // Since phone is stored as JSON, we search with a raw query approach
        const users = await User.findAll({
            where: {
                phone_number: { [Op.ne]: null }
            }
        });

        const user = users.find(u => {
            const p = u.phone_number;
            if (!p) return false;
            const stored = typeof p === 'string' ? JSON.parse(p) : p;
            return stored.code === phone.code && stored.number === phone.number;
        });

        if (!user) {
            return res.status(404).json({ msg: 'No account found with this phone number.' });
        }

        const otp = generateOtp();
        const expires = otpExpiry();

        await user.update({
            otp_code: otp,
            otp_expires_at: expires,
            otp_type: 'phone_login',
        });

        // If user has an email, send OTP there as well (SMS fallback)
        if (user.email) {
            await sendOtpEmail({ to: user.email, otp, purpose: 'phone_login' });
        }

        // TODO: Integrate Twilio/MSG91 here to send actual SMS
        // await sendSms({ to: `${phone.code}${phone.number}`, body: `Your Adbuth OTP: ${otp}` });

        res.json({
            success: true,
            msg: user.email
                ? 'OTP sent to your registered email (SMS coming soon).'
                : 'OTP generated. SMS service will be integrated soon.',
            // In dev mode, return OTP for testing (remove in production)
            ...(process.env.NODE_ENV !== 'production' && { dev_otp: otp })
        });
    } catch (err) {
        console.error('[OTP] send-phone-otp error:', err.message);
        res.status(500).json({ msg: 'Failed to send OTP. Please try again.' });
    }
});

/**
 * POST /api/otp/verify-phone-otp
 * Body: { phone: { code, number }, otp }
 */
router.post('/verify-phone-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !phone.code || !phone.number || !otp) {
            return res.status(400).json({ msg: 'Phone number and OTP are required.' });
        }

        const { Op } = require('sequelize');
        const users = await User.findAll({ where: { phone_number: { [Op.ne]: null } } });

        const user = users.find(u => {
            const p = u.phone_number;
            if (!p) return false;
            const stored = typeof p === 'string' ? JSON.parse(p) : p;
            return stored.code === phone.code && stored.number === phone.number;
        });

        if (!user) return res.status(404).json({ msg: 'Account not found.' });

        if (user.otp_type !== 'phone_login') {
            return res.status(400).json({ msg: 'Invalid OTP request.' });
        }

        if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
        }

        if (user.otp_code !== String(otp).trim()) {
            return res.status(400).json({ msg: 'Incorrect OTP. Please try again.' });
        }

        await user.update({
            otp_code: null,
            otp_expires_at: null,
            otp_type: null,
            phone_verified: true,
        });

        const payload = { user: { id: user.user_id, role: user.role, type: 'customer' } };
        const token = await new Promise((resolve, reject) => {
            jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' }, (err, t) => {
                if (err) reject(err); else resolve(t);
            });
        });

        res.json({
            success: true,
            token,
            user: { id: user.user_id, email: user.email, role: user.role },
            msg: 'Logged in successfully!'
        });
    } catch (err) {
        console.error('[OTP] verify-phone-otp error:', err.message);
        res.status(500).json({ msg: 'OTP verification failed.' });
    }
});

/**
 * POST /api/otp/reset-password
 * Body: { resetToken, newPassword }
 * Uses the short-lived JWT issued after forgot_password OTP verification
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ msg: 'Reset token and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters.' });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ msg: 'Password must contain at least one uppercase letter.' });
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            return res.status(400).json({ msg: 'Password must contain at least one special character.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'secretkey');
        } catch {
            return res.status(400).json({ msg: 'Reset link is invalid or has expired.' });
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ msg: 'Invalid reset token.' });
        }

        const user = await User.findByPk(decoded.userId);
        if (!user) return res.status(404).json({ msg: 'Account not found.' });

        user.password_hash = newPassword;
        await user.save();

        res.json({ success: true, msg: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error('[OTP] reset-password error:', err.message);
        res.status(500).json({ msg: 'Password reset failed. Please try again.' });
    }
});

/**
 * POST /api/otp/firebase-phone-verify
 * Body: { idToken }
 *
 * Flow:
 *  1. Frontend uses Firebase SDK to authenticate phone → gets an idToken
 *  2. Frontend sends that idToken here
 *  3. We verify it with Firebase Admin SDK → get verified phone number
 *  4. Find or create user in our DB by phone number
 *  5. Return our app's JWT
 */
router.post('/firebase-phone-verify', async (req, res) => {
    try {
        const { idToken, purpose } = req.body;

        if (!idToken) {
            return res.status(400).json({ msg: 'Firebase ID token is required.' });
        }

        // Verify the Firebase ID token
        const { getFirebaseAdmin } = require('../config/firebaseAdmin');
        const admin = getFirebaseAdmin();
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (firebaseErr) {
            console.error('[Firebase Phone] Token verification failed:', firebaseErr.message);
            return res.status(401).json({ msg: 'Invalid or expired Firebase token. Please try again.' });
        }

        const firebasePhone = decodedToken.phone_number;
        const firebaseUid = decodedToken.uid;

        if (!firebasePhone) {
            return res.status(400).json({ msg: 'No phone number found in Firebase token.' });
        }

        // Parse the E.164 phone number (e.g. "+919876543210") into code + number
        // E.164 format: +[countryCode][number]
        // We'll store it in the same { code, number } JSON format as rest of the app
        const { Op } = require('sequelize');

        // Try to find user by firebase_uid or by phone number match
        let user = null;

        // 1. Look for existing user with matching firebase_phone_uid
        // (stored as firebase_id since we reuse that field, or check phone_number JSON)
        const allUsers = await User.findAll({
            where: { phone_number: { [Op.ne]: null } }
        });

        // Match by checking stored phone_number JSON against firebasePhone (E.164)
        user = allUsers.find(u => {
            try {
                const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                if (!p) return false;
                // Reconstruct E.164 from stored {code, number} and compare
                const storedE164 = `${p.code}${p.number.replace(/[\s\-()]/g, '')}`;
                return storedE164 === firebasePhone;
            } catch { return false; }
        });

        // 2. If no existing user and purpose is strictly 'login' → return 404
        //    If purpose is 'login_or_register', auto-create the account (ProfileCompleteModal collects the rest)
        if (!user) {
            if (purpose === 'login') {
                return res.status(404).json({ msg: 'Account not found with this phone number. Please register first.' });
            }
            // Parse firebasePhone into code + number using common country code lengths
            // Simple heuristic: try to split at known country code lengths
            let code = '';
            let number = firebasePhone;

            // Remove the leading +
            const digits = firebasePhone.slice(1); // e.g. "919876543210"

            // Try 1-digit codes first (+1), then 2-digit (+91, +44...), then 3-digit
            const commonCodes = {
                '1': '+1', '7': '+7',
                '20': '+20', '27': '+27', '31': '+31', '32': '+32', '33': '+33',
                '34': '+34', '36': '+36', '39': '+39', '41': '+41', '43': '+43',
                '44': '+44', '45': '+45', '46': '+46', '47': '+47', '49': '+49',
                '51': '+51', '52': '+52', '54': '+54', '55': '+55', '56': '+56',
                '57': '+57', '60': '+60', '61': '+61', '62': '+62', '63': '+63',
                '64': '+64', '65': '+65', '66': '+66', '81': '+81', '82': '+82',
                '84': '+84', '86': '+86', '90': '+90', '91': '+91', '92': '+92',
                '94': '+94', '98': '+98',
                '212': '+212', '234': '+234', '880': '+880', '886': '+886',
                '852': '+852', '966': '+966', '971': '+971', '974': '+974',
                '977': '+977',
            };

            let matched = false;
            for (const [len, pfx] of [[3, null], [2, null], [1, null]]) {
                const prefix = digits.slice(0, len === 3 ? 3 : len === 2 ? 2 : 1);
                if (commonCodes[prefix]) {
                    code = commonCodes[prefix];
                    number = digits.slice(prefix.length);
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Fallback: treat whole thing as number with unknown code
                code = '+' + digits.slice(0, 2);
                number = digits.slice(2);
            }

            user = await User.create({
                phone_number: { code, number },
                phone_verified: true,
                auth_provider: 'local',
            });

            console.log(`[Firebase Phone] New user created for phone: ${firebasePhone}`);
        } else {
            // Mark phone as verified on existing user
            if (!user.phone_verified) {
                await user.update({ phone_verified: true });
            }
        }

        // Issue our app JWT
        const payload = { user: { id: user.user_id, role: user.role, type: 'customer' } };
        const token = await new Promise((resolve, reject) => {
            jwt.sign(payload, process.env.JWT_SECRET || 'secretkey', { expiresIn: '24h' }, (err, t) => {
                if (err) reject(err); else resolve(t);
            });
        });

        // Determine if this user needs to complete their profile
        const isNewUser = !user.first_name || !user.email || !user.phone_number;

        res.json({
            success: true,
            isNewUser,
            token,
            user: {
                id: user.user_id,
                email: user.email || null,
                phone_number: user.phone_number || null,
                role: user.role,
                phone_verified: true,
            },
            msg: 'Phone login successful!'
        });

    } catch (err) {
        console.error('[OTP] firebase-phone-verify error:', err.message);
        res.status(500).json({ msg: 'Phone verification failed. Please try again.' });
    }
});

/**
 * POST /api/otp/firebase-phone-forgot-password
 * Body: { idToken }
 */
router.post('/firebase-phone-forgot-password', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ msg: 'Firebase ID token is required.' });
        }

        // Verify the Firebase ID token
        const { getFirebaseAdmin } = require('../config/firebaseAdmin');
        const admin = getFirebaseAdmin();
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (firebaseErr) {
            console.error('[Firebase Phone Forgot] Token verification failed:', firebaseErr.message);
            return res.status(401).json({ msg: 'Invalid or expired Firebase token. Please try again.' });
        }

        const firebasePhone = decodedToken.phone_number;

        if (!firebasePhone) {
            return res.status(400).json({ msg: 'No phone number found in Firebase token.' });
        }

        const { Op } = require('sequelize');

        // Find user by phone number JSON
        const allUsers = await User.findAll({
            where: { phone_number: { [Op.ne]: null } }
        });

        const user = allUsers.find(u => {
            try {
                const p = typeof u.phone_number === 'string' ? JSON.parse(u.phone_number) : u.phone_number;
                if (!p) return false;
                const storedE164 = `${p.code}${p.number.replace(/[\s\-()]/g, '')}`;
                return storedE164 === firebasePhone;
            } catch { return false; }
        });

        if (!user) {
            return res.status(404).json({ msg: 'Phone number is not registered with us. Please check your number or register.' });
        }

        // Generate a password reset token (valid for 15m)
        const resetToken = jwt.sign(
            { userId: user.user_id, purpose: 'password_reset' },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '15m' }
        );

        res.json({
            success: true,
            resetToken,
            msg: 'OTP verified. You may now reset your password.'
        });

    } catch (err) {
        console.error('[OTP] firebase-phone-forgot-password error:', err.message);
        res.status(500).json({ msg: 'Phone password reset verification failed. Please try again.' });
    }
});

module.exports = router;

