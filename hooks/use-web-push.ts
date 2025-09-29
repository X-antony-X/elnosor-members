import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging is not supported");
      return;
    }

    if (permission === "granted") {
      subscribeUser();
    }
  }, [permission]);

  async function subscribeUser() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        await saveSubscription(existingSubscription);
        return;
      }
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY || ""),
      });
      setSubscription(newSubscription);
      await saveSubscription(newSubscription);
    } catch (error) {
      console.error("Failed to subscribe the user: ", error);
    }
  }

  async function saveSubscription(subscription: PushSubscription) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        console.warn("No authenticated user to save subscription for");
        return;
      }
      const db = getFirestore();
      const subDoc = doc(db, "users", user.uid, "pushSubscription", "subscription");
      await setDoc(subDoc, subscription.toJSON());
    } catch (error) {
      console.error("Failed to save subscription to Firestore: ", error);
    }
  }

  async function requestPermission() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await subscribeUser();
    }
  }

  return { permission, subscription, requestPermission };
}
