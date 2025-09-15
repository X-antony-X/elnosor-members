import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { requireAdmin } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: error || "Unauthorized" }, { status: 401 })
    }

    const { uid, role } = await request.json()

    // Validate input
    if (!uid || !role || !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid uid or role" }, { status: 400 })
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role })

    // Update member document
    await adminDb.collection("members").doc(uid).update({
      role,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set user role error:", error)
    return NextResponse.json({ error: "Failed to set user role" }, { status: 500 })
  }
}
