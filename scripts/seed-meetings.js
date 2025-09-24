#!/usr/bin/env node

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
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

const generateFridayMeetings = (months = 12) => {
  const meetings = [];
  const now = new Date();

  // Generate meetings for the next 'months' months
  for (let monthOffset = 0; monthOffset < months; monthOffset++) {
    const targetDate = new Date(now);
    targetDate.setMonth(now.getMonth() + monthOffset);

    // Find all Fridays in this month
    const fridays = getFridaysInMonth(targetDate.getFullYear(), targetDate.getMonth());

    fridays.forEach((friday) => {
      // Skip if the Friday is in the past
      if (friday <= now) return;

      meetings.push({
        title: "اجتماع الجمعة الأسبوعي",
        description: "اجتماع أسبوعي للخدام والمخدومين",
        date: admin.firestore.Timestamp.fromDate(friday),
        startTime: admin.firestore.Timestamp.fromDate(new Date(friday.getTime() + 19 * 60 * 60 * 1000)), // 7:00 PM
        endTime: admin.firestore.Timestamp.fromDate(new Date(friday.getTime() + 21 * 60 * 60 * 1000)), // 9:00 PM
        location: "قاعة الاجتماعات الرئيسية",
        type: "regular",
        status: "scheduled",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }

  return meetings;
};

const getFridaysInMonth = (year, month) => {
  const fridays = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Find the first Friday of the month
  const firstFriday = new Date(firstDay);
  const daysUntilFriday = (5 - firstDay.getDay() + 7) % 7;
  firstFriday.setDate(firstDay.getDate() + daysUntilFriday);

  // Add all Fridays in the month
  let currentFriday = new Date(firstFriday);
  while (currentFriday <= lastDay) {
    fridays.push(new Date(currentFriday));
    currentFriday.setDate(currentFriday.getDate() + 7);
  }

  return fridays;
};

async function seedMeetings() {
  try {
    console.log("🚀 بدء إضافة اجتماعات الجمعة للـ 12 شهر القادمة...\n");

    const meetings = generateFridayMeetings(12);
    console.log(`📅 سيتم إضافة ${meetings.length} اجتماع\n`);

    const batch = db.batch();
    const meetingsRef = db.collection("meetings");

    meetings.forEach((meeting) => {
      const docRef = meetingsRef.doc();
      batch.set(docRef, meeting);
    });

    await batch.commit();

    console.log("✅ تم إضافة جميع الاجتماعات بنجاح!");
    console.log(`📊 إجمالي الاجتماعات المضافة: ${meetings.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ خطأ في إضافة الاجتماعات:", error.message);
    process.exit(1);
  }
}

seedMeetings();
