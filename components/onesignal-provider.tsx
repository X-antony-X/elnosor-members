"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    OneSignalDeferred: Array<((OneSignalSDK: any) => void) | undefined> | undefined;
  }
}

interface OneSignalSDK {
  init: (config: { appId: string; safari_web_id?: string }) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<string>;
    addEventListener: (event: string, callback: (event: any) => void) => void;
  };
}

export function OneSignalProvider() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal: OneSignalSDK) {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
          safari_web_id: "web.onesignal.auto.2b3f64b2-7083-4ec5-9c09-3f8119751fed",
        });

        // Request permission
        OneSignal.Notifications.requestPermission().then((permission: string) => {
          if (permission === 'granted') {
            console.log('OneSignal permission granted');
          }
        });

        // Handle notification received
        OneSignal.Notifications.addEventListener('click', (event: any) => {
          console.log('OneSignal notification clicked:', event);
          // Navigate to notification or home
          if (event.detail.url) {
            window.location.href = event.detail.url;
          }
        });
      });
    }
  }, []);

  return null;
}
