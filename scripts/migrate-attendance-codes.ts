import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { firebaseConfig } from "../lib/firebase";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateNextAttendanceCode(): Promise<string> {
  try {
    // Query for the highest existing attendance code
    const q = query(
      collection(db, "members"),
      orderBy("attendanceCode", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    let nextCode = 1000; // Start from 1000

    if (!querySnapshot.empty) {
      const highestCode = querySnapshot.docs[0].data().attendanceCode;
      if (
        highestCode &&
        typeof highestCode === "string" &&
        /^\d{4}$/.test(highestCode)
      ) {
        const numericCode = parseInt(highestCode, 10);
        nextCode = numericCode + 1;
      }
    }

    // Ensure we don't exceed 9999
    if (nextCode > 9999) {
      throw new Error("Maximum attendance codes reached");
    }

    return nextCode.toString().padStart(4, "0");
  } catch (error) {
    console.error("Error generating attendance code:", error);
    // Fallback to random generation if Firestore fails
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}

async function migrateAttendanceCodes() {
  console.log("Starting attendance code migration...");

  try {
    const membersRef = collection(db, "members");
    const membersSnapshot = await getDocs(membersRef);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const currentCode = memberData.attendanceCode;

      // Check if code is missing or invalid
      const needsUpdate =
        !currentCode ||
        typeof currentCode !== "string" ||
        !/^\d{4}$/.test(currentCode) ||
        parseInt(currentCode, 10) < 1000 ||
        parseInt(currentCode, 10) > 9999;

      if (needsUpdate) {
        const newCode = await generateNextAttendanceCode();
        await updateDoc(doc(db, "members", memberDoc.id), {
          attendanceCode: newCode,
          updatedAt: new Date(),
        });
        console.log(
          `Updated ${memberData.fullName}: ${
            currentCode || "none"
          } -> ${newCode}`
        );
        updatedCount++;
      } else {
        console.log(
          `Skipped ${memberData.fullName}: code ${currentCode} is valid`
        );
        skippedCount++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Updated: ${updatedCount} members`);
    console.log(`- Skipped: ${skippedCount} members`);
    console.log(`- Total processed: ${membersSnapshot.size} members`);
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

// Run the migration
migrateAttendanceCodes()
  .then(() => {
    console.log("Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
