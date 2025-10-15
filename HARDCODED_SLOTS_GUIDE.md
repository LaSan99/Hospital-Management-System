# Hardcoded Time Slots - Quick Guide

## Overview
The BookAppointment page now has **hardcoded time slots** as a fallback when the backend API is unavailable or returns no slots.

## Location
**File:** `frontend/src/pages/BookAppointment.jsx`  
**Function:** `generateHardcodedSlots()` (lines 20-55)

## How It Works

```
1. User selects a date
2. Frontend tries to fetch slots from backend API
3. If API returns slots → Use API slots ✅
4. If API returns empty/fails → Use hardcoded slots 🔧
```

## Current Hardcoded Configuration

```javascript
Opening Time:    9:00 AM
Closing Time:    5:00 PM
Slot Duration:   30 minutes
Lunch Break:     1:00 PM - 2:00 PM
```

### Generated Slots:
```
09:00-09:30  09:30-10:00  10:00-10:30  10:30-11:00
11:00-11:30  11:30-12:00  12:00-12:30  12:30-13:00
[LUNCH BREAK 13:00-14:00]
14:00-14:30  14:30-15:00  15:00-15:30  15:30-16:00
16:00-16:30  16:30-17:00
```

## Customization Examples

### Example 1: Change to 8 AM - 6 PM
```javascript
const startHour = 8          // 8 AM
const endHour = 18           // 6 PM
```

### Example 2: 1-hour appointments
```javascript
const slotDuration = 60      // 60 minutes per slot
```
**Result:** 09:00-10:00, 10:00-11:00, 11:00-12:00, etc.

### Example 3: No lunch break
```javascript
const lunchStart = 0         // Disable
const lunchEnd = 0           // Disable
```

### Example 4: Different lunch time (12-1 PM)
```javascript
const lunchStart = 12        // 12 PM
const lunchEnd = 13          // 1 PM
```

### Example 5: 15-minute slots
```javascript
const slotDuration = 15      // 15 minutes per slot
```
**Result:** 09:00-09:15, 09:15-09:30, 09:30-09:45, etc.

## Visual Indicators

When hardcoded slots are being used, users will see:
- ℹ️ Blue info banner: "Showing default time slots (9 AM - 5 PM, excluding 1-2 PM lunch break)"

## Testing

1. **With working backend:**
   - Slots come from API
   - No info banner shown
   - Booked slots are excluded

2. **Without backend / API error:**
   - Hardcoded slots are shown
   - Blue info banner appears
   - All slots appear available (no booking check)

## Important Notes

⚠️ **Limitations of Hardcoded Slots:**
- Does NOT check for existing bookings
- All slots appear as available
- Same slots for all doctors
- No weekend/holiday handling

✅ **Recommended:**
- Keep backend API as primary source
- Use hardcoded slots only as fallback
- For production, ensure backend is always available

## Code Location Reference

```javascript
// Line 27-55 in BookAppointment.jsx
const generateHardcodedSlots = () => {
  const slots = []
  const startHour = 9          // ← CHANGE THIS
  const endHour = 17           // ← CHANGE THIS
  const slotDuration = 30      // ← CHANGE THIS
  const lunchStart = 13        // ← CHANGE THIS
  const lunchEnd = 14          // ← CHANGE THIS
  
  // ... slot generation logic
}
```

## Quick Customization Steps

1. Open `frontend/src/pages/BookAppointment.jsx`
2. Find the `generateHardcodedSlots()` function (around line 27)
3. Modify the configuration variables:
   - `startHour`
   - `endHour`
   - `slotDuration`
   - `lunchStart` / `lunchEnd`
4. Save the file
5. Frontend will auto-reload (if dev server is running)
6. Test by selecting a date in the booking page

## Comparison: Backend vs Frontend Slots

| Feature | Backend Slots | Hardcoded Slots |
|---------|--------------|-----------------|
| Checks bookings | ✅ Yes | ❌ No |
| Per-doctor schedule | ✅ Possible | ❌ Same for all |
| Weekend handling | ✅ Possible | ❌ No |
| Real-time updates | ✅ Yes | ❌ Static |
| Works offline | ❌ No | ✅ Yes |
| Easy to customize | ⚠️ Requires restart | ✅ Hot reload |

## When to Use Each

**Use Backend Slots (Recommended):**
- Production environment
- Need booking validation
- Different schedules per doctor
- Real-time availability

**Use Hardcoded Slots:**
- Development/testing
- Backend temporarily down
- Demo purposes
- Quick prototyping

## Troubleshooting

**Hardcoded slots not showing?**
- Check if API is returning slots (check Network tab)
- Verify the `generateHardcodedSlots()` function is being called
- Check browser console for errors

**All slots showing as available?**
- This is expected with hardcoded slots
- They don't check for existing bookings
- Use backend API for booking validation

**Want to force hardcoded slots?**
```javascript
// Line 109 - Change this:
const slots = apiSlots.length > 0 ? apiSlots : hardcodedSlots

// To this (always use hardcoded):
const slots = hardcodedSlots
```
