#!/usr/bin/env tsx

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        process.env[key.trim()] = value.slice(1, -1);
      } else {
        process.env[key.trim()] = value;
      }
    }
  });
}

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
};

if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  console.error("Missing Firebase service account environment variables:");
  console.error("- FIREBASE_PROJECT_ID");
  console.error("- FIREBASE_CLIENT_EMAIL");
  console.error("- FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.projectId,
});

const db = admin.firestore();

async function migrateAdmins() {
  try {
    console.log("🔍 Finding users with role: 'admin' in 'users' collection...");

    // Query users with role: admin
    const usersQuery = db.collection("users").where("role", "==", "admin");
    const usersSnapshot = await usersQuery.get();

    if (usersSnapshot.empty) {
      console.log("✅ No users with role 'admin' found in 'users' collection.");
      return;
    }

    console.log(`📋 Found ${usersSnapshot.size} admin user(s) to migrate.`);

    const batch = db.batch();
    let migratedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;

      console.log(
        `🚀 Migrating user: ${uid} (${userData.displayName || userData.email})`
      );

      // Get full profile from members collection
      const memberRef = db.collection("members").doc(uid);
      const memberSnap = await memberRef.get();

      let profileData = userData; // fallback to users data
      if (memberSnap.exists) {
        profileData = memberSnap.data()!;
        console.log(`   📄 Using profile data from 'members' collection`);
      } else {
        console.log(`   ⚠️  No profile data in 'members', using 'users' data`);
      }

      // Copy to admins collection
      const adminRef = db.collection("admins").doc(uid);
      batch.set(adminRef, {
        ...profileData,
        role: "admin", // ensure role is admin
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedFrom: memberSnap.exists ? "members" : "users",
      });

      // If data was from members, delete from members to avoid duplicates
      if (memberSnap.exists) {
        batch.delete(memberRef);
        console.log(`   🗑️  Deleted from 'members' collection`);
      }

      // Optionally, update users collection to mark as migrated
      const userRef = db.collection("users").doc(uid);
      batch.update(userRef, {
        migratedToAdmins: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      migratedCount++;
    }

    // Commit the batch
    await batch.commit();

    console.log(
      `✅ Successfully migrated ${migratedCount} admin user(s) to 'admins' collection.`
    );
    console.log(
      "🔄 Users will need to refresh their session for role changes to take effect."
    );
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
}

migrateAdmins()
  .then(() => {
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
