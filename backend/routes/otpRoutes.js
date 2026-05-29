const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { transporter, senders } = require('../utils/emailService');

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
async function sendOtpEmail({ to, otp, purpose }) {
    const purposeLabels = {
        email_login: 'Login',
        email_verify: 'Email Verification',
        forgot_password: 'Password Reset',
        change_password_settings: 'Change Password',
    };
    const label = purposeLabels[purpose] || 'Verification';

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; max-width: 520px; margin: 0 auto; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://assets.adbuthverse.com/website-assets/brand/logo.webp" alt="Adbuth Edits" style="height: 36px; object-fit: contain;" />
        </div>
        <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 32px; text-align: center;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #fff;">${label} OTP</h2>
            <p style="color: #999; font-size: 14px; margin: 0 0 28px;">Use the code below to complete your ${label.toLowerCase()}. It expires in <strong style="color: #f53ff8">10 minutes</strong>.</p>
            <div style="display: inline-block; background: linear-gradient(135deg, #7D287E, #f53ff8); border-radius: 12px; padding: 3px;">
                <div style="background: #111; border-radius: 10px; padding: 18px 40px;">
                    <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #f53ff8; font-family: monospace;">${otp}</span>
                </div>
            </div>
            <p style="color: #555; font-size: 12px; margin: 24px 0 0;">If you did not request this, please ignore this email.</p>
        </div>
        <p style="text-align: center; color: #333; font-size: 11px; margin-top: 24px;">© ${new Date().getFullYear()} Adbuth Edits. All rights reserved.</p>
    </div>`;

    await transporter.sendMail({
        from: `"Adbuth Edits" <${senders.system}>`,
        to,
        subject: `${otp} — Your ${label} OTP | Adbuth Edits`,
        html,
    });
}

// ─── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/otp/send-email-otp
 * Body: { email, purpose }  — purpose: 'email_login' | 'email_verify' | 'forgot_password' | 'change_password_settings'
 */
router.post('/send-email-otp', async (req, res) => {
    try {
        const { email, purpose } = req.body;
        const allowedPurposes = ['email_login', 'email_verify', 'forgot_password', 'change_password_settings'];

        if (!email || !purpose || !allowedPurposes.includes(purpose)) {
            return res.status(400).json({ msg: 'Email and a valid purpose are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Invalid email address.' });
        }

        let user = await User.findOne({ where: { email } });

        // For login / forgot_password / change_password_settings — user must exist
        if ((purpose === 'email_login' || purpose === 'forgot_password' || purpose === 'change_password_settings') && !user) {
            return res.status(404).json({ msg: 'No account found with this email.' });
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
        const { email, otp, purpose } = req.body;

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

        // For forgot_password — don't issue full JWT, issue a short-lived reset token
        if (purpose === 'forgot_password') {
            const resetToken = jwt.sign(
                { userId: user.user_id, purpose: 'password_reset' },
                process.env.JWT_SECRET || 'secretkey',
                { expiresIn: '15m' }
            );
            return res.json({ success: true, resetToken, msg: 'OTP verified. You may now reset your password.' });
        }

        // For change_password_settings — just return success (will be verified directly in update password request)
        if (purpose === 'change_password_settings') {
            return res.json({ success: true, msg: 'OTP verified successfully.' });
        }

        // For email_login or email_verify — issue full auth JWT
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

        // 2. If no existing user, create a new account
        if (!user) {
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

        res.json({
            success: true,
            token,
            user: {
                id: user.user_id,
                email: user.email || null,
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
            return res.status(404).json({ msg: 'No account found with this phone number.' });
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

