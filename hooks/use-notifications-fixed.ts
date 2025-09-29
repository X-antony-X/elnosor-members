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

        // Show all notifications including future scheduled ones for editing
        const filteredNotifications = notificationsData;

        setNotifications(filteredNotifications);
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

// ... rest of the file remains the same
