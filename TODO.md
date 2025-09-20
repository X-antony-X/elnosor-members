# Role Management System Migration

## Current Issue

- Users login with Google → saved in `users` collection with `role: "member"`
- Users complete profile → saved in `members` collection
- Admin promotion → role changes to `"admin"` in `users` collection, but data stays in `members` collection
- This creates conflicts in role-based access control

## Implementation Plan

### Phase 1: Database Structure Updates

- [x] Update `lib/types.ts` - Add Admin interface
- [x] Update `firestore.rules` - Add admins collection rules
- [ ] Create admin data structure

### Phase 2: Authentication System Updates

- [x] Update `lib/auth.ts` - Modify role checking logic to handle both collections
- [ ] Update `components/auth/role-guard.tsx` - Improve role handling
- [ ] Update authentication flow to check both collections based on role

### Phase 3: API Updates

- [x] Update `app/api/admin/set-user-role/route.ts` - Add data migration logic
- [ ] Create migration utilities for moving data from members to admins collection
- [ ] Add proper error handling and rollback mechanisms

### Phase 4: UI Updates

- [ ] Update `app/members/page.tsx` - Add admin management features
- [ ] Update `app/attendance/page.tsx` - Update role restrictions
- [ ] Add admin management interface

### Phase 5: Testing & Migration

- [ ] Test role transitions
- [ ] Verify data migration works correctly
- [ ] Test authentication flow for both roles
- [ ] Test UI components with new role system

## Current Progress

- [x] Analysis completed
- [x] Types updated
- [x] Firestore rules updated
- [x] Authentication system updated
- [x] API updates completed
- [ ] Implementation in progress
