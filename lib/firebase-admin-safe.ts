import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin SDK for server-side operations
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Check if all required environment variables are present
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      console.warn(
        "Firebase Admin environment variables not properly configured"
      );
      console.warn("Missing:", {
        FIREBASE_PROJECT_ID: !projectId,
        FIREBASE_CLIENT_EMAIL: !clientEmail,
        FIREBASE_PRIVATE_KEY: !privateKey,
      });

      // Return a mock app object that will fail gracefully
      return {
        name: "[MOCK-APP]",
        options: {},
      } as any;
    }

    const serviceAccount = {
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };

    try {
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
      });
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      // Return a mock app object that will fail gracefully
      return {
        name: "[MOCK-APP]",
        options: {},
      } as any;
    }
  }

  return getApps()[0];
};

const app = initializeFirebaseAdmin();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminMessaging = getMessaging(app);

export default app;
