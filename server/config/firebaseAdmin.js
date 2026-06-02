// server/config/firebaseAdmin.js
// Firebase Admin SDK initialization. Used to verify Firebase ID tokens
// sent from the client after a successful Google sign-in.
// Credentials come from environment variables (see server/.env / .env.example).
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Private keys stored in .env keep their newlines escaped as "\n";
// convert them back to real newlines before use.
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    'Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in server/.env'
  );
}

// Initialize once (guard against re-initialization on hot reload).
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

module.exports = admin;
module.exports.auth = admin.auth();
