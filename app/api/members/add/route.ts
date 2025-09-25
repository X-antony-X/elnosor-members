import { NextRequest, NextResponse } from "next/server";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";

async function getUserRole(uid: string): Promise<"admin" | "member"> {
  try {
    // Check if user exists in admins collection
    const adminRef = doc(db, "admins", uid);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      return "admin";
    }

    // Check if user exists in users collection and has admin role
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData?.role === "admin") {
        return "admin";
      }
    }

    // Check if user exists in members collection
    const memberRef = doc(db, "members", uid);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      return "member";
    }

    return "member";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "member";
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Get user role from Firestore
    const userRole = await getUserRole(decodedToken.uid);

    // Only admin can add members
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.fullName || !body.phonePrimary) {
      return NextResponse.json(
        { error: "Full name and primary phone are required" },
        { status: 400 }
      );
    }

    // Add member to Firestore
    const membersRef = collection(db, "members");
    const newMember = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(membersRef, newMember);

    return NextResponse.json({
      id: docRef.id,
      ...newMember,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
