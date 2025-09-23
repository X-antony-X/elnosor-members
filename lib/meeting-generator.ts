import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface MeetingData {
  title: string;
  description: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  location: string;
  type: "regular" | "special" | "training";
  status: "scheduled" | "completed" | "cancelled";
}

export const generateFridayMeetings = async (months: number = 3) => {
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

export const addMeetingsToDatabase = async (meetings: MeetingData[]) => {
  const results = [];

  for (const meeting of meetings) {
    try {
      const docRef = await addDoc(collection(db, "meetings"), {
        title: meeting.title,
        description: meeting.description,
        date: Timestamp.fromDate(meeting.date),
        startTime: Timestamp.fromDate(meeting.startTime),
        endTime: Timestamp.fromDate(meeting.endTime),
        location: meeting.location,
        type: meeting.type,
        status: meeting.status,
        createdAt: Timestamp.now(),
      });

      results.push({
        id: docRef.id,
        ...meeting,
      });

      console.log(`Added meeting: ${meeting.title} on ${meeting.date.toLocaleDateString('ar-EG')}`);
    } catch (error) {
      console.error("Error adding meeting:", error);
      throw error;
    }
  }

  return results;
};

export const createSampleMeetings = async (months: number = 3) => {
  try {
    console.log(`Generating ${months} months of Friday meetings...`);
    const meetings = await generateFridayMeetings(months);
    console.log(`Generated ${meetings.length} meetings`);

    const results = await addMeetingsToDatabase(meetings);
    console.log(`Successfully added ${results.length} meetings to database`);

    return results;
  } catch (error) {
    console.error("Error creating sample meetings:", error);
    throw error;
  }
};
