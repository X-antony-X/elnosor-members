const admin = require("firebase-admin")
const serviceAccount = require("./serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

const sampleMembers = [
  {
    fullName: "مينا جورج",
    phonePrimary: "01234567890",
    phoneSecondary: "01098765432",
    address: {
      addressString: "شارع الجمهورية، وسط البلد، القاهرة",
      lat: 30.0444,
      lng: 31.2357,
    },
    classStage: "university",
    universityYear: 2,
    confessorName: "أبونا يوسف",
    notes: "خادم نشط في الخدمة",
  },
  {
    fullName: "مريم سمير",
    phonePrimary: "01123456789",
    address: {
      addressString: "مدينة نصر، القاهرة",
    },
    classStage: "secondary",
    confessorName: "أبونا مرقس",
    notes: "",
  },
  {
    fullName: "كيرلس أشرف",
    phonePrimary: "01012345678",
    address: {
      addressString: "المعادي، القاهرة",
    },
    classStage: "university",
    universityYear: 1,
    confessorName: "أبونا يوسف",
    notes: "يساعد في تنظيم الأنشطة",
  },
  // Add more sample members...
]

async function seedMembers() {
  try {
    console.log("Starting to seed members...")

    const batch = db.batch()

    sampleMembers.forEach((member) => {
      const docRef = db.collection("members").doc()
      batch.set(docRef, {
        ...member,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()
    console.log("Successfully seeded members!")
  } catch (error) {
    console.error("Error seeding members:", error)
  } finally {
    process.exit(0)
  }
}

seedMembers()
