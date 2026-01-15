---
name: mobile-first-design
description: Mobile-first responsive design patterns for Slotify. Use this skill when building UI components, implementing responsive layouts, or optimizing for touch interactions. Covers Tailwind CSS breakpoints, touch targets, and PWA considerations.
---

# Mobile-First Design Skill

This skill defines mobile-first design patterns for Slotify's booking interface.

## Design Philosophy

Slotify is a **Mobile-First PWA** targeting service providers who manage bookings on-the-go. Every design decision should prioritize mobile usability.

## Tailwind CSS Breakpoints

```css
/* Slotify Breakpoint Strategy */
sm: 640px   /* Large phones / small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Mobile-First Pattern

```tsx
// ✅ Correct: Start with mobile, add larger breakpoints
<div className="
  p-4                    /* Mobile: 16px padding */
  sm:p-6                 /* Tablet: 24px padding */
  lg:p-8                 /* Desktop: 32px padding */
">

// ❌ Wrong: Desktop-first thinking
<div className="p-8 sm:p-6 md:p-4">
```

## Touch Target Guidelines

### Minimum Touch Target Sizes

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Buttons | 44x44px | 48x48px |
| Links | 44x44px | - |
| Icons | 44x44px | 48x48px |
| Form inputs | 44px height | 48px height |

### Implementation

```tsx
// Button with adequate touch target
<button className="
  min-h-[48px]
  min-w-[48px]
  px-4 py-3
  touch-manipulation     /* Disable double-tap zoom */
">

// Icon button
<button className="
  p-3                    /* 12px padding around 24px icon = 48px total */
  rounded-full
  touch-manipulation
">
  <Icon size={24} />
</button>
```

## Responsive Component Patterns

### Cards

```tsx
// Mobile: Full width, stacked
// Tablet+: Grid layout
<div className="
  grid
  grid-cols-1           /* Mobile: single column */
  sm:grid-cols-2        /* Tablet: 2 columns */
  lg:grid-cols-3        /* Desktop: 3 columns */
  gap-4
">
  {services.map(service => <ServiceCard key={service.id} />)}
</div>
```

### Navigation

```tsx
// Bottom nav for mobile, sidebar for desktop
<nav className="
  fixed bottom-0 left-0 right-0    /* Mobile: bottom bar */
  lg:static lg:w-64                /* Desktop: sidebar */
">

// Or hide on mobile, show on desktop
<nav className="
  hidden                /* Mobile: hidden */
  lg:block              /* Desktop: visible */
">
```

### Forms

```tsx
// Stacked on mobile, inline on desktop
<form className="
  flex flex-col gap-4   /* Mobile: stacked */
  sm:flex-row           /* Tablet+: inline */
">
  <input className="flex-1" />
  <button>Submit</button>
</form>
```

### Two-Column Layout (Name + Age style)

```tsx
// Common pattern for form fields
<div className="
  grid
  grid-cols-2           /* Always 2 columns */
  gap-3
">
  <div>
    <label>Name</label>
    <input />
  </div>
  <div>
    <label>Age</label>
    <input />
  </div>
</div>
```

## Typography Scale

```tsx
// Responsive text sizing
<h1 className="
  text-2xl              /* Mobile: 24px */
  sm:text-3xl           /* Tablet: 30px */
  lg:text-4xl           /* Desktop: 36px */
">

// Body text - larger for mobile readability
<p className="
  text-base             /* 16px - minimum for mobile */
  leading-relaxed       /* 1.625 line height */
">
```

## Spacing System

Use consistent spacing that scales:

```tsx
// Page padding
<main className="
  px-4                  /* Mobile: 16px */
  sm:px-6               /* Tablet: 24px */
  lg:px-8               /* Desktop: 32px */
">

// Component spacing
<section className="
  space-y-4             /* 16px between children */
  lg:space-y-6          /* Desktop: 24px */
">
```

## Bottom Sheet Pattern

Common for mobile actions:

```tsx
<div className="
  fixed inset-x-0 bottom-0
  bg-white
  rounded-t-2xl
  shadow-lg
  p-4 pb-safe           /* Safe area for notched phones */
  max-h-[80vh]
  overflow-y-auto
">
  <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
  {/* Content */}
</div>
```

## PWA Considerations

### Safe Areas

```css
/* In globals.css */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.pt-safe {
  padding-top: env(safe-area-inset-top);
}
```

### Standalone Mode Detection

```tsx
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
```

### Pull-to-Refresh Prevention (when not needed)

```css
body {
  overscroll-behavior-y: contain;
}
```

## Performance for Mobile

1. **Lazy load images below the fold**
2. **Use skeleton loaders** - Better perceived performance
3. **Minimize JavaScript bundle** - Slower mobile CPUs
4. **Optimize for 3G** - Test on slow connections
5. **Use `loading="lazy"`** for images

## Testing Checklist

- [ ] Test on actual mobile devices (not just responsive mode)
- [ ] Test with large text (accessibility setting)
- [ ] Test in portrait AND landscape
- [ ] Test touch interactions (swipe, pinch)
- [ ] Test with one-handed use
- [ ] Test on slow connection (3G throttling)
- [ ] Test PWA install and standalone mode

## Common Mistakes

1. ❌ Text smaller than 16px (causes zoom on iOS)
2. ❌ Touch targets smaller than 44px
3. ❌ Horizontal scrolling on mobile
4. ❌ Fixed elements overlapping content
5. ❌ Not testing on real devices
6. ✅ Use `text-base` (16px) as minimum
7. ✅ Use `min-h-[48px]` for interactive elements
8. ✅ Use `overflow-x-hidden` on containers
