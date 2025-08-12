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

    const { attendanceId } = await request.json()

    if (!attendanceId) {
      return NextResponse.json({ error: "Attendance ID required" }, { status: 400 })
    }

    // Update attendance record with checkout time
    await adminDb.collection("attendance_logs").doc(attendanceId).update({
      checkOutTimestamp: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to record checkout" }, { status: 500 })
  }
}
