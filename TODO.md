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
# TODO: Simplify Attendance System to Use Sequential 4-Digit Codes

## Overview

Update the attendance system to use simple 4-digit sequential codes (starting from 1000) instead of signed QR codes. This supports offline scenarios where members can show their QR (containing just the code) or verbally provide the code. Admins can manually enter codes or use a camera to detect 4-digit numbers directly.

## Tasks

### 1. Update Attendance Code Generation (lib/utils.ts)

- Modify `generateAttendanceCode()` to generate sequential 4-digit codes starting from 1000 (e.g., query Firestore for the highest existing code and increment by 1).
- Ensure uniqueness by checking the "members" collection.
- Update `generateUniqueAttendanceCode()` in app/profile/page.tsx to use this sequential logic.
- Remove any signature generation logic.

Status: Pending

### 2. Simplify QR Code Generation (lib/utils.ts and app/profile/page.tsx)

- Update `generateMemberQR(code)` to simply return the 4-digit code as a string (no signature or timestamp).
- In app/profile/page.tsx:
  - Update the QRCode component to use just `value={member.attendanceCode}`.
  - Display the code prominently as a large 4-digit number below/above the QR for easy reading.
  - Ensure the QR is scannable and contains only the numeric code.
- Test QR generation and display in the profile page.

Status: Pending

### 3. Update QR Validation and Scanning (lib/utils.ts and app/attendance/page.tsx)

- Remove `validateQRSignature()` entirely or simplify it to just extract/validate the 4-digit code (check if it's exactly 4 digits, 1000-9999 range).
- In app/attendance/page.tsx:
  - Update `handleQRScan()` to parse the scanned data as a 4-digit code and search members by `attendanceCode`.
  - For manual entry (`handleManualCodeSubmit()`), validate input as 4 digits and search directly.
  - Ensure offline support: Codes work without internet for local lookup if members are cached.

Status: Pending

### 4. Add Number Detection Camera for Admins (app/attendance/page.tsx and components/)

- Create a new component (e.g., components/number-scanner.tsx) similar to QRScanner but using a library like Tesseract.js or easyocr for OCR to detect 4-digit numbers in the camera feed.
- Add a new button for admins: "مسح رقم الكود" (Scan Number Code) that opens a dialog with the number scanner.
- On detection of a valid 4-digit code (1000-9999), automatically trigger attendance registration like QR scan.
- Fallback: If OCR fails, allow manual entry.
- Note: May require installing a lightweight OCR library (e.g., `npm install tesseract.js`).

Status: Completed ✅

### 5. Update Member Onboarding and Existing Members

- For new members: Auto-generate sequential code on registration/update in profile page.
- For existing members: Add a migration script (e.g., scripts/migrate-attendance-codes.ts) to assign sequential codes if `attendanceCode` is missing or invalid.
- Run the script once via `npx tsx scripts/migrate-attendance-codes.ts`.
- Update any database rules or indexes for `attendanceCode` queries.

Status: Pending

### 6. Testing and Offline Support

- Test full flow: Generate code → Display in profile → Scan QR/Manual entry → Number detection.
- Offline testing: Ensure local storage caches members with codes; attendance logs sync when online.
- Edge cases: Invalid codes (non-4 digits), duplicate scans, code range limits.
- UI/UX: Arabic labels for new buttons/dialogs (e.g., "اكتشاف كود رقمي").

Status: Pending

### Additional Notes

- Keep backward compatibility for existing signed QRs if needed, but prioritize migration to simple codes.
- No major dependencies unless OCR is added (prefer browser-native if possible).
- After implementation, update TODO.md with completion status and remove closed tasks.

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
