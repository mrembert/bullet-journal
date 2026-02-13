import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual config or use environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("Firebase: Initializing app...");
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Diagnostic log for config (will help verify if vars reached the build)
console.log("Firebase: Config initialized (API Key exists: " + !!firebaseConfig.apiKey + ")");

// Development Environment Setup - Removed top-level await for stability
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    console.log("🔥 Emulator mode requested...");
    // In a real app we might use conditional imports here, but let's keep it simple for now
    // and just not use top-level await which can hang some environments.
}

console.log("Firebase: Exporting auth and db");

export default app;
