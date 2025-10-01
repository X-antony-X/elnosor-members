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

# TODO: Move Front-End Role Checks to Back-End

## Overview

Move all front-end role checks like `{role === "admin" && (` to back-end to prevent users from tampering via browser inspect or viewing code on GitHub. This ensures role-based logic is enforced server-side.

## Method

- Replace front-end role checks with API calls that perform role validation server-side.
- API endpoints will check user role from Firebase Auth custom claims or Firestore, and return appropriate data or permissions.
- Front-end will render UI based on API responses, not local role state.
- Use server-side rendering where possible for sensitive pages.

## Plan and Steps

1. **Identify All Role Checks**: Use grep search to find all `role === "admin"` instances (found 61 results across multiple files).

2. **Categorize by Feature**:

   - Navigation: Conditionally show admin/member menu items.
   - Dashboard: Show admin vs member stats and actions.
   - Posts: Edit/delete permissions.
   - Members: Admin management features.
   - Attendance: Admin controls.
   - Notifications: Admin scheduling features.
   - Profile: Edit permissions.

3. **Create API Endpoints**:

   - `/api/user/permissions`: Returns user permissions object based on role.
   - `/api/dashboard/data`: Returns dashboard data (stats, actions) based on role.
   - `/api/posts/permissions`: Returns edit/delete permissions for posts/comments.
   - `/api/navigation/items`: Returns navigation items based on role.
   - `/api/members/actions`: Returns available member management actions.
   - `/api/attendance/controls`: Returns attendance controls based on role.
   - `/api/notifications/features`: Returns notification features based on role.

4. **Update Front-End Components**:

   - Replace role checks with API calls in useEffect or hooks.
   - Store permissions in state and render conditionally.
   - Handle loading states while fetching permissions.

5. **Server-Side Role Checking**:

   - In API routes, verify user authentication and role from Firebase.
   - Return 403 Forbidden if insufficient permissions.
   - Log security attempts.

6. **Testing**:
   - Test that admin features are inaccessible to members.
   - Verify API responses match role.
   - Check that front-end can't be tampered with.

## Files to Edit

### Core Components

- `components/layout/navigation.tsx`: Navigation items based on role
- `components/layout/mobile-navigation.tsx`: Mobile nav items
- `components/auth/role-guard*.tsx`: Role checking logic

### Pages

- `app/dashboard/page.tsx`: Stats and actions
- `app/posts/page.tsx`: Edit/delete permissions
- `app/members/page.tsx`: Admin features
- `app/attendance/page.tsx`: Admin controls
- `app/notifications/page.tsx`: Admin features
- `app/profile/page.tsx`: Edit permissions
- `app/test-role/page.tsx`: Role display

### API Routes (Update existing)

- `app/api/members/route.ts`
- `app/api/admin/check-role*/route.ts`
- `app/api/members/[id]/*/route.ts`

### Lib Files

- `lib/auth.ts`: Role resolution
- `lib/auth-debug.ts`: Debug role checking

Status: Pending

## Additional Notes

- Ensure all API routes use proper authentication middleware.
- Implement rate limiting on permission checks.
- Add audit logging for role-based actions.
- Update after implementing to mark as completed.
