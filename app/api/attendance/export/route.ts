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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const format = searchParams.get("format") || "json"

    let query = adminDb.collection("attendanceLogs").orderBy("checkInTimestamp", "desc")

    if (startDate) {
      query = query.where("checkInTimestamp", ">=", new Date(startDate))
    }
    if (endDate) {
      query = query.where("checkInTimestamp", "<=", new Date(endDate))
    }

    const attendanceSnapshot = await query.get()
    const membersSnapshot = await adminDb.collection("members").get()
    const meetingsSnapshot = await adminDb.collection("meetings").get()

    const attendanceLogs = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    const meetings = meetingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    if (format === "excel") {
      // In a real implementation, you would generate the Excel file here
      // and return it as a blob or save it to cloud storage
      return NextResponse.json({
        message: "Excel export functionality would be implemented here",
        data: { attendanceLogs, members, meetings },
      })
    }

    return NextResponse.json({
      attendanceLogs,
      members,
      meetings,
      summary: {
        totalRecords: attendanceLogs.length,
        dateRange: { startDate, endDate },
      },
    })
  } catch (error) {
    console.error("Export attendance error:", error)
    return NextResponse.json({ error: "Failed to export attendance data" }, { status: 500 })
  }
}
