# TODO: Fix Google Sign-In Redirect Issue

## Completed Steps
- [x] Analyze the issue: Google sign-in auto-signs in without prompting, and redirect to profile/complete fails due to timing.
- [x] Update lib/auth.ts to force account selection with prompt: 'select_account'.
- [x] Modify app/auth/page.tsx to prevent premature redirects during sign-in by adding isSigningIn state.

## Completed Steps
- [x] Add automatic cleanup of incomplete user profiles after 1 hour.

## Pending Steps
- [x] Add check for session response success before proceeding.
- [x] Change router.push to window.location.href for reliable navigation.
- [ ] Test the changes to ensure redirect works and cleanup functions.
