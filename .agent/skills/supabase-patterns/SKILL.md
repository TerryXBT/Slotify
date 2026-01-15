---
name: supabase-patterns
description: Supabase database patterns and best practices for Slotify. Use this skill when working with database operations, RLS policies, migrations, or authentication. Covers client setup, queries, and security.
---

# Supabase Patterns Skill

This skill defines Supabase usage patterns for the Slotify booking platform.

## Client Setup

### Server-Side Client (Preferred for data fetching)

```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Browser Client (For client components)

```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Admin Client (For service role operations)

```typescript
// utils/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only!
    { auth: { persistSession: false } }
  );
}
```

## Query Patterns

### Basic CRUD

```typescript
// Read
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'confirmed');

// Create
const { data, error } = await supabase
  .from('bookings')
  .insert({ client_name: 'John', service_id: '123' })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('bookings')
  .update({ status: 'cancelled' })
  .eq('id', bookingId);

// Delete
const { error } = await supabase
  .from('bookings')
  .delete()
  .eq('id', bookingId);
```

### Related Data (Joins)

```typescript
// Fetch booking with service and profile
const { data } = await supabase
  .from('bookings')
  .select(`
    *,
    service:services(*),
    profile:profiles(id, display_name, avatar_url)
  `)
  .eq('id', bookingId)
  .single();
```

### Filtering & Ordering

```typescript
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('provider_id', providerId)
  .gte('start_time', startDate)
  .lte('start_time', endDate)
  .in('status', ['confirmed', 'pending'])
  .order('start_time', { ascending: true })
  .limit(50);
```

## Row-Level Security (RLS)

### Enable RLS on All Tables

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

### Common RLS Patterns

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = provider_id);

-- Users can insert their own data
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Public read for specific conditions
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  USING (is_active = true);
```

## Migration Best Practices

### File Naming Convention

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_busy_blocks.sql
├── 003_add_reschedule_proposals.sql
└── 004_add_action_tokens.sql
```

### Migration Template

```sql
-- Migration: Add location to profiles
-- Description: Adds location and meeting_link fields for service locations

-- Add columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Add comments
COMMENT ON COLUMN profiles.location IS 'Physical address for in-person services';
COMMENT ON COLUMN profiles.meeting_link IS 'Video call link for online services';

-- No RLS changes needed (existing policies cover new columns)
```

## Authentication Patterns

### Get Current User

```typescript
// Server component
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  redirect('/login');
}
```

### Protected Server Actions

```typescript
'use server';

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized' };
  }
  
  // Safe to proceed with user.id
}
```

## Atomic Operations (Prevent Double-Booking)

```sql
-- Use FOR UPDATE to lock rows during check
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_provider_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE provider_id = p_provider_id
    AND status IN ('confirmed', 'pending')
    AND start_time < p_end_time
    AND end_time > p_start_time
  FOR UPDATE;  -- Lock these rows
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
```

## Type Safety

### Generate Types

```bash
npx supabase gen types typescript --project-id=YOUR_PROJECT_ID > src/types/supabase.ts
```

### Use Generated Types

```typescript
import { Database } from '@/types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'];
type NewBooking = Database['public']['Tables']['bookings']['Insert'];
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('bookings')
  .insert(booking)
  .select()
  .single();

if (error) {
  // Handle specific error codes
  if (error.code === '23505') {
    return { error: 'Booking already exists for this time' };
  }
  if (error.code === '23503') {
    return { error: 'Invalid service or provider' };
  }
  
  // Log unexpected errors
  console.error('Supabase error:', error);
  Sentry.captureException(error);
  
  return { error: 'Failed to create booking' };
}
```

## Performance Tips

1. **Select only needed columns**: `.select('id, name, status')`
2. **Use indexes**: Create indexes for frequently filtered columns
3. **Limit results**: Always use `.limit()` for list queries
4. **Use RPC for complex logic**: Move logic to database functions
5. **Batch operations**: Use `.insert([...items])` for bulk inserts
