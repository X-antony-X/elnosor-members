import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    // Check if user exists in admins collection
    const adminDoc = await adminDb.collection("admins").doc(uid).get();

    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      return NextResponse.json({
        role: "admin",
        profile: adminData,
      });
    }

    // Check if user exists in members collection
    const memberDoc = await adminDb.collection("members").doc(uid).get();

    if (memberDoc.exists) {
      const memberData = memberDoc.data();
      return NextResponse.json({
        role: "member",
        profile: memberData,
      });
    }

    return NextResponse.json({
      role: "member", // Default role
      profile: null,
    });
  } catch (error) {
    console.error("Check role error:", error);
    return NextResponse.json(
      { error: "Failed to check role" },
      { status: 500 }
    );
  }
}
