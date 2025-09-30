import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { requireAdmin } from "@/lib/auth-middleware"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { user, error } = await requireAdmin(request)
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params

    // Only allow users to access their own credentials or admins to access any
    if (user.uid !== userId && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const userDoc = await adminDb.collection("webauthn_users").doc(userId).get()

    if (!userDoc.exists) {
      return NextResponse.json({ credentials: [] })
    }

    const credentials = userDoc.data()?.credentials || []

    // Remove sensitive data before sending
    const safeCredentials = credentials.map((cred: any) => ({
      id: cred.credentialID,
      deviceType: cred.deviceType,
      backedUp: cred.backedUp,
      transports: cred.transports,
      createdAt: cred.createdAt,
      lastUsed: cred.lastUsed,
      nickname: cred.nickname,
    }))

    return NextResponse.json({ credentials: safeCredentials })
  } catch (error) {
    console.error("Get credentials error:", error)
    return NextResponse.json({ error: "Failed to get credentials" }, { status: 500 })
  }
}
