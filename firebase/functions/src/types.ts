import type admin from "firebase-admin"

export interface AttendanceRecord {
  memberId: string
  meetingId: string
  checkInTimestamp: admin.firestore.Timestamp
  checkOutTimestamp?: admin.firestore.Timestamp | null
  checkInMethod: "manual" | "qr" | "scan"
  note?: string
  recordedBy: string
  createdAt: admin.firestore.Timestamp
}

export interface NotificationData {
  title: string
  message: string
  imageUrl?: string
  targetAudience: "all" | "group" | "individuals"
  targetIds?: string[]
  scheduledTime?: admin.firestore.Timestamp
  sentTime?: admin.firestore.Timestamp | null
  createdBy: string
  createdAt: admin.firestore.Timestamp
}
