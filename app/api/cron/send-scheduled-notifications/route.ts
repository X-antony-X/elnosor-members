import { type NextRequest, NextResponse } from "next/server"
import { adminDb, adminMessaging } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // Get scheduled notifications that haven't been sent
    const notificationsQuery = await adminDb
      .collection("notifications")
      .where("scheduledTime", "<=", now)
      .where("sentTime", "==", null)
      .get()

    const batch = adminDb.batch()
    let sentCount = 0

    for (const doc of notificationsQuery.docs) {
      const notification = doc.data()

      try {
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
          const usersQuery = await adminDb.collection("users").get()
          tokens = usersQuery.docs.map((userDoc) => userDoc.data().fcmToken).filter((token) => token)
        } else if (notification.targetAudience === "individuals" && notification.targetIds) {
          // Get specific user tokens
          for (const userId of notification.targetIds) {
            const userDoc = await adminDb.collection("users").doc(userId).get()
            const userData = userDoc.data()
            if (userData?.fcmToken) {
              tokens.push(userData.fcmToken)
            }
          }
        }

        if (tokens.length > 0) {
          // FCM sendMulticast expects a MulticastMessage object
          await adminMessaging.sendEachForMulticast({
            tokens,
            notification: message.notification,
            data: message.data,
          })
          sentCount++
        }

        // Mark as sent
        batch.update(doc.ref, {
          sentTime: new Date(),
        })
      } catch (error) {
        console.error("Failed to send notification:", error)
      }
    }

    await batch.commit()

    return NextResponse.json({ success: true, sentCount })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ error: "Failed to process scheduled notifications" }, { status: 500 })
  }
}
