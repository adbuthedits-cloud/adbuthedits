/**
 * firebaseAdmin.js
 * Initializes the Firebase Admin SDK using the service account credentials.
 * Used for verifying Firebase ID tokens on the backend.
 *
 * Supports three initialization methods (in priority order):
 *  1. FIREBASE_SERVICE_ACCOUNT_JSON  — full JSON string as env var (best for production/Render)
 *  2. FIREBASE_SERVICE_ACCOUNT_PATH  — path to JSON file (good for local dev)
 *  3. Application Default Credentials — fallback (only works on GCP infra)
 */

const admin = require('firebase-admin');
const path = require('path');

let firebaseAdmin;

function getFirebaseAdmin() {
    if (firebaseAdmin) return firebaseAdmin;

    try {
        // ── Method 1: Full JSON string in environment variable (production-safe) ──
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (serviceAccountJson) {
            let serviceAccount;
            try {
                serviceAccount = JSON.parse(serviceAccountJson);
            } catch (parseErr) {
                throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${parseErr.message}`);
            }

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id,
                });
                console.log('[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT_JSON env var.');
            }

        // ── Method 2: Path to JSON file (local development) ──────────────────────
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
            // Resolve relative to CWD (the backend root where server.js runs)
            const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
            const serviceAccount = require(resolvedPath);

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
                });
                console.log('[Firebase Admin] Initialized with service account file:', resolvedPath);
            }

        // ── Method 3: Application Default Credentials (GCP only) ─────────────────
        } else {
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: process.env.FIREBASE_PROJECT_ID,
                });
                console.log('[Firebase Admin] Initialized with Application Default Credentials.');
            }
        }

        firebaseAdmin = admin;
        return firebaseAdmin;
    } catch (err) {
        console.error('[Firebase Admin] Initialization failed:', err.message);
        throw err;
    }
}

module.exports = { getFirebaseAdmin };
