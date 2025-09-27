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

// Helper function to send notification to users
async function sendNotificationToUsers(notification: any, notificationId: string) {
  const message = {
    notification: {
      title: notification.title,
      body: notification.message,
      image: notification.imageUrl,
    },
    data: {
      notificationId,
      type: notification.scheduledTime ? "scheduled" : "immediate",
      priority: notification.priority || "normal",
    },
  }

  let tokens: string[] = []

  if (notification.targetAudience === "all") {
    // Get all user tokens
    const usersQuery = await admin.firestore()
      .collection("users")
      .where("notificationsEnabled", "==", true)
      .get()
    tokens = usersQuery.docs
      .map((userDoc) => userDoc.data()?.fcmToken)
      .filter((token): token is string => token !== undefined && token !== null)
  } else if (notification.targetAudience === "group" && notification.targetIds) {
    // Get users in specific groups
    for (const groupId of notification.targetIds) {
      const groupUsersQuery = await admin.firestore()
        .collection("users")
        .where("groupId", "==", groupId)
        .where("notificationsEnabled", "==", true)
        .get()

      const groupTokens = groupUsersQuery.docs
        .map((userDoc) => userDoc.data()?.fcmToken)
        .filter((token): token is string => token !== undefined && token !== null)

      tokens.push(...groupTokens)
    }
  } else if (notification.targetAudience === "individuals" && notification.targetIds) {
    // Get specific user tokens
    for (const userId of notification.targetIds) {
      const userDoc = await admin.firestore().collection("users").doc(userId).get()
      const userData = userDoc.data()
      if (userData?.fcmToken && userData?.notificationsEnabled) {
        tokens.push(userData.fcmToken)
      }
    }
  }

  // Remove duplicates
  tokens = [...new Set(tokens)]

  if (tokens.length > 0) {
    try {
      const result = await admin.messaging().sendMulticast({
        ...message,
        tokens,
      })

      console.log(`Sent notification to ${result.successCount} devices`)

      // Mark as sent
      await admin.firestore().collection("notifications").doc(notificationId).update({
        sentTime: admin.firestore.FieldValue.serverTimestamp(),
        sentCount: result.successCount,
        failureCount: result.failureCount,
      })
    } catch (error) {
      console.error("Failed to send notification:", error)
    }
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
