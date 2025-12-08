// src/lib/firebaseConfig.ts

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ------------------------------
// FIREBASE CONFIG (CLIENT SAFE)
// ------------------------------
// Next.js inlines NEXT_PUBLIC_* env variables on both server & client
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Optional: warn instead of crashing if something is missing
if (!firebaseConfig.apiKey) {
  console.warn(
    "⚠️ Firebase config: NEXT_PUBLIC_FIREBASE_API_KEY is empty. Check your .env.local."
  );
}

// ------------------------------
// SINGLETON APP INSTANCE
// ------------------------------
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0] as FirebaseApp;
}

// ------------------------------
// FIRESTORE INSTANCE
// ------------------------------
export const db = getFirestore(app);
export default app;
