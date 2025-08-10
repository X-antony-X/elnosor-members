import type { FirebaseFirestore } from "firebase-admin/firestore"

export interface AttendanceRecord {
  memberId: string
  meetingId: string
  checkInTimestamp: FirebaseFirestore.Timestamp
  checkOutTimestamp?: FirebaseFirestore.Timestamp | null
  checkInMethod: "manual" | "qr" | "scan"
  note?: string
  recordedBy: string
  createdAt: FirebaseFirestore.Timestamp
}

export interface NotificationData {
  title: string
  message: string
  imageUrl?: string
  targetAudience: "all" | "group" | "individuals"
  targetIds?: string[]
  scheduledTime?: FirebaseFirestore.Timestamp
  sentTime?: FirebaseFirestore.Timestamp | null
  createdBy: string
  createdAt: FirebaseFirestore.Timestamp
}
