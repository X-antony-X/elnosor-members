#!/usr/bin/env tsx

// Simple meeting generator that doesn't require Firebase authentication
// This script generates meeting data that can be manually added to the database

interface MeetingData {
  title: string;
  description: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  type: "regular" | "special" | "training";
  status: "scheduled" | "completed" | "cancelled";
}

const generateFridayMeetings = (months: number = 3): MeetingData[] => {
  const meetings: MeetingData[] = [];
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
        date: friday,
        startTime: new Date(friday.getTime() + 19 * 60 * 60 * 1000), // 7:00 PM
        endTime: new Date(friday.getTime() + 21 * 60 * 60 * 1000), // 9:00 PM
        location: "قاعة الاجتماعات الرئيسية",
        type: "regular",
        status: "scheduled",
      });
    });
  }

  return meetings;
};

const getFridaysInMonth = (year: number, month: number): Date[] => {
  const fridays: Date[] = [];
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

const formatMeetingForDisplay = (meeting: MeetingData, index: number) => {
  return `${index + 1}. ${meeting.title}
   📍 ${meeting.location}
   🕐 ${meeting.date.toLocaleDateString('ar-EG')} - ${meeting.startTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
   📝 ${meeting.description}
   نوع: ${meeting.type}
   حالة: ${meeting.status}
`;
};

async function main() {
  try {
    console.log("🚀 بدء إنشاء اجتماعات الجمعة للأشهر الثلاثة القادمة...\n");

    const meetings = generateFridayMeetings(3);

    console.log("✅ تم إنشاء الاجتماعات بنجاح:");
    console.log(`📅 إجمالي الاجتماعات المُنشأة: ${meetings.length}\n`);

    meetings.forEach((meeting, index) => {
      console.log(formatMeetingForDisplay(meeting, index));
      console.log("---");
    });

    console.log("\n🎉 تم إنشاء جميع الاجتماعات بنجاح!");
    console.log("💡 لإضافة هذه الاجتماعات إلى قاعدة البيانات:");
    console.log("   1. اذهب إلى صفحة 'مولد الاجتماعات' في لوحة الإدارة");
    console.log("   2. أو استخدم Firebase Console لإضافة الاجتماعات يدوياً");
    console.log("   3. أو قم بإعداد متغيرات البيئة الصحيحة لـ Firebase");

    // Generate JSON output for easy copying
    console.log("\n📋 JSON للنسخ واللصق في Firebase:");
    console.log(JSON.stringify(meetings.map(m => ({
      title: m.title,
      description: m.description,
      date: m.date.toISOString(),
      startTime: m.startTime.toISOString(),
      endTime: m.endTime.toISOString(),
      location: m.location,
      type: m.type,
      status: m.status,
      createdAt: new Date().toISOString()
    })), null, 2));

    process.exit(0);
  } catch (error) {
    console.error("❌ خطأ في إنشاء الاجتماعات:", error);
    process.exit(1);
  }
}

main();
