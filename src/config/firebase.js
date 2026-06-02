// src/config/firebase.js
// Firebase web SDK initialization for Google Authentication.
// Credentials are read from environment variables (see .env / .env.example).
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Firebase Auth instance and Google provider, reused across the app.
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// Always let the user pick which Google account to use.
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
