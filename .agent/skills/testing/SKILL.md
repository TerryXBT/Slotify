---
name: testing
description: Testing standards and patterns for Slotify project. Use this skill when writing tests, setting up test infrastructure, or debugging test failures. Covers Vitest, React Testing Library, and integration testing.
---

# Testing Skill

This skill defines the testing standards for the Slotify booking application.

## Testing Stack

- **Vitest** - Test runner and assertion library
- **React Testing Library** - Component testing
- **jsdom** - Browser environment simulation

## Test File Organization

```
src/
├── lib/
│   ├── availability.ts
│   └── availability.test.ts      # Unit tests next to source
├── components/
│   ├── BookingFlow.tsx
│   └── BookingFlow.test.tsx
└── __tests__/                    # Integration tests
    └── booking-flow.test.ts
```

## Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific file
npm run test -- availability.test.ts

# Watch mode
npm run test -- --watch
```

## Testing Patterns

### 1. Unit Tests for Business Logic

Test pure functions and business logic thoroughly:

```typescript
import { describe, it, expect } from 'vitest';
import { generateTimeSlots, isSlotAvailable } from './availability';

describe('Availability Engine', () => {
  describe('generateTimeSlots', () => {
    it('should generate 15-minute slots within business hours', () => {
      const slots = generateTimeSlots({
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 15,
      });
      
      expect(slots).toHaveLength(32);
      expect(slots[0]).toBe('09:00');
      expect(slots[slots.length - 1]).toBe('16:45');
    });
    
    it('should respect buffer times', () => {
      // ... test buffer time logic
    });
  });
});
```

### 2. Component Tests

Test component behavior, not implementation:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookingForm } from './BookingForm';

describe('BookingForm', () => {
  it('should submit booking with valid data', async () => {
    const onSubmit = vi.fn();
    
    render(<BookingForm onSubmit={onSubmit} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /book/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });
  
  it('should show validation errors for invalid email', async () => {
    render(<BookingForm onSubmit={vi.fn()} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /book/i }));
    
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

### 3. Server Action Tests

Mock Supabase for server action tests:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBooking } from './actions';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: mockBooking, error: null })),
        })),
      })),
    })),
  })),
}));

describe('createBooking', () => {
  it('should create booking and return success', async () => {
    const formData = new FormData();
    formData.set('service_id', '123');
    formData.set('client_name', 'Test Client');
    
    const result = await createBooking(formData);
    
    expect(result.success).toBe(true);
    expect(result.booking).toBeDefined();
  });
});
```

## What to Test

### Must Test (Critical Paths)
- Availability calculation logic
- Booking creation/cancellation
- Double-booking prevention
- Token validation
- Timezone conversions

### Should Test
- Form validation
- Component interactions
- Error states
- Loading states

### Nice to Have
- Edge cases
- Visual regression (with Playwright)
- E2E booking flow

## Test Coverage Targets

| Category | Target |
|----------|--------|
| Business logic (`lib/`) | 90%+ |
| Server actions | 80%+ |
| Components | 70%+ |
| Overall | 75%+ |

## Mocking Guidelines

1. **Mock external services** (Supabase, Resend) not internal modules
2. **Use real implementations** when possible for integration tests
3. **Reset mocks** in beforeEach to avoid test pollution
4. **Avoid over-mocking** - it leads to false positives

## Common Pitfalls

- ❌ Testing implementation details instead of behavior
- ❌ Not waiting for async operations
- ❌ Forgetting to cleanup after tests
- ❌ Using `toMatchSnapshot()` without purpose
- ✅ Testing user interactions and outcomes
- ✅ Using `waitFor` and `findBy*` for async content
