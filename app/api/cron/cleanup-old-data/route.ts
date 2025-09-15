import { type NextRequest, NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/lib/firebase-admin"

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

    // Cleanup incomplete user profiles (users without members, older than 1 hour)
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const usersQuery = await adminDb
      .collection("users")
      .where("createdAt", "<", oneHourAgo)
      .limit(100)
      .get()

    let deletedUsersCount = 0
    for (const userDoc of usersQuery.docs) {
      const userId = userDoc.id
      const memberDoc = await adminDb.collection("members").doc(userId).get()
      if (!memberDoc.exists) {
        // Delete from users collection
        batch.delete(userDoc.ref)
        // Also delete from Firebase Auth if possible
        try {
          await adminAuth.deleteUser(userId)
        } catch (authError) {
          console.error(`Failed to delete user ${userId} from Auth:`, authError)
        }
        deletedUsersCount++
      }
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      deletedLogsCount: oldLogsQuery.docs.length,
      deletedUsersCount,
      message: `Deleted ${oldLogsQuery.docs.length} old attendance logs and ${deletedUsersCount} incomplete user profiles`,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Failed to cleanup old data" }, { status: 500 })
  }
}
