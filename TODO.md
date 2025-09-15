# TODO: Fix Google Sign-In Redirect Issue

## Completed Steps
- [x] Analyze the issue: Google sign-in auto-signs in without prompting, and redirect to profile/complete fails due to timing.
- [x] Update lib/auth.ts to force account selection with prompt: 'select_account'.
- [x] Modify app/auth/page.tsx to prevent premature redirects during sign-in by adding isSigningIn state.

## Pending Steps
- [ ] Test the changes to ensure account selection is prompted and redirect works.
- [ ] If issues persist, add logging to debug redirect failures.
