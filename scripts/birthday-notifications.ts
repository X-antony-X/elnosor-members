import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";

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

async function sendBirthdayNotifications() {
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDay = today.getDate();

  console.log(`Checking for birthdays on ${currentMonth}/${currentDay}`);

  // Query users whose birthday matches today
  const usersSnapshot = await db
    .collection("users")
    .where("birthMonth", "==", currentMonth)
    .where("birthDay", "==", currentDay)
    .get();

  if (usersSnapshot.empty) {
    console.log("No birthdays today.");
    return;
  }

  const birthdayUsers = usersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      displayName: data.displayName || "",
      name: data.name || "",
      ...data,
    };
  });

  console.log(`Found ${birthdayUsers.length} birthday(s) today`);

  // Create birthday notifications for each birthday person
  for (const user of birthdayUsers) {
    const userName = user.displayName || user.name || "عضو الخدمة";

    // Create notification for all users to wish happy birthday
    const notificationData = {
      title: `عيد ميلاد سعيد! 🎉`,
      message: `اليوم عيد ميلاد ${userName}. نتمنى له/لها عاماً مليئاً بالخير والبركة!`,
      targetAudience: "all",
      targetIds: [],
      scheduledTime: null, // Send immediately
      sentTime: Timestamp.now(),
      createdBy: "system", // System-generated
      readBy: [],
      isRecurring: false,
      recurringPattern: null,
      templateId: null,
      priority: "high",
      expiresAt: null,
      createdAt: Timestamp.now(),
    };

    try {
      await db.collection("notifications").add(notificationData);
      console.log(`Birthday notification created for ${userName}`);
    } catch (error) {
      console.error(
        `Failed to create birthday notification for ${userName}:`,
        error
      );
    }
  }

  // Also send push notifications via the API
  try {
    const response = await fetch(
      "http://localhost:3000/api/notifications/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `عيد ميلاد سعيد! 🎉`,
          message: `اليوم عيد ميلاد ${birthdayUsers
            .map((u) => u.displayName || u.name || "عضو")
            .join(" و ")}. نتمنى لهم عاماً مليئاً بالخير والبركة!`,
          targetAudience: "all",
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send birthday push notifications");
    } else {
      console.log("Birthday push notifications sent successfully");
    }
  } catch (error) {
    console.error("Error sending birthday push notifications:", error);
  }
}

// Run the birthday checker once
sendBirthdayNotifications()
  .then(() => {
    console.log("Birthday notifications check completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Birthday notifications check failed:", error);
    process.exit(1);
  });
