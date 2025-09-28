import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function calculateLateness(checkIn: Date, meetingStart: Date): number {
  const diff = checkIn.getTime() - meetingStart.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60))); // in minutes
}

export function formatLateness(minutes: number): string {
  if (minutes === 0) return "في الوقت";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `متأخر ${hours} ساعة${
      remainingMinutes > 0 ? ` و ${remainingMinutes} دقيقة` : ""
    }`;
  }

  return `متأخر ${remainingMinutes} دقيقة`;
}

export async function generateAttendanceCode(): Promise<string> {
  // Generate sequential 4-digit codes starting from 1000
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, getDocs, query, orderBy, limit } = await import(
      "firebase/firestore"
    );

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

export function generateMemberQR(attendanceCode: string): string {
  // Simple QR with just the attendance code
  return attendanceCode;
}

export function validateQRSignature(qrData: string): {
  valid: boolean;
  attendanceCode?: string;
} {
  // For now, just check if it's a 4-digit number
  const codeRegex = /^\d{4}$/;
  if (codeRegex.test(qrData)) {
    return { valid: true, attendanceCode: qrData };
  }
  return { valid: false };
}
