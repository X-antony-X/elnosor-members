import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyAuth } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await verifyAuth(request)
    if (error || !user) {
      return NextResponse.json({ error: error || "Authentication required" }, { status: 401 })
    }

    const { memberId, meetingId, checkInMethod, note } = await request.json()

    // Validate input
    if (!memberId || !meetingId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create attendance record
    const attendanceRef = adminDb.collection("attendance_logs").doc()

    await attendanceRef.set({
      memberId,
      meetingId,
      checkInTimestamp: new Date(),
      checkOutTimestamp: null,
      checkInMethod: checkInMethod || "manual",
      note: note || "",
      recordedBy: user.uid,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, attendanceId: attendanceRef.id })
  } catch (error) {
    console.error("Record attendance error:", error)
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 })
  }
}
