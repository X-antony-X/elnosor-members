import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
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

export async function GET(request: NextRequest) {
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

    // Only admin can access members list
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (memberId) {
      // Get specific member by ID
      const memberRef = doc(db, "members", memberId);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        const memberData = memberSnap.data();
        return NextResponse.json({
          id: memberSnap.id,
          ...memberData,
          dateOfBirth:
            memberData.dateOfBirth?.toDate?.() || memberData.dateOfBirth,
          createdAt: memberData.createdAt?.toDate?.() || memberData.createdAt,
          updatedAt: memberData.updatedAt?.toDate?.() || memberData.updatedAt,
        });
      } else {
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
      }
    } else {
      // Get all members from Firestore
      const membersRef = collection(db, "members");
      const membersSnap = await getDocs(membersRef);

      const members = membersSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      }));

      return NextResponse.json(members);
    }
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
