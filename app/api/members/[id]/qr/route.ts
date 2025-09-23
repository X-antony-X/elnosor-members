import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";

async function getUserRole(uid: string): Promise<"admin" | "member"> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role === "admin" ? "admin" : "member";
    }
    return "member";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "member";
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Get user role from Firestore
    const userRole = await getUserRole(decodedToken.uid);

    // Only admin can access member QR data
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get member data from Firestore
    const memberRef = doc(db, "members", id);
    const memberSnap = await getDoc(memberRef);

    if (memberSnap.exists()) {
      const memberData = memberSnap.data();
      const qrData = {
        id: memberSnap.id,
        name: memberData.fullName,
        phone: memberData.phonePrimary,
      };

      return NextResponse.json(qrData);
    } else {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching member QR data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
