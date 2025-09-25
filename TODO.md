# TODO: Enable QR Scanner and Ensure Exact Timing for Attendance

## Tasks

- [x] Remove disabled prop from QR scanner button in app/attendance/page.tsx
- [ ] Verify QR scanner requests permission and scans correctly
- [x] Confirm manual attendance uses exact timestamp (already implemented)

## Information Gathered

- QR scanner button is disabled only if cameraPermission === 'denied'
- QRScanner component handles permission requests internally
- Attendance recording uses new Date() for exact checkInTimestamp

## Plan

- Edit app/attendance/page.tsx to remove disabled={cameraPermission === 'denied'} from the QR scanner button
- This allows the button to be always clickable, letting the component handle permissions

## Followup Steps

- Test QR scanner functionality in browser
- Ensure attendance is recorded with exact timing for both QR and manual methods
