---
name: nextjs-conventions
description: Next.js 16 App Router conventions and patterns for Slotify. Use this skill when creating new pages, implementing server components, or working with the routing system. Covers file structure, data fetching, and caching.
---

# Next.js Conventions Skill

This skill defines the Next.js 16 App Router conventions for Slotify.

## App Router File Conventions

```
src/app/
├── layout.tsx          # Root layout (wraps all pages)
├── page.tsx            # Home page (/)
├── globals.css         # Global styles
├── login/
│   ├── page.tsx        # Login page (/login)
│   └── actions.ts      # Login server actions
├── app/                # Protected routes (/app/*)
│   ├── layout.tsx      # App layout with nav
│   ├── today/
│   │   └── page.tsx    # Dashboard (/app/today)
│   └── settings/
│       ├── page.tsx    # Settings page
│       └── actions.ts  # Settings server actions
├── [username]/         # Dynamic route (/[username])
│   └── page.tsx        # Public booking page
└── api/                # API routes
    └── webhooks/
        └── route.ts    # Webhook handler
```

## Server vs Client Components

### Default: Server Components

```typescript
// app/bookings/page.tsx - Server Component (default)
import { createClient } from '@/utils/supabase/server';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*');
    
  return <BookingList bookings={bookings} />;
}
```

### Client Components (When Needed)

Use `'use client'` only when you need:
- useState, useEffect, or other hooks
- Event handlers (onClick, onChange)
- Browser-only APIs
- Third-party client libraries

```typescript
'use client';

import { useState } from 'react';

export function BookingModal() {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
```

## Data Fetching Patterns

### Pattern 1: Server Component Data Fetching

```typescript
// Preferred for initial page load
async function getData() {
  const supabase = await createClient();
  return supabase.from('services').select('*');
}

export default async function Page() {
  const { data } = await getData();
  return <ServiceList services={data} />;
}
```

### Pattern 2: Server Actions for Mutations

```typescript
// app/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  
  await supabase
    .from('profiles')
    .update({ name: formData.get('name') })
    .eq('id', userId);
    
  revalidatePath('/app/settings');
}
```

### Pattern 3: Route Handlers for APIs

```typescript
// app/api/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  
  // ... fetch availability
  
  return NextResponse.json({ slots });
}
```

## Routing Conventions

### Dynamic Routes

```typescript
// app/[username]/page.tsx
export default async function UserBookingPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  // ...
}
```

### Route Groups

Use `(groupName)` for organizing without affecting URL:

```
app/
├── (auth)/           # Auth pages (no /auth prefix in URL)
│   ├── login/
│   └── signup/
└── (marketing)/      # Marketing pages
    ├── about/
    └── pricing/
```

### Parallel Routes

Use `@slotName` for parallel rendering:

```
app/
├── @sidebar/
│   └── page.tsx
├── @main/
│   └── page.tsx
└── layout.tsx        # Receives both as props
```

## Metadata & SEO

```typescript
// Static metadata
export const metadata = {
  title: 'Settings | Slotify',
  description: 'Manage your booking preferences',
};

// Dynamic metadata
export async function generateMetadata({ params }) {
  const { username } = await params;
  return {
    title: `Book with ${username} | Slotify`,
  };
}
```

## Loading & Error States

```typescript
// app/bookings/loading.tsx
export default function Loading() {
  return <BookingsSkeleton />;
}

// app/bookings/error.tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

## Middleware

```typescript
// middleware.ts (root level)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth check, redirects, etc.
}

export const config = {
  matcher: ['/app/:path*'],
};
```

## Caching & Revalidation

```typescript
// Force dynamic (no cache)
export const dynamic = 'force-dynamic';

// Revalidate every 60 seconds
export const revalidate = 60;

// On-demand revalidation
import { revalidatePath, revalidateTag } from 'next/cache';

revalidatePath('/app/bookings');
revalidateTag('bookings');
```

## Common Mistakes to Avoid

1. ❌ Using `'use client'` unnecessarily
2. ❌ Importing server-only code in client components
3. ❌ Not awaiting `params` in Next.js 16
4. ❌ Missing loading/error states
5. ❌ Not calling `revalidatePath` after mutations

## Migration Notes (Next.js 15 → 16)

- `params` is now async - must `await params`
- `searchParams` is now async - must `await searchParams`
- Update all dynamic route components accordingly
