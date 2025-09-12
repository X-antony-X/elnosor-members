import { type NextRequest, NextResponse } from "next/server"
import { adminDb, adminMessaging } from "@/lib/firebase-admin"
import { requireAdmin } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    const { title, message, imageUrl, targetAudience, targetIds, scheduledTime } = await request.json()

    // Validate input
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    // Create notification document
    const notificationRef = adminDb.collection("notifications").doc()
    const notificationData = {
      title,
      message,
      imageUrl: imageUrl || null,
      targetAudience: targetAudience || "all",
      targetIds: targetIds || [],
      scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
      sentTime: null,
      createdBy: user.uid,
      createdAt: new Date(),
    }

    await notificationRef.set(notificationData)

    // If scheduled for now, send immediately
    if (!scheduledTime || new Date(scheduledTime) <= new Date()) {
      await sendNotification(notificationRef.id, notificationData)
    }

    return NextResponse.json({ success: true, notificationId: notificationRef.id })
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

async function sendNotification(notificationId: string, notificationData: any) {
  try {
    const message = {
      notification: {
        title: notificationData.title,
        body: notificationData.message,
        image: notificationData.imageUrl,
      },
      data: {
        notificationId,
        type: "scheduled",
      },
    }

    let tokens: string[] = []

    if (notificationData.targetAudience === "all") {
      // Get all user tokens
      const usersQuery = await adminDb.collection("users").get()
      tokens = usersQuery.docs.map((userDoc) => userDoc.data().fcmToken).filter((token) => token)
    } else if (notificationData.targetAudience === "individuals" && notificationData.targetIds) {
      // Get specific user tokens
      for (const userId of notificationData.targetIds) {
        const userDoc = await adminDb.collection("users").doc(userId).get()
        const userData = userDoc.data()
        if (userData?.fcmToken) {
          tokens.push(userData.fcmToken)
        }
      }
    }

    if (tokens.length > 0) {
      await adminMessaging.sendMulticast({
        ...message,
        tokens,
      })
    }

    // Mark as sent
    await adminDb.collection("notifications").doc(notificationId).update({
      sentTime: new Date(),
    })
  } catch (error) {
    console.error("Failed to send notification:", error)
  }
}
