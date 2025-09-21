import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing Firebase Admin connection...");

    // Test basic Firestore connection
    const testCollection = adminDb.collection("test");
    const testDoc = await testCollection.doc("test-doc").get();

    console.log("Firebase Admin test successful");

    return NextResponse.json({
      success: true,
      message: "Firebase Admin SDK is working",
      testDocExists: testDoc.exists,
      testDocData: testDoc.data(),
    });
  } catch (error) {
    console.error("Firebase Admin test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Firebase Admin SDK is not working",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
