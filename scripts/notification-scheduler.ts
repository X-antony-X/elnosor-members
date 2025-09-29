import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import webpush, { PushSubscription } from "web-push";

let serviceAccount;
try {
  // Load from environment variable only
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set"
    );
  }
  serviceAccount = JSON.parse(serviceAccountKey);
  console.log(
    "Service account loaded successfully for project:",
    serviceAccount.project_id
  );
} catch (error) {
  console.error("Failed to load service account:", error);
  console.error(
    "Please ensure the FIREBASE_SERVICE_ACCOUNT_KEY environment variable contains valid JSON"
  );
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
  console.error(
    "VAPID keys are not set. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
  );
  process.exit(1);
}

async function sendDueNotifications() {
  const now = Timestamp.now();

  // Query notifications that are scheduled and not sent yet, and scheduledTime <= now
  const notificationsSnapshot = await db
    .collection("notifications")
    .where("scheduledTime", "<=", now)
    .get();

  // Filter out notifications that have already been sent
  const dueNotifications = notificationsSnapshot.docs.filter((doc) => {
    const data = doc.data();
    return !data.sentTime; // Only include notifications that haven't been sent
  });

  if (dueNotifications.length === 0) {
    console.log("No due notifications to send.");
  } else {
    for (const doc of dueNotifications) {
      const notification = doc.data();
      const title = notification.title;
      const message = notification.message;
      const targetAudience = notification.targetAudience;
      const targetIds = notification.targetIds || [];

      try {
        // Send OneSignal notification
        const response = await fetch(
          "https://onesignal.com/api/v1/notifications",
          {
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
              include_external_user_ids:
                targetAudience === "individuals" && targetIds.length > 0
                  ? targetIds
                  : undefined,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `OneSignal send failed with status ${response.status}`
          );
        }

        // Send web-push notifications
        const usersSnapshot = await db.collection("users").get();
        const sendPromises = usersSnapshot.docs.map(async (userDoc) => {
          const subRef = userDoc.ref
            .collection("pushSubscription")
            .doc("subscription");
          const subDoc = await subRef.get();
          if (!subDoc.exists) return;
          const subscription = subDoc.data() as PushSubscription;
          if (!subscription) return;
          try {
            await webpush.sendNotification(
              subscription,
              JSON.stringify({
                title,
                body: message,
                icon: "/icons/196.png",
                url: "/notifications",
              })
            );
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

  // Now handle new posts and comments notifications batching

  // 1. New Posts notifications
  const lastCheckTimeDoc = await db
    .collection("metadata")
    .doc("lastNotificationCheck")
    .get();
  let lastCheckTime = lastCheckTimeDoc.exists
    ? lastCheckTimeDoc.data()?.time
    : null;
  if (!lastCheckTime) {
    lastCheckTime = Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    ); // default to 24h ago
  }

  const postsSnapshot = await db
    .collection("posts")
    .where("createdAt", ">", lastCheckTime)
    .get();

  if (!postsSnapshot.empty) {
    for (const postDoc of postsSnapshot.docs) {
      const post = postDoc.data();
      const authorName = post.authorName || "عضو";

      const notificationData = {
        title: `منشور جديد من ${authorName}`,
        message: post.content || "",
        targetAudience: "all",
        targetIds: [],
        scheduledTime: null,
        sentTime: null,
        createdBy: "system",
        readBy: [],
        isRecurring: false,
        recurringPattern: null,
        templateId: null,
        priority: "normal",
        expiresAt: null,
        createdAt: Timestamp.now(),
      };

      try {
        await db.collection("notifications").add(notificationData);
        console.log(`Notification created for new post by ${authorName}`);
      } catch (error) {
        console.error(
          `Failed to create notification for post by ${authorName}:`,
          error
        );
      }
    }
  }

  // 2. New Comments notifications
  // Query all posts to get their comments
  const allPostsSnapshot = await db.collection("posts").get();

  for (const postDoc of allPostsSnapshot.docs) {
    const commentsSnapshot = await postDoc.ref
      .collection("comments")
      .where("createdAt", ">", lastCheckTime)
      .get();

    if (!commentsSnapshot.empty) {
      const post = postDoc.data();
      const postAuthorId = post.authorId;

      for (const commentDoc of commentsSnapshot.docs) {
        const comment = commentDoc.data();
        const authorName = comment.authorName || "عضو";

        if (authorName && postAuthorId && authorName !== postAuthorId) {
          const notificationData = {
            title: `تعليق جديد من ${authorName}`,
            message: comment.content || "",
            targetAudience: "individuals",
            targetIds: [postAuthorId],
            scheduledTime: null,
            sentTime: null,
            createdBy: "system",
            readBy: [],
            isRecurring: false,
            recurringPattern: null,
            templateId: null,
            priority: "normal",
            expiresAt: null,
            createdAt: Timestamp.now(),
          };

          try {
            await db.collection("notifications").add(notificationData);
            console.log(
              `Notification created for new comment by ${authorName}`
            );
          } catch (error) {
            console.error(
              `Failed to create notification for comment by ${authorName}:`,
              error
            );
          }
        }
      }
    }
  }

  // Update last check time
  await db.collection("metadata").doc("lastNotificationCheck").set({
    time: Timestamp.now(),
  });

  console.log("Notification scheduler run completed.");
}

// Run the scheduler once
sendDueNotifications()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Notification scheduler run failed:", error);
    process.exit(1);
  });
