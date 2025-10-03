"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    OneSignalDeferred: Array<((OneSignalSDK: any) => void) | undefined> | undefined;
  }
}

interface OneSignalSDK {
  init: (config: {
    appId: string;
    safari_web_id?: string;
    notifyButton?: { enable: boolean };
    allowLocalhostAsSecureOrigin?: boolean;
    serviceWorkerPath?: string;
    serviceWorkerParam?: { scope: string };
  }) => Promise<void>;
  Notifications: {
    requestPermission: () => Promise<string>;
    addEventListener: (event: string, callback: (event: any) => void) => void;
  };
}

export function OneSignalProvider() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal: OneSignalSDK) {
        try {
          await OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
            safari_web_id: "web.onesignal.auto.2b3f64b2-7083-4ec5-9c09-3f8119751fed",
            notifyButton: {
              enable: false,
            },
            allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
            serviceWorkerPath: '/custom-sw.js', // Use our custom service worker
            serviceWorkerParam: { scope: '/' },
          });

          console.log('OneSignal initialized');

          // Request permission after initialization
          const permission = await OneSignal.Notifications.requestPermission();
          if (permission === 'granted') {
            console.log('OneSignal permission granted');
          } else {
            console.log('OneSignal permission denied');
          }

          // Handle notification received (foreground)
          OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
            console.log('OneSignal foreground notification:', event);
            // Allow default display
            event.preventDefault();
            event.notification.display();
          });

          // Handle notification clicked
          OneSignal.Notifications.addEventListener('click', (event) => {
            console.log('OneSignal notification clicked:', event);
            // Navigate to notification URL or home
            const url = event.notification.additionalData?.url || '/';
            window.location.href = url;
          });

        } catch (error) {
          console.error('OneSignal initialization error:', error);
        }
      });
    }
  }, []);

  return null;
}
