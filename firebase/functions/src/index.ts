import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

admin.initializeApp()

// Set custom claims for user roles
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Check if request is made by an admin
  if (!context.auth || context.auth.token.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can set user roles")
  }

  const { uid, role } = data

  if (!uid || !role || !["admin", "member"].includes(role)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid uid or role")
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role })

    // Update user document
    await admin.firestore().collection("users").doc(uid).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Failed to set user role")
  }
})

// Verify QR code and record attendance
export const recordAttendance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated")
  }

  const { memberId, meetingId, checkInMethod, note } = data

  if (!memberId || !meetingId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields")
  }

  try {
    const attendanceRef = admin.firestore().collection("attendance_logs").doc()

    await attendanceRef.set({
      memberId,
      meetingId,
      checkInTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      checkOutTimestamp: null,
      checkInMethod: checkInMethod || "manual",
      note: note || "",
      recordedBy: context.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true, attendanceId: attendanceRef.id }
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Failed to record attendance")
  }
})

async function sendNotificationToUsers(notification: any, notificationId: string) {
  const onesignalAppId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!onesignalAppId || !restApiKey) {
    console.error('OneSignal configuration missing');
    return;
  }

  let includeExternalUserIds: string[] = [];

  if (notification.targetAudience === "all") {
    // Send to all
  } else if (notification.targetAudience === "group" && notification.targetIds) {
    // Get user IDs for the group
    for (const groupId of notification.targetIds) {
      const groupUsersQuery = await admin.firestore()
        .collection("users")
        .where("groupId", "==", groupId)
        .where("notificationsEnabled", "==", true)
        .get()

      const groupUserIds = groupUsersQuery.docs.map(doc => doc.id);
      includeExternalUserIds.push(...groupUserIds);
    }
  } else if (notification.targetAudience === "individuals" && notification.targetIds) {
    includeExternalUserIds = notification.targetIds;
  }

  // Remove duplicates
  includeExternalUserIds = [...new Set(includeExternalUserIds)];

  const payload: any = {
    app_id: onesignalAppId,
    headings: { "en": notification.title, "ar": notification.title },
    contents: { "en": notification.message, "ar": notification.message },
    data: {
      notificationId,
      type: notification.scheduledTime ? "scheduled" : "immediate",
      priority: notification.priority || "normal",
    },
  };

  if (notification.imageUrl) {
    payload.big_picture = notification.imageUrl;
  }

  if (includeExternalUserIds.length > 0) {
    payload.include_external_user_ids = includeExternalUserIds;
  } else {
    payload.included_segments = ["All"];
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OneSignal API error: ${response.status} ${errorData.message}`);
    }

    const result = await response.json();
    console.log(`Sent notification to OneSignal, ID: ${result.id}`);

    // Mark as sent
    await admin.firestore().collection("notifications").doc(notificationId).update({
      sentTime: admin.firestore.FieldValue.serverTimestamp(),
      sentCount: result.recipients || 0,
      onesignalNotificationId: result.id,
    });
  } catch (error) {
    console.error("Failed to send OneSignal notification:", error);
    // Still mark as attempted
    await admin.firestore().collection("notifications").doc(notificationId).update({
      sentTime: admin.firestore.FieldValue.serverTimestamp(),
      sentCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Send immediate notifications when created
export const sendImmediateNotification = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    const notification = snap.data()

    // Only send if not scheduled (immediate notification)
    if (notification.scheduledTime) {
      return null
    }

    await sendNotificationToUsers(notification, snap.id)
    return null
  })

// Send scheduled notifications
export const sendScheduledNotifications = functions.pubsub.schedule("every 1 minutes").onRun(async (context) => {
  const now = admin.firestore.Timestamp.now()

  const notificationsQuery = await admin
    .firestore()
    .collection("notifications")
    .where("scheduledTime", "<=", now)
    .where("sentTime", "==", null)
    .get()

  for (const doc of notificationsQuery.docs) {
    const notification = doc.data()

    await sendNotificationToUsers(notification, doc.id)
  }

  return null
})

// Send scheduled notifications from templates
export const sendScheduledTemplateNotifications = functions.pubsub.schedule("every 5 minutes").onRun(async (context) => {
  const now = admin.firestore.Timestamp.now()

  const schedulesQuery = await admin
    .firestore()
    .collection("notificationSchedules")
    .where("isActive", "==", true)
    .where("nextSend", "<=", now)
    .get()

  for (const doc of schedulesQuery.docs) {
    const schedule = doc.data()

    // Get template
    const templateDoc = await admin.firestore().collection("notificationTemplates").doc(schedule.templateId).get()
    if (!templateDoc.exists) continue

    const template = templateDoc.data()
    if (!template) continue

    // Create notification from template
    const notificationData = {
      title: template.title,
      message: template.message,
      targetAudience: schedule.targetAudience,
      targetIds: schedule.targetIds,
      templateId: schedule.templateId,
      createdBy: schedule.createdBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      variables: schedule.variables || {},
    }

    // Send the notification
    await sendNotificationToUsers(notificationData, `${doc.id}-${Date.now()}`)

    // Update schedule for next send
    let nextSend = new Date(schedule.nextSend.toDate())

    if (schedule.recurringPattern) {
      const pattern = schedule.recurringPattern

      switch (pattern.type) {
        case "daily":
          nextSend.setDate(nextSend.getDate() + pattern.interval)
          break
        case "weekly":
          nextSend.setDate(nextSend.getDate() + (pattern.interval * 7))
          break
        case "monthly":
          nextSend.setMonth(nextSend.getMonth() + pattern.interval)
          break
        case "yearly":
          nextSend.setFullYear(nextSend.getFullYear() + pattern.interval)
          break
      }
    } else {
      // One-time schedule, deactivate
      await doc.ref.update({ isActive: false })
      continue
    }

    await doc.ref.update({
      nextSend: admin.firestore.Timestamp.fromDate(nextSend),
      lastSent: admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  return null
})

// Clean up old attendance logs
export const cleanupOldData = functions.pubsub
  .schedule("0 2 * * *") // Daily at 2 AM
  .onRun(async (context) => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const oldLogsQuery = await admin
      .firestore()
      .collection("attendance_logs")
      .where("createdAt", "<", admin.firestore.Timestamp.fromDate(sixMonthsAgo))
      .get()

    const batch = admin.firestore().batch()

    oldLogsQuery.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    console.log(`Deleted ${oldLogsQuery.docs.length} old attendance logs`)

    return null
  })
