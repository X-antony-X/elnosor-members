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
