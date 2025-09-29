import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import webpush, { PushSubscription } from "web-push";
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          process.env[key] = value.slice(1, -1);
        } else {
          process.env[key] = value;
        }
      }
    }
  }
}

let serviceAccount;
try {
  // Try to load from environment variable first
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    serviceAccount = JSON.parse(serviceAccountKey);
  } else {
    // Fallback: load from the downloaded JSON file
    const serviceAccountPath = 'c:/Users/mixco/Downloads/member-elnosor-firebase-adminsdk-fbsvc-1c2ea65e42.json';
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountContent);
    } else {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set and service account file not found');
    }
  }
  console.log('Service account loaded successfully for project:', serviceAccount.project_id);
} catch (error) {
  console.error('Failed to load service account:', error);
  console.error('Please ensure the environment variable contains valid JSON or the service account file exists');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:petereshak11@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.error("VAPID keys are not set. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
  process.exit(1);
}

async function sendDueNotifications() {
  const now = Timestamp.now();

  // Query notifications that are scheduled and not sent yet, and scheduledTime <= now
  // First get all notifications with scheduledTime <= now, then filter client-side
  const notificationsSnapshot = await db.collection("notifications")
    .where("scheduledTime", "<=", now)
    .get();

  // Filter out notifications that have already been sent
  const dueNotifications = notificationsSnapshot.docs.filter(doc => {
    const data = doc.data();
    return !data.sentTime; // Only include notifications that haven't been sent
  });

  if (dueNotifications.length === 0) {
    console.log("No due notifications to send.");
    return;
  }

  for (const doc of dueNotifications) {
    const notification = doc.data();
    const title = notification.title;
    const message = notification.message;
    const targetAudience = notification.targetAudience;
    const targetIds = notification.targetIds || [];

    try {
      // Send OneSignal notification
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          headings: { en: title },
          contents: { en: message },
          included_segments: targetAudience === "all" ? ["All"] : undefined,
          include_external_user_ids: targetAudience === "individuals" && targetIds.length > 0 ? targetIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`OneSignal send failed with status ${response.status}`);
      }

      // Send web-push notifications
      const usersSnapshot = await db.collection("users").get();
      const sendPromises = usersSnapshot.docs.map(async (userDoc) => {
        const subRef = userDoc.ref.collection("pushSubscription").doc("subscription");
        const subDoc = await subRef.get();
        if (!subDoc.exists) return;
        const subscription = subDoc.data() as PushSubscription;
        if (!subscription) return;
        try {
          await webpush.sendNotification(subscription, JSON.stringify({
            title,
            body: message,
            icon: "/icons/icon-192x192.png",
            url: "/notifications",
          }));
        } catch (error: any) {
          console.error("Web-push error:", error);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await subRef.delete();
          }
        }
      });

      await Promise.all(sendPromises);

      // Update notification sentTime
      await doc.ref.update({
        sentTime: Timestamp.now(),
      });

      console.log(`Notification ${doc.id} sent successfully.`);
    } catch (error) {
      console.error(`Failed to send notification ${doc.id}:`, error);
    }
  }
}

// Run the scheduler once
sendDueNotifications()
  .then(() => {
    console.log("Notification scheduler run completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Notification scheduler run failed:", error);
    process.exit(1);
  });
