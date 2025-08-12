export interface Member {
  id: string
  uid?: string
  fullName: string
  phonePrimary: string
  phoneSecondary?: string
  address: {
    lat?: number
    lng?: number
    addressString: string
    mapsUrl?: string
  }
  classStage: "secondary" | "university"
  universityYear?: number
  confessorName: string
  photoUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface AttendanceLog {
  id?: string
  memberId: string
  meetingId: string
  checkInTimestamp: Date
  checkOutTimestamp?: Date | null
  checkInMethod: "manual" | "qr" | "scan"
  note?: string
  lateness?: number // in minutes
}

export interface Meeting {
  id?: string
  date: Date
  startTime: Date
  endTime: Date
  title: string
  description?: string
  createdAt: Date
}

export interface Notification {
  id?: string
  title: string
  message: string
  imageUrl?: string
  targetAudience: "all" | "group" | "individuals"
  targetIds?: string[]
  scheduledTime?: Date
  sentTime?: Date
  createdBy: string
  createdAt: Date
  readBy?: string[]
}

export interface Post {
  id?: string
  content: string
  imageUrl?: string
  authorId: string
  authorName: string
  createdAt: Date
  likes: string[]
  comments: Comment[]
}

export interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: Date
}

export interface DailyQuote {
  id?: string
  type: "youth" | "fathers"
  dayOfYear: number // 1-365
  quote: string
  author?: string
  reference?: string
  createdAt: Date
}

export interface UserSettings {
  userId: string
  theme: "light" | "dark"
  primaryColor: string
  meetingSchedule: {
    dayOfWeek: number // 0-6 (Sunday = 0)
    startTime: string // HH:mm
    endTime: string // HH:mm
  }
  notifications: {
    push: boolean
    email: boolean
  }
  updatedAt: Date
}
