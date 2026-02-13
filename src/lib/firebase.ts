import { type FirebaseApp, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

// TODO: Replace with your actual config or use environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("Firebase: Starting initialization script...");

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
    console.log("Firebase: Calling initializeApp...");
    app = initializeApp(firebaseConfig);
    console.log("Firebase: initializeApp success");

    console.log("Firebase: Calling getAuth...");
    auth = getAuth(app);
    console.log("Firebase: getAuth success");

    console.log("Firebase: Calling getFirestore...");
    db = getFirestore(app);
    console.log("Firebase: getFirestore success");
} catch (error) {
    console.error("Firebase: CRITICAL INITIALIZATION ERROR:", error);
}

// Exporting them (they might be undefined if we hit the catch)
export { auth, db };

// Diagnostic log for config
const keyStatus = firebaseConfig.apiKey ? "Present" : "MISSING";
console.log("Firebase: Auth key status: " + keyStatus);

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    console.log("🔥 Emulator mode requested (skipping for safety in production)");
}

console.log("Firebase: Script execution finished");

export default app;
