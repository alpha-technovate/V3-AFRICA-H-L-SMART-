// src/lib/firebase/admin.ts
import * as admin from "firebase-admin";

// Use 'server-only' to explicitly mark this module for server environments
// import 'server-only'; // (Install this package if you haven't)

let app: admin.app.App;

// 1. Get the Service Account Key string from environment variables
const serviceAccountKeyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// 2. Check if the app has already been initialized (for hot reload prevention)
if (!admin.apps.length) {
  // 3. CRUCIAL SAFETY CHECK: Ensure the key string is available
  if (serviceAccountKeyString) {
    try {
      // 4. Safely parse the JSON string to get the credential object
      const serviceAccount = JSON.parse(serviceAccountKeyString);
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e) {
      console.error(
        "FATAL ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Check Vercel environment variables.",
        e
      );
      // Fallback or throw if initialization is critical
      // For now, let it fall through and rely on 'admin.app()' if possible
      throw new Error("Firebase Admin Initialization Failed.");
    }
  } else {
    // If the key is missing (e.g., during build), log an error but proceed 
    // to allow the build to finish. API routes will fail at runtime if the key is needed.
    console.error("WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is undefined. Admin SDK functionality will not work.");
    // We cannot initialize the app without credentials, so let the app be uninitialized
    // and rely on the calling functions to handle the error or subsequent 'admin.app()' call.
    throw new Error("Firebase Service Account key is missing.");
  }
} else {
  // If the app is already running (hot reload)
  app = admin.app();
}

// Export the initialized services
export const db = app.firestore();
export const auth = app.auth();
export const storage = app.storage();
export const Timestamp = admin.firestore.Timestamp;