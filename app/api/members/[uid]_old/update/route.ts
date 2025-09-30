import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebase-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if user is authorized to update
    if (decodedToken.uid !== uid && decodedToken.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Prepare update data
    const updateData: any = {
      fullName: body.fullName,
      phonePrimary: body.phonePrimary,
      phoneSecondary: body.phoneSecondary,
      address: body.address,
      confessorName: body.confessorName,
      classStage: body.classStage,
      universityYear: body.universityYear,
      notes: body.notes,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const memberRef = doc(db, "members", uid);
    await updateDoc(memberRef, updateData);

    return NextResponse.json({ message: "Member updated successfully" });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
