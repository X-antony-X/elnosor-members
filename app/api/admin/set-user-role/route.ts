import { type NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-middleware";

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const { user, error } = await requireAdmin(request);
    if (error || !user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { uid, role } = await request.json();

    // Validate input
    if (!uid || !role || !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid uid or role" },
        { status: 400 }
      );
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(uid, { role });

    if (role === "admin") {
      // Migrate data from members to admins collection
      try {
        const memberDoc = await adminDb.collection("members").doc(uid).get();

        if (memberDoc.exists) {
          const memberData = memberDoc.data();

          // Create admin document with member data
          await adminDb
            .collection("admins")
            .doc(uid)
            .set({
              ...memberData,
              migratedFromMemberId: uid,
              role: "admin",
              updatedAt: new Date(),
            });

          // Remove from members collection
          await adminDb.collection("members").doc(uid).delete();

          console.log(
            `Successfully migrated user ${uid} from members to admins collection`
          );
        } else {
          // Create basic admin document if no member data exists
          await adminDb.collection("admins").doc(uid).set({
            uid: uid,
            role: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (migrationError) {
        console.error("Error during data migration:", migrationError);
        // Continue with role change even if migration fails
      }
    } else if (role === "member") {
      // Migrate data from admins to members collection
      try {
        const adminDoc = await adminDb.collection("admins").doc(uid).get();

        if (adminDoc.exists) {
          const adminData = adminDoc.data();

          // Create member document with admin data
          await adminDb
            .collection("members")
            .doc(uid)
            .set({
              ...adminData,
              migratedFromAdminId: uid,
              role: "member",
              updatedAt: new Date(),
            });

          // Remove from admins collection
          await adminDb.collection("admins").doc(uid).delete();

          console.log(
            `Successfully migrated user ${uid} from admins to members collection`
          );
        }
      } catch (migrationError) {
        console.error("Error during data migration:", migrationError);
        // Continue with role change even if migration fails
      }
    }

    // Update users collection
    await adminDb.collection("users").doc(uid).update({
      role,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("Set user role error:", error);
    return NextResponse.json(
      { error: "Failed to set user role" },
      { status: 500 }
    );
  }
}
