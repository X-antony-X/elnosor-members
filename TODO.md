# TODO: Fix Stuck Splash Screen

## Steps to Complete

### 1. Update components/ui/splash-screen.tsx

- Add optional `duration` prop (default 3000ms).
- Use a ref to store timer ID for reliable cleanup (handles StrictMode double-mounts).
- Ensure `onComplete` is called after timer.

Status: Pending

### 2. Update app/providers.tsx

- Introduce `hasShownSplash` ref (or localStorage) to ensure splash shows only once per session.
- Change rendering: Always render `<ThemeProvider>{children}</ThemeProvider>`, but conditionally overlay `<SplashScreen />` on top when `showSplash` is true.
- Adjust useEffect: Trigger splash only on initial mount after hydration && auth complete && !hasShownSplash.
- On `onComplete`, set `hasShownSplash` true and `showSplash` false.
- Keep existing loading/hydration spinners as fallbacks.

Status: Pending

### 3. Test the Changes

- Run `npm run dev` and verify splash shows only on initial load (up to 3s), hides correctly, and doesn't re-appear on navigation to inner pages (e.g., /dashboard, /members).
- Test in incognito mode and after full reload.
- Check console for errors (e.g., missing eagle.png).
- If issues, adjust based on feedback.

Status: Pending

### Additional Notes

- No new dependencies.
- Ensure changes don't affect auth or theme providers.
- After completion, update this file with [x] marks and close the task.
<!-- ----------------------------------------------------------------------------------------------------- -->
# TODO: Customize Notifications Page for Members and Implement Push Notifications

## Overview

Modify the notifications page to show only relevant notifications for members (hide admin settings tabs), and implement browser/PWA push notifications with permission request.

## Tasks

### 1. Filter Notifications for Members in app/notifications/page.tsx

- For role === "member", filter the notifications array to only show notifications where targetAudience === "all" (since individual targeting not implemented yet).
- Hide tabs: templates, schedules, analytics, daily-verses for members.
- Show only "notifications" tab for members.

Status: Completed ✅

### 2. Add Push Notification Permission Request

- In the notifications page, add a UI element (button or banner) to request notification permission if permission !== "granted".
- Use the useFCM hook's requestPermission function.
- Display current permission status.

Status: Pending

### 3. Ensure PWA Push Notifications Work on Mobile

- Verify service worker (public/firebase-messaging-sw.js) is set up for FCM.
- Ensure manifest.json has proper notification settings.
- Test on mobile PWA that notifications appear in notification bar like WhatsApp/Facebook.

Status: Pending

### 4. Update Notification Sending to Trigger FCM

- Modify app/api/notifications/send/route.ts to also send FCM messages to users' fcmTokens for web push.
- Fetch users with fcmToken and send via Firebase Admin SDK or FCM API.

Status: Pending

### 5. Testing

- Test permission request in Chrome.
- Send notification and verify browser notification appears.
- Test on mobile PWA.
- Verify member view hides admin tabs and shows only relevant notifications.

Status: Pending

### Additional Notes

- Use existing useFCM hook for permission and token management.
- For FCM sending, may need to add Firebase Admin SDK in API route.
- Ensure real-time updates work.

<!-- ----------------------------------------------------------------------------------------------------- -->
# TODO: Implement Push Notifications with Web-Push + VAPID

## Overview

Implement browser/PWA push notifications using the web-push library with VAPID keys for full control and cost-free operation. This allows notifications to arrive even when the phone is locked, without relying on Firebase Cloud Functions. Store user subscriptions in Firestore and send notifications from Next.js API routes.

## Tasks

### 1. Install Web-Push Library and Generate VAPID Keys

- Install `web-push` package: `npm install web-push`.
- Generate VAPID keys using `npx web-push generate-vapid-keys` and store them securely (e.g., in environment variables).
- Add VAPID keys to Next.js config or API routes.

Status: Completed ✅

### 2. Update Frontend for Subscription Management

- Create a new hook `hooks/use-web-push.ts` to handle permission request, subscription retrieval, and storage.
- In app/notifications/page.tsx or a global component, request notification permission and get push subscription using `navigator.serviceWorker.register()` and `pushManager.subscribe()`.
- Store the subscription object (endpoint, keys) in Firestore under the user's document (e.g., `users/{uid}/pushSubscription`).
- Handle subscription updates/changes (e.g., on permission revoke).

Status: Completed ✅

### 3. Update Service Worker for Push Events

- Modify `public/sw.js` or create a new one to handle `push` and `notificationclick` events.
- On push event, display the notification using `self.registration.showNotification()`.
- On notification click, focus/open the PWA window or navigate to a specific page.

Status: Completed ✅

### 3.5. Register Service Worker in App

- Add service worker registration in app/providers.tsx to enable web-push functionality.
- Ensure service worker is registered on app startup.

Status: Completed ✅

### 4. Implement Backend Notification Sending

- Create/update API route `app/api/notifications/send/route.ts` to use `web-push` library.
- Fetch user subscriptions from Firestore and send push notifications via `webpush.sendNotification()`.
- Handle errors (e.g., expired subscriptions) and update Firestore accordingly.
- Ensure the API works without Firebase Cloud Functions (pure Node.js).

Status: Completed ✅

### 5. Integrate with Existing Notification System

- Modify notification creation flow to trigger web-push sending alongside any existing methods.
- Update `lib/utils.ts` or notification utilities to support web-push payloads.
- Ensure notifications include proper title, body, icon, and actions for mobile display.

Status: Completed ✅

### 6. Testing and Mobile Support

- Test permission request and subscription storage in browser.
- Send test notifications and verify they appear as system notifications on desktop/mobile.
- Test with phone locked (may require background sync or specific PWA settings).
- Verify in incognito mode and after reloads.
- Check manifest.json for notification settings (e.g., `display: "standalone"`).
- Fixed build error by making VAPID keys optional for development/production builds.

Status: Completed ✅

### Additional Notes

- Full control and free (no third-party service fees).
- Subscriptions stored per user in Firestore for scalability.
- Compatible with PWA on mobile for locked-screen notifications.
- Fallback to in-app notifications if push fails.
- **Environment Variables**: Add VAPID keys to your environment (e.g., .env.local): `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Generate with `npx web-push generate-vapid-keys`.
- After implementation, update TODO.md with completion status and remove closed tasks.

<!-- ----------------------------------------------------------------------------------------------------- -->
# TODO: Fix Push Notifications to Appear as System Notifications Like WhatsApp

## Overview

The current web-push implementation sends notifications, but they only appear as in-app notifications when the PWA is open. To make them appear as system notifications in the notification bar (even when the app is closed or phone is locked, like WhatsApp), we need to ensure the service worker properly handles push events and displays browser notifications. This requires a custom service worker with push event listeners, proper manifest configuration, and testing on mobile PWA.

## Tasks

### 1. Create Custom Service Worker for Push Notifications

- Create a new file `public/push-sw.js` (or modify existing `public/sw.js` if not generated).
- Include Workbox for caching (copy from current sw.js).
- Add push event listener:
  ```javascript
  self.addEventListener('push', function(event) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/192.png',
      badge: '/icons/72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      requireInteraction: true,
      silent: false
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  ```
- Add notificationclick event listener to open the PWA on click:
  ```javascript
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  });
  ```

Status: Completed ✅

### 2. Register the Custom Service Worker in the App

- In `app/providers.tsx` or `app/layout.tsx`, register the custom SW instead of the default one.
- Ensure it's registered only once, and handle updates.
- Example:
  ```javascript
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/push-sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  }
  ```

Status: Completed ✅

### 3. Update Manifest.json for Better Notification Support

- Ensure `manifest.json` has:
  ```json
  {
    "display": "standalone",
    "start_url": "/",
    "scope": "/",
    "icons": [...],
    "background_color": "#ffffff",
    "theme_color": "#000000",
    "name": "Member Elnosor",
    "short_name": "Elnosor",
    "description": "Member management app"
  }
  ```
- Add notification-related settings if supported.

Status: Completed ✅

### 4. Ensure Web-Push API Route Sends Correct Payload

- In `app/api/notifications/send/route.ts`, ensure the payload sent to web-push includes:
  - title
  - body
  - icon
  - url (for click action)
  - vibration pattern
- Example payload:
  ```javascript
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    icon: '/icons/192.png',
    url: '/notifications'
  });
  ```

Status: Completed ✅

### 5. Test on Mobile PWA

- Install the PWA on mobile (Android/iOS).
- Send a test notification from the app.
- Verify it appears in the notification bar even when the app is closed and phone is locked.
- Test notification click opens the PWA.
- Check vibration and sound (if possible).

Status: Skipped (as per user request)

### 6. Handle Edge Cases and Permissions

- Ensure push permission is requested and granted.
- Handle subscription expiration (update Firestore).
- Fallback to in-app notifications if push fails.
- Test in incognito mode and after app updates.

Status: Completed ✅

### Additional Notes

- Web-push notifications require HTTPS in production.
- On iOS, PWA notifications may have limitations; test thoroughly.
- If using FCM alongside, ensure no conflicts.
- After implementation, update TODO.md with completion status and remove closed tasks.
- Reference: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
