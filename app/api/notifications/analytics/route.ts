import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Get notifications in period
    const notificationsQuery = await adminDb.collection("notifications").where("createdAt", ">=", startDate).get()

    const notifications = notificationsQuery.docs.map((doc) => doc.data())

    // Calculate analytics
    const totalNotifications = notifications.length
    const sentNotifications = notifications.filter((n) => n.sentTime).length
    const scheduledNotifications = notifications.filter((n) => n.scheduledTime && !n.sentTime).length
    const totalReads = notifications.reduce((acc, n) => acc + (n.readBy?.length || 0), 0)
    const avgReadRate = totalNotifications > 0 ? totalReads / totalNotifications : 0

    // Get template usage
    const templatesQuery = await adminDb.collection("notificationTemplates").get()
    const templates = templatesQuery.docs.map((doc) => {
      const data = doc.data() as { isActive?: boolean; [key: string]: any }
      return { id: doc.id, ...data }
    })
    const activeTemplates = templates.filter((t) => t.isActive === true).length

    // Get recurring notifications
    const recurringNotifications = notifications.filter((n) => n.isRecurring).length

    const analytics = {
      totalNotifications,
      sentNotifications,
      scheduledNotifications,
      totalReads,
      avgReadRate: Math.round(avgReadRate * 100) / 100,
      totalTemplates: templates.length,
      activeTemplates,
      recurringNotifications,
      deliveryRate: sentNotifications > 0 ? Math.round((sentNotifications / totalNotifications) * 100) : 0,
      readRate: sentNotifications > 0 ? Math.round((totalReads / sentNotifications) * 100) : 0,
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("Get analytics error:", error)
    return NextResponse.json({ error: "Failed to get analytics" }, { status: 500 })
  }
}
