# React Performance Guidelines - Complete Reference

## 1. Eliminating Waterfalls (CRITICAL)

### 1.1 Defer Await Until Needed

❌ Bad: Sequential awaits block each other
```typescript
async function Page() {
  const user = await getUser();
  const posts = await getPosts(); // Waits for user to finish
  return <Feed user={user} posts={posts} />;
}
```

✅ Good: Start promises early, await late
```typescript
async function Page() {
  const userPromise = getUser();
  const postsPromise = getPosts();
  
  const [user, posts] = await Promise.all([userPromise, postsPromise]);
  return <Feed user={user} posts={posts} />;
}
```

### 1.2 Use Suspense for Streaming

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <main>
      <Header /> {/* Renders immediately */}
      <Suspense fallback={<BookingsSkeleton />}>
        <BookingsList /> {/* Streams when ready */}
      </Suspense>
    </main>
  );
}
```

### 1.3 Move Await Into Branches

❌ Bad: Always await even if not needed
```typescript
async function BookingCard({ bookingId }) {
  const details = await getBookingDetails(bookingId);
  const [expanded, setExpanded] = useState(false);
  
  return expanded ? <Details data={details} /> : <Summary />;
}
```

✅ Good: Defer await to where it's used
```typescript
function BookingCard({ bookingId }) {
  const [expanded, setExpanded] = useState(false);
  
  return expanded 
    ? <Suspense fallback={<Spinner />}>
        <BookingDetails bookingId={bookingId} />
      </Suspense>
    : <Summary />;
}

async function BookingDetails({ bookingId }) {
  const details = await getBookingDetails(bookingId);
  return <Details data={details} />;
}
```

## 2. Bundle Size Optimization (CRITICAL)

### 2.1 Avoid Barrel File Imports

❌ Bad: Imports entire library
```typescript
import { Calendar } from '@/components';
import { formatDate } from 'date-fns';
```

✅ Good: Import directly from source
```typescript
import { Calendar } from '@/components/Calendar';
import formatDate from 'date-fns/format';
```

### 2.2 Dynamic Import Heavy Components

```typescript
import dynamic from 'next/dynamic';

// Only load when needed
const ImageCropper = dynamic(() => import('@/components/ImageCropper'), {
  loading: () => <Spinner />,
  ssr: false, // Client-only component
});

// Preload on hover
const BookingModal = dynamic(() => import('@/components/BookingModal'));

function BookButton() {
  const handleMouseEnter = () => {
    // Start loading before click
    import('@/components/BookingModal');
  };
  
  return <button onMouseEnter={handleMouseEnter}>Book Now</button>;
}
```

### 2.3 Defer Non-Critical Libraries

```typescript
// Lazy load analytics
useEffect(() => {
  import('analytics').then(({ init }) => init());
}, []);

// Or use next/script
import Script from 'next/script';

<Script 
  src="https://analytics.example.com" 
  strategy="lazyOnload" 
/>
```

## 3. Server-Side Performance (HIGH)

### 3.1 Use React.cache() for Deduplication

```typescript
import { cache } from 'react';

// Deduplicated within same request
export const getUser = cache(async (userId: string) => {
  const supabase = await createClient();
  return supabase.from('profiles').select('*').eq('id', userId).single();
});

// Both components share the same request
async function Header() {
  const { data: user } = await getUser(userId);
  return <h1>Welcome, {user.name}</h1>;
}

async function Sidebar() {
  const { data: user } = await getUser(userId); // Reuses cached result
  return <nav>{user.role === 'admin' && <AdminLinks />}</nav>;
}
```

### 3.2 Parallelize with Component Composition

```typescript
// Parent fetches nothing, children fetch in parallel
export default function BookingsPage() {
  return (
    <div className="grid grid-cols-2">
      <Suspense fallback={<ListSkeleton />}>
        <BookingsList /> {/* Fetches bookings */}
      </Suspense>
      <Suspense fallback={<StatsSkeleton />}>
        <BookingStats /> {/* Fetches stats - parallel! */}
      </Suspense>
    </div>
  );
}
```

### 3.3 Minimize Serialization at RSC Boundaries

❌ Bad: Passing large objects to client components
```typescript
async function Page() {
  const allBookings = await getBookings(); // 1000 bookings
  return <BookingTable bookings={allBookings} />;
}
```

✅ Good: Keep data on server, pass only what's needed
```typescript
async function Page() {
  const bookings = await getBookings({ limit: 20 });
  return <BookingTable bookings={bookings} />;
}

// Or use server actions for pagination
'use client';
function BookingTable({ initialBookings }) {
  const loadMore = async () => {
    const more = await fetchMoreBookings(page); // Server action
  };
}
```

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### 4.1 Use SWR for Deduplication and Caching

```typescript
import useSWR from 'swr';

function useBookings(date: string) {
  return useSWR(
    `/api/bookings?date=${date}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Dedupe requests within 5s
    }
  );
}

// Multiple components can call useBookings(date) - only one request made
```

### 4.2 Optimistic Updates

```typescript
const { mutate } = useSWR('/api/bookings');

async function cancelBooking(id: string) {
  // Optimistically update UI
  mutate(
    bookings => bookings.filter(b => b.id !== id),
    { revalidate: false }
  );
  
  // Then sync with server
  await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
  mutate(); // Revalidate
}
```

## 5. Re-render Optimization (MEDIUM)

### 5.1 Lazy State Initialization

❌ Bad: Expensive calculation on every render
```typescript
const [slots, setSlots] = useState(calculateAllSlots(provider));
```

✅ Good: Initialize lazily
```typescript
const [slots, setSlots] = useState(() => calculateAllSlots(provider));
```

### 5.2 Use startTransition for Non-Urgent Updates

```typescript
import { startTransition } from 'react';

function SearchBookings() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  const handleChange = (e) => {
    setQuery(e.target.value); // Urgent: update input immediately
    
    startTransition(() => {
      setResults(filterBookings(e.target.value)); // Non-urgent: can be deferred
    });
  };
}
```

### 5.3 Defer State Reads

❌ Bad: Reading state in handler captures stale value
```typescript
const [count, setCount] = useState(0);
const increment = () => setCount(count + 1);
```

✅ Good: Use functional update
```typescript
const [count, setCount] = useState(0);
const increment = () => setCount(prev => prev + 1);
```

## 6. Rendering Performance (MEDIUM)

### 6.1 Use content-visibility for Long Lists

```css
.booking-card {
  content-visibility: auto;
  contain-intrinsic-size: 0 120px; /* Estimated height */
}
```

### 6.2 Explicit Conditional Rendering

❌ Risky: Can render 0 or ""
```typescript
{bookings.length && <BookingList bookings={bookings} />}
```

✅ Safe: Explicit ternary
```typescript
{bookings.length > 0 ? <BookingList bookings={bookings} /> : null}
```

### 6.3 Prevent Hydration Mismatch

```typescript
// For date/time that differs between server and client
function BookingTime({ time }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return <span>--:--</span>;
  return <span>{formatTime(time)}</span>;
}
```

## 7. JavaScript Patterns (LOW-MEDIUM)

### 7.1 Build Index Maps for Lookups

❌ Slow: O(n) lookup every time
```typescript
bookings.find(b => b.id === selectedId);
```

✅ Fast: O(1) lookup
```typescript
const bookingsById = useMemo(
  () => new Map(bookings.map(b => [b.id, b])),
  [bookings]
);
bookingsById.get(selectedId);
```

### 7.2 Use toSorted() for Immutability

❌ Mutates original array
```typescript
const sorted = bookings.sort((a, b) => a.date - b.date);
```

✅ Returns new array
```typescript
const sorted = bookings.toSorted((a, b) => a.date - b.date);
```

### 7.3 Early Length Check for Comparisons

```typescript
function arraysEqual(a: any[], b: any[]) {
  if (a.length !== b.length) return false; // Fast path
  return a.every((item, i) => item === b[i]);
}
```
