const admin = require("firebase-admin")
const serviceAccount = require("./serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

const youthQuotes = [
  {
    dayOfYear: 1,
    quote: "في البدء كان الكلمة، والكلمة كان عند الله، وكان الكلمة الله",
    author: "يوحنا الإنجيلي",
    reference: "يوحنا 1:1",
    type: "youth",
  },
  {
    dayOfYear: 2,
    quote: "أحبوا بعضكم بعضاً كما أحببتكم",
    author: "السيد المسيح",
    reference: "يوحنا 13:34",
    type: "youth",
  },
  // Add more quotes here... (363 more)
]

const fathersQuotes = [
  {
    dayOfYear: 1,
    quote: "الصلاة هي تنفس الروح",
    author: "القديس يوحنا ذهبي الفم",
    reference: "",
    type: "fathers",
  },
  {
    dayOfYear: 2,
    quote: "من يحب الله يحب أخاه أيضاً",
    author: "القديس أوغسطينوس",
    reference: "",
    type: "fathers",
  },
  // Add more quotes here... (363 more)
]

async function seedQuotes() {
  try {
    console.log("Starting to seed quotes...")

    const batch = db.batch()

    // Add youth quotes
    youthQuotes.forEach((quote, index) => {
      const docRef = db.collection("daily_quotes").doc()
      batch.set(docRef, {
        ...quote,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    // Add fathers quotes
    fathersQuotes.forEach((quote, index) => {
      const docRef = db.collection("daily_quotes").doc()
      batch.set(docRef, {
        ...quote,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()
    console.log("Successfully seeded quotes!")
  } catch (error) {
    console.error("Error seeding quotes:", error)
  } finally {
    process.exit(0)
  }
}

seedQuotes()
