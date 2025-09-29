"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type {
  Notification,
  NotificationTemplate,
  NotificationSchedule,
  DailyQuote,
} from "@/lib/types";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "notifications"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          scheduledTime: doc.data().scheduledTime?.toDate(),
          sentTime: doc.data().sentTime?.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          expiresAt: doc.data().expiresAt?.toDate(),
        })) as Notification[];

        setNotifications(notificationsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setError("خطأ في تحميل الإشعارات");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { notifications, loading, error };
};

export const useNotificationTemplates = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "notificationTemplates"),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const templatesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as NotificationTemplate[];

        setTemplates(templatesData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching templates:", error);
        setError("خطأ في تحميل القوالب");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { templates, loading, error };
};

export const useNotificationSchedules = () => {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "notificationSchedules"),
        orderBy("scheduledTime", "asc")
      ),
      (snapshot) => {
        const schedulesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          scheduledTime: doc.data().scheduledTime?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastSent: doc.data().lastSent?.toDate(),
          nextSend: doc.data().nextSend?.toDate(),
        })) as NotificationSchedule[];

        setSchedules(schedulesData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching schedules:", error);
        setError("خطأ في تحميل الجدولة");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { schedules, loading, error };
};

export const useDailyQuotes = () => {
  const [quotes, setQuotes] = useState<DailyQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "dailyQuotes"),
      (snapshot) => {
        const quotesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as DailyQuote[];

        setQuotes(quotesData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching daily quotes:", error);
        setError("خطأ في تحميل الآيات اليومية");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { quotes, loading, error };
};

export const notificationHelpers = {
  // Create notification
  createNotification: async (
    notificationData: Omit<Notification, "id" | "createdAt">
  ) => {
    if (!auth.currentUser) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const data = {
      ...notificationData,
      createdBy: auth.currentUser.uid,
      createdAt: Timestamp.now(),
      scheduledTime: notificationData.scheduledTime
        ? Timestamp.fromDate(notificationData.scheduledTime)
        : null,
      sentTime: notificationData.sentTime
        ? Timestamp.fromDate(notificationData.sentTime)
        : null,
      expiresAt: notificationData.expiresAt
        ? Timestamp.fromDate(notificationData.expiresAt)
        : null,
    };

    const docRef = await addDoc(collection(db, "notifications"), data);

    // If no scheduled time, send immediately
    if (!notificationData.scheduledTime) {
      try {
        const response = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: notificationData.title,
            message: notificationData.message,
            targetAudience: notificationData.targetAudience,
            targetIds: notificationData.targetIds,
            imageUrl: notificationData.imageUrl,
            priority: notificationData.priority,
          }),
        });

        if (!response.ok) {
          console.error('Failed to send notification');
        } else {
          // Update the notification with sentTime
          await updateDoc(docRef, {
            sentTime: Timestamp.now(),
          });
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    return docRef;
  },

  // Update notification
  updateNotification: async (
    notificationId: string,
    updates: Partial<Notification>
  ) => {
    const notificationRef = doc(db, "notifications", notificationId);
    const updateData: any = { ...updates };

    if (updates.scheduledTime) {
      updateData.scheduledTime = Timestamp.fromDate(updates.scheduledTime);
    }
    if (updates.sentTime) {
      updateData.sentTime = Timestamp.fromDate(updates.sentTime);
    }
    if (updates.expiresAt) {
      updateData.expiresAt = Timestamp.fromDate(updates.expiresAt);
    }

    return await updateDoc(notificationRef, updateData);
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const notificationRef = doc(db, "notifications", notificationId);
    return await deleteDoc(notificationRef);
  },

  // Create template
  createTemplate: async (
    templateData: Omit<NotificationTemplate, "id" | "createdAt">
  ) => {
    if (!auth.currentUser) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const data = {
      ...templateData,
      createdBy: auth.currentUser.uid,
      createdAt: Timestamp.now(),
    };

    return await addDoc(collection(db, "notificationTemplates"), data);
  },

  // Update template
  updateTemplate: async (
    templateId: string,
    updates: Partial<NotificationTemplate>
  ) => {
    const templateRef = doc(db, "notificationTemplates", templateId);
    return await updateDoc(templateRef, updates);
  },

  // Delete template
  deleteTemplate: async (templateId: string) => {
    const templateRef = doc(db, "notificationTemplates", templateId);
    return await deleteDoc(templateRef);
  },

  // Create schedule
  createSchedule: async (
    scheduleData: Omit<NotificationSchedule, "id" | "createdAt">
  ) => {
    if (!auth.currentUser) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    const data = {
      ...scheduleData,
      createdBy: auth.currentUser.uid,
      createdAt: Timestamp.now(),
      scheduledTime: Timestamp.fromDate(scheduleData.scheduledTime),
      nextSend: scheduleData.nextSend
        ? Timestamp.fromDate(scheduleData.nextSend)
        : Timestamp.fromDate(scheduleData.scheduledTime),
      lastSent: scheduleData.lastSent
        ? Timestamp.fromDate(scheduleData.lastSent)
        : null,
    };

    return await addDoc(collection(db, "notificationSchedules"), data);
  },

  // Update schedule
  updateSchedule: async (
    scheduleId: string,
    updates: Partial<NotificationSchedule>
  ) => {
    const scheduleRef = doc(db, "notificationSchedules", scheduleId);
    const updateData: any = { ...updates };

    if (updates.scheduledTime) {
      updateData.scheduledTime = Timestamp.fromDate(updates.scheduledTime);
    }
    if (updates.nextSend) {
      updateData.nextSend = Timestamp.fromDate(updates.nextSend);
    }
    if (updates.lastSent) {
      updateData.lastSent = Timestamp.fromDate(updates.lastSent);
    }

    return await updateDoc(scheduleRef, updateData);
  },

  // Delete schedule
  deleteSchedule: async (scheduleId: string) => {
    const scheduleRef = doc(db, "notificationSchedules", scheduleId);
    return await deleteDoc(scheduleRef);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string, userId: string) => {
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationSnap = await getDoc(notificationRef);

    if (notificationSnap.exists()) {
      const notification = notificationSnap.data();
      const readBy = notification.readBy || [];

      if (!readBy.includes(userId)) {
        await updateDoc(notificationRef, {
          readBy: [...readBy, userId],
        });
      }
    }
  },
};

export const useNotificationHelpers = () => notificationHelpers;
