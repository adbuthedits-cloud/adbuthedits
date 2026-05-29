/**
 * firebaseAdmin.js
 * Initializes the Firebase Admin SDK using the service account credentials.
 * Used for verifying Firebase ID tokens on the backend.
 */

const admin = require('firebase-admin');
const path = require('path');

let firebaseAdmin;

function getFirebaseAdmin() {
    if (firebaseAdmin) return firebaseAdmin;

    try {
        // Try to load from file path first
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (serviceAccountPath) {
            const resolvedPath = path.resolve(__dirname, '..', serviceAccountPath);
            const serviceAccount = require(resolvedPath);

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
                });
                console.log('[Firebase Admin] Initialized with service account file.');
            }
        } else {
            // Fallback: initialize with env variables for production deployments
            // (where you might not want to ship the JSON file)
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: process.env.FIREBASE_PROJECT_ID,
                });
                console.log('[Firebase Admin] Initialized with application default credentials.');
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
