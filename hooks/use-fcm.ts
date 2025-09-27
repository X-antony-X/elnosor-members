"use client";

import { useState, useEffect } from "react";
import {
  getMessaging,
  onMessage,
  getToken,
  isSupported,
} from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase";
import { useAuth } from "@/app/providers";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export const useFCM = () => {
  const [messaging, setMessaging] = useState<any>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const { user } = useAuth();

  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        const messagingInstance = await getMessagingInstance();
        if (messagingInstance) {
          setMessaging(messagingInstance);

          // Check permission status
          if ("Notification" in window) {
            setPermission(Notification.permission);
          }

          // Listen for messages when app is in foreground
          onMessage(messagingInstance, (payload) => {
            console.log("Message received:", payload);

            // Show browser notification
            if (Notification.permission === "granted") {
              const notification = new Notification(
                payload.notification?.title || "إشعار جديد",
                {
                  body: payload.notification?.body,
                  icon: "/icon-192x192.png",
                  badge: "/icon-192x192.png",
                  tag: payload.data?.notificationId || "notification",
                }
              );

              notification.onclick = () => {
                window.focus();
                notification.close();
              };

              // Auto-close after 5 seconds
              setTimeout(() => notification.close(), 5000);
            }

            // Show toast notification
            toast.success(
              `${payload.notification?.title || "إشعار جديد"}: ${
                payload.notification?.body
              }`,
              {
                duration: 5000,
              }
            );
          });
        }
      } catch (error) {
        console.error("Error initializing messaging:", error);
      }
    };

    initializeMessaging();
  }, []);

  const requestPermission = async () => {
    try {
      if (!("Notification" in window)) {
        toast.error("المتصفح لا يدعم الإشعارات");
        return false;
      }

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === "granted" && messaging && user) {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (token) {
          setFcmToken(token);

          // Save token to user's document
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            fcmToken: token,
            notificationsEnabled: true,
          });

          toast.success("تم تفعيل الإشعارات بنجاح");
          return true;
        }
      } else if (permissionResult === "denied") {
        toast.error("تم رفض إذن الإشعارات");
      }

      return false;
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast.error("حدث خطأ في طلب إذن الإشعارات");
      return false;
    }
  };

  const disableNotifications = async () => {
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          fcmToken: null,
          notificationsEnabled: false,
        });

        setFcmToken(null);
        toast.success("تم إلغاء تفعيل الإشعارات");
      }
    } catch (error) {
      console.error("Error disabling notifications:", error);
      toast.error("حدث خطأ في إلغاء تفعيل الإشعارات");
    }
  };

  return {
    messaging,
    fcmToken,
    permission,
    requestPermission,
    disableNotifications,
    isSupported: "Notification" in window && messaging !== null,
  };
};
