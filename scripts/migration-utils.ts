import { adminDb } from "@/lib/firebase-admin";

export async function migrateMemberToAdmin(uid: string) {
  const batch = adminDb.batch();
  try {
    const memberDoc = await adminDb.collection("members").doc(uid).get();

    if (memberDoc.exists) {
      const memberData = memberDoc.data();

      const adminRef = adminDb.collection("admins").doc(uid);
      const memberRef = adminDb.collection("members").doc(uid);

      batch.set(adminRef, {
        ...memberData,
        migratedFromMemberId: uid,
        role: "admin",
        updatedAt: new Date(),
      });
      batch.delete(memberRef);

      await batch.commit();

      console.log(
        `Successfully migrated user ${uid} from members to admins collection`
      );
      return true;
    } else {
      console.warn(`Member document for uid ${uid} does not exist`);
      return false;
    }
  } catch (error) {
    console.error("Error migrating member to admin:", error);
    // Rollback: attempt to delete any partial admin doc created
    try {
      await adminDb.collection("admins").doc(uid).delete();
    } catch (rollbackError) {
      console.error("Rollback failed for migrateMemberToAdmin:", rollbackError);
    }
    throw error;
  }
}

export async function migrateAdminToMember(uid: string) {
  const batch = adminDb.batch();
  try {
    const adminDoc = await adminDb.collection("admins").doc(uid).get();

    if (adminDoc.exists) {
      const adminData = adminDoc.data();

      const memberRef = adminDb.collection("members").doc(uid);
      const adminRef = adminDb.collection("admins").doc(uid);

      batch.set(memberRef, {
        ...adminData,
        migratedFromAdminId: uid,
        role: "member",
        updatedAt: new Date(),
      });
      batch.delete(adminRef);

      await batch.commit();

      console.log(
        `Successfully migrated user ${uid} from admins to members collection`
      );
      return true;
    } else {
      console.warn(`Admin document for uid ${uid} does not exist`);
      return false;
    }
  } catch (error) {
    console.error("Error migrating admin to member:", error);
    // Rollback: attempt to delete any partial member doc created
    try {
      await adminDb.collection("members").doc(uid).delete();
    } catch (rollbackError) {
      console.error("Rollback failed for migrateAdminToMember:", rollbackError);
    }
    throw error;
  }
}
