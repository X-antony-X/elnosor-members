#!/usr/bin/env node

const admin = require("firebase-admin")
const path = require("path")

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
}

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error("Missing Firebase service account environment variables:")
  console.error("- FIREBASE_PROJECT_ID")
  console.error("- FIREBASE_CLIENT_EMAIL")
  console.error("- FIREBASE_PRIVATE_KEY")
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.projectId,
})

// Get UID from command line arguments
const uid = process.argv[2]

if (!uid) {
  console.error("Usage: node set-admin.js <user-uid>")
  console.error("Example: node set-admin.js abc123def456")
  console.error("")
  console.error("To find a user's UID:")
  console.error("1. Go to Firebase Console → Authentication")
  console.error("2. Find the user in the list")
  console.error("3. Copy their UID")
  process.exit(1)
}

async function setAdminRole() {
  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role: "admin" })

    // Update user document
    await admin.firestore().collection("users").doc(uid).update({
      role: "admin",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`✅ Successfully set admin role for user: ${uid}`)
    console.log("The user will need to sign out and sign back in for changes to take effect.")
  } catch (error) {
    console.error("❌ Error setting admin role:", error.message)
    process.exit(1)
  }
}

setAdminRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error)
    process.exit(1)
  })
