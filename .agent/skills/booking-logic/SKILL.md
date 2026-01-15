---
name: booking-logic
description: Slotify-specific booking and availability logic. Use this skill when implementing booking flows, availability calculations, or handling scheduling conflicts. Covers the core business rules for the booking platform.
---

# Booking Logic Skill

This skill defines the core booking business logic for Slotify.

## Core Concepts

### Booking States

```
pending → confirmed → completed
    ↓         ↓
cancelled  cancelled
```

| Status | Description |
|--------|-------------|
| `pending` | Awaiting provider confirmation |
| `confirmed` | Booking is active |
| `completed` | Service was delivered |
| `cancelled` | Booking was cancelled by either party |
| `no_show` | Client didn't show up |

### Time Slot Model

- All slots are **15-minute increments**
- Times stored in **UTC** in database
- Displayed in **provider's timezone**
- Service duration determines slot consumption

## Availability Calculation

### Algorithm Overview

```
1. Get provider's weekly schedule (availability_rules)
2. Generate all possible 15-min slots for the day
3. Filter out slots outside business hours
4. Remove slots blocked by existing bookings
5. Remove slots blocked by busy_blocks
6. Apply minimum_notice_hours filter
7. Apply buffer_time between appointments
8. Return available slots
```

### Implementation Reference

```typescript
// lib/availability.ts

export function calculateAvailableSlots(
  date: Date,
  provider: Provider,
  existingBookings: Booking[],
  busyBlocks: BusyBlock[],
  serviceDuration: number
): TimeSlot[] {
  const dayOfWeek = date.getDay(); // 0 = Sunday
  const dayRule = provider.availability_rules.find(r => r.day === dayOfWeek);
  
  if (!dayRule?.is_available) return [];
  
  // Generate base slots
  let slots = generateSlots(dayRule.start_time, dayRule.end_time);
  
  // Filter by minimum notice
  const minNotice = addHours(new Date(), provider.minimum_notice_hours);
  slots = slots.filter(slot => slot.time >= minNotice);
  
  // Remove conflicting slots
  slots = removeConflicts(slots, existingBookings, serviceDuration);
  slots = removeConflicts(slots, busyBlocks, 0);
  
  // Apply buffer times
  slots = applyBufferTimes(slots, existingBookings, provider.buffer_before, provider.buffer_after);
  
  return slots;
}
```

### Conflict Detection

A slot conflicts if:
```
new_booking.start < existing.end AND new_booking.end > existing.start
```

```typescript
function hasConflict(
  slotStart: Date,
  slotEnd: Date,
  existingStart: Date,
  existingEnd: Date
): boolean {
  return slotStart < existingEnd && slotEnd > existingStart;
}
```

## Preventing Double Booking

### Database-Level Lock

```sql
-- RPC function with row locking
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_provider_id UUID,
  p_service_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_client_name TEXT,
  p_client_email TEXT
) RETURNS bookings AS $$
DECLARE
  v_booking bookings;
  v_conflict_count INTEGER;
BEGIN
  -- Lock and check for conflicts
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE provider_id = p_provider_id
    AND status IN ('confirmed', 'pending')
    AND start_time < p_end_time
    AND end_time > p_start_time
  FOR UPDATE;
  
  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'Time slot is no longer available';
  END IF;
  
  -- Create booking
  INSERT INTO bookings (provider_id, service_id, start_time, end_time, client_name, client_email, status)
  VALUES (p_provider_id, p_service_id, p_start_time, p_end_time, p_client_name, p_client_email, 'confirmed')
  RETURNING * INTO v_booking;
  
  RETURN v_booking;
END;
$$ LANGUAGE plpgsql;
```

### Application-Level Check

```typescript
// Always double-check before insert
export async function createBooking(data: CreateBookingInput) {
  const supabase = await createClient();
  
  // Check availability one more time
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('provider_id', data.provider_id)
    .in('status', ['confirmed', 'pending'])
    .lt('start_time', data.end_time)
    .gt('end_time', data.start_time);
    
  if (conflicts && conflicts.length > 0) {
    return { error: 'This time slot is no longer available' };
  }
  
  // Proceed with booking...
}
```

## Timezone Handling

### Storage Convention

- **Database**: Always UTC (`TIMESTAMPTZ`)
- **Display**: Convert to provider's timezone
- **Input**: Parse from provider's timezone, store as UTC

### Conversion Utilities

```typescript
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Display UTC time in provider's timezone
function formatForDisplay(utcDate: Date, timezone: string): string {
  return formatInTimeZone(utcDate, timezone, 'h:mm a');
}

// Convert provider's local time to UTC for storage
function toUTC(localDate: Date, timezone: string): Date {
  return zonedTimeToUtc(localDate, timezone);
}

// Convert UTC to provider's local time
function toLocal(utcDate: Date, timezone: string): Date {
  return utcToZonedTime(utcDate, timezone);
}
```

## Reschedule Flow

```
1. Provider initiates reschedule request
2. System creates reschedule_proposal with proposed times
3. System generates action_token for client
4. Email sent to client with reschedule link
5. Client clicks link, sees proposed times
6. Client selects preferred time
7. Original booking updated with new time
8. Confirmation emails sent to both parties
```

### Action Token Pattern

```typescript
// Generate secure token
function generateActionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validate and consume token
async function validateToken(token: string): Promise<ActionToken | null> {
  const { data } = await supabase
    .from('action_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();
    
  return data;
}
```

## Cancellation Rules

### Provider-Side

```typescript
const canProviderCancel = (booking: Booking): boolean => {
  return ['pending', 'confirmed'].includes(booking.status);
};
```

### Client-Side

```typescript
const canClientCancel = (booking: Booking, provider: Provider): boolean => {
  if (!['pending', 'confirmed'].includes(booking.status)) return false;
  
  const now = new Date();
  const hoursUntilBooking = differenceInHours(booking.start_time, now);
  
  return hoursUntilBooking >= provider.cancellation_policy_hours;
};
```

## Email Notifications

### Trigger Points

| Event | To Provider | To Client |
|-------|-------------|-----------|
| New booking | ✅ | ✅ |
| Booking confirmed | - | ✅ |
| Booking cancelled | ✅ | ✅ |
| Reschedule proposed | - | ✅ |
| Reschedule confirmed | ✅ | ✅ |
| Reminder (24h before) | - | ✅ |

## Business Rules Summary

1. **Minimum notice**: Clients can't book within X hours of appointment
2. **Buffer time**: Automatic gap before/after appointments
3. **Service duration**: Determines how many 15-min slots are consumed
4. **Cancellation policy**: X hours before appointment for client cancellation
5. **Working hours**: Defined per day of week
6. **Busy blocks**: Provider-defined unavailable periods
7. **Double-booking**: Strictly prevented at database level
