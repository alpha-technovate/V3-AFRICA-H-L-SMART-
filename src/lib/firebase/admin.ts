// src/lib/firebase/admin.ts
import * as admin from "firebase-admin";

let app: admin.app.App;

// Prevent re-initialization in Next.js hot reload
if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)
    ),
  });
} else {
  app = admin.app();
}

export const db = app.firestore();
export const auth = app.auth();
export const storage = app.storage();

// FIX: Export the Timestamp utility from the Admin SDK
export const Timestamp = admin.firestore.Timestamp;