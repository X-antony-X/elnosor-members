import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-middleware"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await verifyAuth(request)

    if (error || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { qrData, meetingId } = await request.json()

    // Parse and validate QR data
    let parsedData
    try {
      parsedData = JSON.parse(qrData)
    } catch {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    const { memberId, meetingId: qrMeetingId, timestamp } = parsedData

    // Validate QR code
    if (!memberId || !qrMeetingId || qrMeetingId !== meetingId) {
      return NextResponse.json({ error: "Invalid or expired QR code" }, { status: 400 })
    }

    // Check if QR is not too old (5 minutes)
    const qrAge = Date.now() - timestamp
    if (qrAge > 5 * 60 * 1000) {
      return NextResponse.json({ error: "QR code expired" }, { status: 400 })
    }

    // Check if member exists
    const memberDoc = await adminDb.collection("members").doc(memberId).get()
    if (!memberDoc.exists) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Check if already checked in
    const existingLog = await adminDb
      .collection("attendanceLogs")
      .where("memberId", "==", memberId)
      .where("meetingId", "==", meetingId)
      .get()

    if (!existingLog.empty) {
      return NextResponse.json({ error: "Member already checked in" }, { status: 400 })
    }

    // Get meeting details for lateness calculation
    const meetingDoc = await adminDb.collection("meetings").doc(meetingId).get()
    if (!meetingDoc.exists) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    const meeting = meetingDoc.data()
    const lateness = Math.max(0, Math.floor((Date.now() - meeting.startTime.toMillis()) / 60000))

    // Create attendance log
    const attendanceLog = {
      memberId,
      meetingId,
      checkInTimestamp: new Date(),
      checkInMethod: "qr",
      lateness,
      createdAt: new Date(),
    }

    const docRef = await adminDb.collection("attendanceLogs").add(attendanceLog)

    return NextResponse.json({
      success: true,
      logId: docRef.id,
      member: memberDoc.data(),
      lateness,
    })
  } catch (error) {
    console.error("QR scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
