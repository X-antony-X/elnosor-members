import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const role = userData?.role === "admin" ? "admin" : "member";

    // Define permissions based on role
    const permissions = {
      role,
      canManageMembers: role === "admin",
      canManagePosts: role === "admin",
      canManageAttendance: role === "admin",
      canManageNotifications: role === "admin",
      canViewAnalytics: role === "admin",
      canEditProfile: true, // Both can edit their own profile
      canDeletePosts: role === "admin",
      canScheduleNotifications: role === "admin",
      canViewAllAttendance: role === "admin",
      canExportData: role === "admin",
    };

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
