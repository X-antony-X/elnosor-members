# Fix Next.js Build Error - Dynamic Route Conflict

## Issue

Build error: "You cannot use different slug names for the same dynamic path ('id' !== 'uid')."
Caused by conflicting dynamic routes in `app/api/members/` directory.

## Plan

- [x] Remove `app/api/members/[id]/` directory entirely
- [x] Rename `app/api/members/[uid]/` directory to `app/api/members/[id]/`
- [x] Update parameter references from `uid` to `id` in route files
- [ ] Test build to verify fix

## Progress

- [x] Analysis completed - identified conflict between [id] and [uid] routes
- [x] Remove [id] directory
- [x] Rename [uid] to [id]
- [x] Update parameter references - Files already updated to use 'id'
- [ ] Test build
