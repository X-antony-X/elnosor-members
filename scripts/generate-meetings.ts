#!/usr/bin/env tsx

import { createSampleMeetings } from "../lib/meeting-generator";

async function main() {
  try {
    console.log("🚀 Starting to generate Friday meetings for the next 3 months...");

    const meetings = await createSampleMeetings(3);

    console.log("✅ Successfully generated meetings:");
    console.log(`📅 Total meetings created: ${meetings.length}`);

    meetings.forEach((meeting, index) => {
      console.log(`${index + 1}. ${meeting.title}`);
      console.log(`   📍 ${meeting.location}`);
      console.log(`   🕐 ${meeting.date.toLocaleDateString('ar-EG')} - ${meeting.startTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`);
      console.log(`   📝 ${meeting.description}`);
      console.log("");
    });

    console.log("🎉 All meetings have been added to the database successfully!");
    console.log("💡 You can now go to the attendance page to see and select from these meetings.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating meetings:", error);
    process.exit(1);
  }
}

main();
