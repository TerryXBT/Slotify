---
name: code-review
description: Code review standards and best practices for Slotify project. Use this skill when reviewing code, suggesting improvements, or maintaining code quality. Covers TypeScript, React hooks, error handling, and security practices.
---

# Code Review Skill

This skill defines the code review standards for the Slotify project.

## Review Checklist

### 1. TypeScript Best Practices

- [ ] **No `any` types** - Use proper type definitions
- [ ] **Explicit return types** - Functions should have explicit return types
- [ ] **Strict null checks** - Handle undefined/null properly
- [ ] **Use Zod for validation** - All user inputs validated with Zod schemas

```typescript
// ❌ Bad
function getUser(id: any) {
  return fetch(`/api/users/${id}`);
}

// ✅ Good
async function getUser(id: string): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### 2. React Patterns

- [ ] **No inline function definitions in deps** - Avoid creating functions inside useEffect/useCallback deps
- [ ] **Memoize expensive computations** - Use useMemo for complex calculations
- [ ] **Stable callback references** - Use useCallback for event handlers passed to children
- [ ] **Proper dependency arrays** - Include all dependencies in useEffect/useCallback

```typescript
// ❌ Bad - creates new function on every render
<Button onClick={() => handleClick(id)} />

// ✅ Good - stable reference
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id, handleClick]);
<Button onClick={handleButtonClick} />
```

### 3. Server Actions (Next.js)

- [ ] **Use 'use server' directive** - All server actions must have the directive
- [ ] **Validate inputs** - Use Zod schemas for validation
- [ ] **Handle errors gracefully** - Return structured error responses
- [ ] **Revalidate paths** - Call revalidatePath after mutations

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function createBooking(formData: FormData) {
  const result = schema.safeParse(Object.fromEntries(formData));
  
  if (!result.success) {
    return { error: result.error.flatten() };
  }
  
  // ... create booking
  
  revalidatePath('/app/bookings');
  return { success: true };
}
```

### 4. Error Handling

- [ ] **Use try-catch blocks** - Wrap async operations
- [ ] **Log errors to Sentry** - Use Sentry.captureException for production errors
- [ ] **User-friendly messages** - Never expose raw error messages to users
- [ ] **Fallback UI** - Provide error boundaries for component failures

### 5. Security Checklist

- [ ] **RLS policies** - Verify Supabase RLS is enabled
- [ ] **Input sanitization** - Sanitize user inputs before database operations
- [ ] **Token validation** - Validate action tokens before performing sensitive operations
- [ ] **No sensitive data in client** - Keep SUPABASE_SERVICE_ROLE_KEY server-side only

### 6. Performance

- [ ] **Use Next.js Image** - Replace `<img>` with `<Image>` component
- [ ] **Lazy load components** - Use `dynamic()` for heavy components
- [ ] **Avoid unnecessary re-renders** - Use React.memo for pure components
- [ ] **Optimize database queries** - Use proper indexes and avoid N+1 queries

### 7. Accessibility (a11y)

- [ ] **Semantic HTML** - Use proper heading hierarchy and semantic elements
- [ ] **ARIA labels** - Add aria-labels for interactive elements
- [ ] **Keyboard navigation** - Ensure all interactive elements are keyboard accessible
- [ ] **Color contrast** - Maintain WCAG AA compliance

## Review Process

1. **First Pass**: Check for obvious errors, typos, and linting issues
2. **Second Pass**: Review business logic and edge cases
3. **Third Pass**: Check performance implications
4. **Final Pass**: Verify tests and documentation

## Approval Criteria

A PR can be approved if:
- All checklist items are addressed
- No critical/high severity issues remain
- Tests pass with adequate coverage
- Documentation is updated for new features
