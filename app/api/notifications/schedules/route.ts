import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-middleware"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const schedulesQuery = await adminDb.collection("notificationSchedules").orderBy("scheduledTime", "asc").get()

    const schedules = schedulesQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Get schedules error:", error)
    return NextResponse.json({ error: "Failed to get schedules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { templateId, scheduledTime, recurringPattern, targetAudience, targetIds, variables } = await request.json()

    if (!templateId || !scheduledTime) {
      return NextResponse.json({ error: "Template ID and scheduled time are required" }, { status: 400 })
    }

    // Verify template exists
    const templateDoc = await adminDb.collection("notificationTemplates").doc(templateId).get()
    if (!templateDoc.exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const scheduleRef = adminDb.collection("notificationSchedules").doc()
    const scheduleData = {
      templateId,
      scheduledTime: new Date(scheduledTime),
      recurringPattern: recurringPattern || null,
      targetAudience: targetAudience || "all",
      targetIds: targetIds || [],
      variables: variables || {},
      isActive: true,
      createdBy: user.uid,
      createdAt: new Date(),
      nextSend: new Date(scheduledTime),
    }

    await scheduleRef.set(scheduleData)

    return NextResponse.json({
      success: true,
      scheduleId: scheduleRef.id,
      schedule: { id: scheduleRef.id, ...scheduleData },
    })
  } catch (error) {
    console.error("Create schedule error:", error)
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
  }
}
