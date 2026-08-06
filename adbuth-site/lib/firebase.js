/**
 * lib/firebase.js
 * Initializes the Firebase client-side SDK for Phone Authentication.
 * 
 * Required environment variables in .env:
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in Next.js hot-reload cycles
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * On localhost / 127.0.0.1, disable reCAPTCHA app verification entirely.
 * This prevents "reCAPTCHA session expired" errors caused by Google flagging
 * repeated test requests from the same browser session during development.
 *
 * ⚠️  This NEVER runs in production (any real domain) — reCAPTCHA is always
 *      enforced there. During local dev you can use:
 *        • Real phone numbers  → Firebase sends a real SMS, no CAPTCHA needed
 *        • Firebase test numbers (e.g. +91 9999999999 / code: 123456)
 *          Added via: Firebase Console → Authentication → Sign-in method → Phone
 */
if (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    auth.settings.appVerificationDisabledForTesting = true;
}

export { app, auth };
