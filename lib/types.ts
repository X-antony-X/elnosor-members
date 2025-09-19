export interface Member {
  id?: string;
  uid?: string;
  fullName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  address: {
    lat?: number;
    lng?: number;
    addressString: string;
    mapsUrl?: string;
  };
  classStage: "graduation" | "university";
  universityYear?: number;
  confessorName: string;
  photoUrl?: string;
  notes?: string;
  role?: "member" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceLog {
  id?: string;
  memberId: string;
  meetingId: string;
  checkInTimestamp: Date;
  checkOutTimestamp?: Date | null;
  checkInMethod: "manual" | "qr" | "scan";
  note?: string;
  lateness?: number; // in minutes
}

export interface Meeting {
  id?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string;
  photos?: string[];
  createdAt: Date;
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  imageUrl?: string;
  targetAudience: "all" | "group" | "individuals";
  targetIds?: string[];
  scheduledTime?: Date;
  sentTime?: Date;
  createdBy: string;
  createdAt: Date;
  readBy?: string[];
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  templateId?: string;
  priority?: "low" | "normal" | "high";
  expiresAt?: Date;
}

export interface RecurringPattern {
  type: "daily" | "weekly" | "monthly" | "yearly";
  interval: number; // Every X days/weeks/months/years
  daysOfWeek?: number[]; // For weekly: [0,1,2,3,4,5,6] (Sunday = 0)
  dayOfMonth?: number; // For monthly: 1-31
  endDate?: Date;
  maxOccurrences?: number;
}

export interface NotificationTemplate {
  id?: string;
  name: string;
  title: string;
  message: string;
  imageUrl?: string;
  targetAudience: "all" | "group" | "individuals";
  category: "meeting" | "announcement" | "reminder" | "verse" | "custom";
  variables?: string[]; // Placeholders like {memberName}, {date}, etc.
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface NotificationSchedule {
  id?: string;
  templateId: string;
  scheduledTime: Date;
  recurringPattern?: RecurringPattern;
  targetAudience: "all" | "group" | "individuals";
  targetIds?: string[];
  variables?: Record<string, string>;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastSent?: Date;
  nextSend?: Date;
}

export interface NotificationAnalytics {
  notificationId: string;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalClicked: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  sentAt: Date;
  deviceTypes: Record<string, number>;
  platforms: Record<string, number>;
}

export interface Post {
  id?: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  likes: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

export interface DailyQuote {
  id?: string;
  type: "youth" | "fathers";
  dayOfYear: number; // 1-365
  quote: string;
  author?: string;
  reference?: string;
  createdAt: Date;
}

export interface UserSettings {
  userId: string;
  theme: "light" | "dark" | "system";
  primaryColor: string;
  meetingSchedule: {
    dayOfWeek: number; // 0-6 (Sunday = 0)
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  };
  notifications: {
    push: boolean;
    email: boolean;
  };
  updatedAt: Date;
}
