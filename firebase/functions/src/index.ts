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

// Send scheduled notifications
export const sendScheduledNotifications = functions.pubsub.schedule("every 1 minutes").onRun(async (context) => {
  const now = admin.firestore.Timestamp.now()

  const notificationsQuery = await admin
    .firestore()
    .collection("notifications")
    .where("scheduledTime", "<=", now)
    .where("sentTime", "==", null)
    .get()

  const batch = admin.firestore().batch()

  for (const doc of notificationsQuery.docs) {
    const notification = doc.data()

    // Send FCM notification
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
        image: notification.imageUrl,
      },
      data: {
        notificationId: doc.id,
        type: "scheduled",
      },
    }

    let tokens: string[] = []

    if (notification.targetAudience === "all") {
      // Get all user tokens
      const usersQuery = await admin.firestore().collection("users").get()
      tokens = usersQuery.docs.map((userDoc) => userDoc.data().fcmToken).filter((token) => token)
    } else if (notification.targetAudience === "individuals" && notification.targetIds) {
      // Get specific user tokens
      for (const userId of notification.targetIds) {
        const userDoc = await admin.firestore().collection("users").doc(userId).get()
        const userData = userDoc.data()
        if (userData?.fcmToken) {
          tokens.push(userData.fcmToken)
        }
      }
    }

    if (tokens.length > 0) {
      try {
        await admin.messaging().sendMulticast({
          ...message,
          tokens,
        })
      } catch (error) {
        console.error("Failed to send notification:", error)
      }
    }

    // Mark as sent
    batch.update(doc.ref, {
      sentTime: admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
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
