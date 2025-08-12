import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Get old attendance logs
    const oldLogsQuery = await adminDb
      .collection("attendance_logs")
      .where("createdAt", "<", sixMonthsAgo)
      .limit(500) // Process in batches to avoid timeout
      .get()

    const batch = adminDb.batch()

    oldLogsQuery.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    return NextResponse.json({
      success: true,
      deletedCount: oldLogsQuery.docs.length,
      message: `Deleted ${oldLogsQuery.docs.length} old attendance logs`,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Failed to cleanup old data" }, { status: 500 })
  }
}
