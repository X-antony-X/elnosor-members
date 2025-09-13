import { NextRequest, NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { adminAuth } from "@/lib/firebase-admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params

    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const idToken = authHeader.split("Bearer ")[1]
    const decodedToken = await adminAuth.verifyIdToken(idToken)

    // Check if user is requesting their own data or is admin
    if (decodedToken.uid !== uid && decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get member data from Firestore
    const memberRef = doc(db, "members", uid)
    const memberSnap = await getDoc(memberRef)

    if (memberSnap.exists()) {
      const memberData = memberSnap.data()
      return NextResponse.json({
        id: memberSnap.id,
        ...memberData,
        createdAt: memberData.createdAt?.toDate?.() || memberData.createdAt,
        updatedAt: memberData.updatedAt?.toDate?.() || memberData.updatedAt,
      })
    } else {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error fetching member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
