# TODO: Fix Push Notifications and QR Scanner Issues

## Overview

Fix two main issues: 1) Push notifications not appearing as system notifications like WhatsApp (only in-app), and 2) QR scanner camera not opening on phone/laptop despite permission checks.

## Tasks

### 1. Fix Push Notifications to Appear as System Notifications

- **Problem**: Notifications only appear when PWA is open, not as system notifications in notification bar when app is closed/locked.
- **Root Cause**: Service worker push event handling may not be working properly, or notifications are being shown as in-app instead of system notifications.
- **Solution**:
  - Ensure service worker is properly registered and handles push events.
  - Check that notifications are created with `self.registration.showNotification()` in push event.
  - Verify manifest.json has proper PWA settings for notifications.
  - Test that notifications appear even when app is closed.
  - Add notification badge count to app icon.

Status: Pending

### 2. Add Notification Badge with Count

- **Problem**: No badge showing notification count on app icon.
- **Solution**:
  - Use `navigator.setAppBadge()` API for PWA badge.
  - Track unread notifications count in Firestore.
  - Update badge when notifications are read/unread.
  - Fallback for browsers that don't support badges.

Status: Pending

### 3. Add Scheduled Notifications Calendar View

- **Problem**: No page to view scheduled notifications during month/week like birthdays.
- **Solution**:
  - Create new page `app/notifications/scheduled/page.tsx` with calendar view.
  - Show upcoming scheduled notifications (birthdays, events, etc.).
  - Filter by month/week.
  - Allow viewing and managing scheduled notifications.

Status: Pending

### 4. Fix Permission Request Duplication

- **Problem**: Notification permission requested twice on PWA entry.
- **Root Cause**: Both FCM and web-push hooks may be requesting permission independently.
- **Solution**:
  - Consolidate permission requests in a single hook or component.
  - Check permission status before requesting.
  - Ensure only one request per session.

Status: Pending

### 5. Fix QR Scanner Camera Access

- **Problem**: Camera doesn't open on phone/laptop despite permission checks.
- **Root Cause**: Camera permission may be denied, or getUserMedia not working properly, or HTTPS requirement not met.
- **Solution**:
  - Ensure app runs over HTTPS (required for camera access).
  - Improve camera permission handling and error messages.
  - Add camera permission check before attempting to access camera.
  - Test camera access on different devices/browsers.
  - Ensure proper error handling for different camera access errors.

Status: Pending

### 6. Test and Validate Fixes

- Test push notifications on mobile PWA (appear when app closed/locked).
- Test notification badges on supported browsers.
- Test QR scanner camera access on phone and laptop.
- Test permission requests (only once).
- Test scheduled notifications calendar view.

Status: Pending

### Additional Notes

- Ensure all changes work on both desktop and mobile PWA.
- Test on different browsers (Chrome, Firefox, Safari).
- Handle edge cases like permission denied, camera not available, etc.
- Update TODO.md with completion status after implementing fixes.
