import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
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

export async function PUT(
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

    // Only admin can update member data
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Update member data in Firestore
    const memberRef = doc(db, "members", id);
    await updateDoc(memberRef, {
      ...body,
      updatedAt: new Date(),
    });

    // Get updated data
    const updatedSnap = await getDoc(memberRef);
    const updatedData = updatedSnap.data();

    return NextResponse.json({
      id: updatedSnap.id,
      ...updatedData,
      createdAt: updatedData?.createdAt?.toDate?.() || updatedData?.createdAt,
      updatedAt: updatedData?.updatedAt?.toDate?.() || updatedData?.updatedAt,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
