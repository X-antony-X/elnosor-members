import { type NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "UID is required" },
        { status: 400 }
      );
    }

    // Get user from Firebase Auth
    const userRecord = await adminAuth.getUser(uid);

    // Check custom claims
    const customClaims = userRecord.customClaims || {};
    const tokenRole = customClaims.role;

    if (tokenRole === "admin") {
      // Verify admin profile exists
      const adminDoc = await adminDb.collection("admins").doc(uid).get();
      if (adminDoc.exists) {
        return NextResponse.json({ role: "admin" });
      } else {
        // Check users collection
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists && userDoc.data()?.role === "admin") {
          return NextResponse.json({ role: "admin" });
        }
      }
    } else if (tokenRole === "member") {
      return NextResponse.json({ role: "member" });
    }

    // Fallback: check users collection
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData) {
        const role = userData.role === "admin" ? "admin" : "member";
        return NextResponse.json({ role });
      }
    }

    return NextResponse.json({ role: "member" });
  } catch (error) {
    console.error("Error checking role:", error);
    return NextResponse.json(
      { error: "Failed to check role", role: "member" },
      { status: 500 }
    );
  }
}
