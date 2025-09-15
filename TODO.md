# TODO: Implement First-Time Login Profile Completion

## Overview

Implement a feature where new users (first-time login or first registration with email) are redirected to a profile completion page after login. The page includes fields for full name, phone numbers, address, birthdate (with age validation 18-28), university stage, and profile picture. After completion, redirect to dashboard. Update profile page to show real data and allow editing.

## Tasks

### 1. Create Profile Completion Page

- [x] Create `app/profile/complete/page.tsx` with form fields:
  - Full name (three parts: first, middle, last)
  - Primary phone number
  - Secondary phone number (optional)
  - Address (text field)
  - Birthdate (date picker with age validation 18-28)
  - University stage (dropdown: secondary, university, graduate)
  - University year (if university selected)
  - Profile picture (use Google photo or upload)
- [x] Add form validation and error handling
- [x] Implement age-based toast messages:
  - Age < 18: "attend your first basic meeting and when you enter university you'll find us waiting for you"
  - Age > 28: "you can attend the fortress meeting on Wednesday from 6 to 9"
- [x] Add save functionality to create/update member in Firestore
- [x] Redirect to dashboard after successful completion

### 2. Modify Login Flow

- [x] Update `app/auth/page.tsx` to check if user profile is complete after login
- [x] Add logic to detect first-time users (check if member exists in Firestore)
- [x] Redirect to `/profile/complete` if profile incomplete, else to `/dashboard`
- [x] Update auth provider or add hook to check profile completeness

### 3. Update Profile Page

- [ ] Modify `app/profile/page.tsx` to fetch real member data from Firestore instead of mock data
- [ ] Add edit functionality for profile fields
- [ ] Allow editing by both user (servant/served) and admin
- [ ] Remove all dummy/mock data
- [ ] Implement save changes functionality

### 4. Backend/API Updates

- [ ] Check existing API routes for member creation/update (`/api/members/`)
- [ ] Ensure API supports profile completion and updates
- [ ] Add validation for age and required fields in API

### 5. Testing and Validation

- [ ] Test full login flow for new users
- [ ] Test profile completion form validation
- [ ] Test age-based toast messages
- [ ] Test profile editing functionality
- [ ] Test profile picture upload and Google photo usage

### 6. UI/UX Improvements

- [ ] Ensure responsive design for profile completion form
- [ ] Add loading states and error handling
- [ ] Implement proper form feedback and validation messages
