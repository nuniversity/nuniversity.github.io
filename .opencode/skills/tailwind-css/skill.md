---
name: tailwind-css
description: Creates, validates, and improves Tailwind CSS utility classes for responsive, accessible, and maintainable UI
triggers:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.css"
  - "**/*.html"
  - src/**
  - app/**
---

## Activation Context

Activate when the user needs to create, edit, validate, or improve Tailwind CSS in React/Next.js components. This skill covers utility-first philosophy, responsive design, dark mode, component patterns, and performance optimization.

---

## Core Philosophy

Tailwind is **utility-first**: compose small, single-purpose classes directly in markup instead of writing custom CSS. Each class does one thing.

```html
<!-- Good: Utility classes compose clearly -->
<button class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
  Get Started
</button>

<!-- Avoid: Abstracting too early -->
<button class="btn-primary">Get Started</button>
```

---

## Utility Class Categories

### Layout
```
flex grid block inline-block inline-flex
items-center justify-between justify-center
gap-4 p-4 m-2
```

### Typography
```
text-sm text-lg text-xl font-bold
text-gray-700 dark:text-gray-300
leading-relaxed tracking-wide
```

### Colors
```
bg-blue-500 text-white
border-gray-200 dark:border-gray-700
hover:bg-blue-600 focus:ring-2 focus:ring-blue-400
```

### Spacing
```
p-4 px-6 py-2       — Padding
m-2 mx-auto my-4     — Margin
gap-4 gap-2          — Flex/Grid gap
space-y-4            — Vertical space between children
```

### Sizing
```
w-full h-screen max-w-7xl min-h-[200px]
w-1/2 h-64
```

### Borders & Shadows
```
rounded-lg rounded-full border
shadow-sm shadow-lg shadow-xl
ring-2 ring-blue-400
```

### Transitions & Animation
```
transition duration-200 ease-in-out
animate-spin animate-pulse
```

---

## Responsive Design (Mobile-First)

Tailwind breakpoints are **mobile-first**: base styles apply to all sizes, prefixed styles apply at that breakpoint and above.

```html
<!-- Base: mobile (default) -->
<!-- sm: 640px+ -->
<!-- md: 768px+ -->
<!-- lg: 1024px+ -->
<!-- xl: 1280px+ -->
<!-- 2xl: 1536px+ -->

<div class="text-center sm:text-left md:text-right lg:text-justify">
  Responsive text alignment
</div>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Common Responsive Patterns

**Stack to Grid**
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Cards stack on mobile, grid on larger screens -->
</div>
```

**Hidden/Show**
```html
<button class="md:hidden">Mobile Menu</button>
<nav class="hidden md:block">Desktop Nav</nav>
```

**Responsive Padding**
```html
<div class="p-4 sm:p-6 lg:p-8">
  Responsive padding increases with screen size
</div>
```

---

## Dark Mode

### Configuration (v4)
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

### Configuration (v3)
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
}
```

### Usage
```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 class="text-2xl font-bold">Title</h1>
  <p class="text-gray-600 dark:text-gray-400">Description</p>
  <button class="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400">
    Action
  </button>
</div>
```

### Dark Mode Patterns

**Card**
```
bg-white dark:bg-gray-800
border border-gray-200 dark:border-gray-700
shadow-sm dark:shadow-gray-900/50
```

**Input**
```
bg-white dark:bg-gray-800
border border-gray-300 dark:border-gray-600
text-gray-900 dark:text-white
placeholder:text-gray-400 dark:placeholder:text-gray-500
```

**Page Background**
```
bg-white dark:bg-gray-950
text-gray-900 dark:text-gray-100
```

---

## Component Patterns

### Button
```html
<!-- Primary -->
<button class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg
               hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
               transition-colors duration-200">
  Click me
</button>

<!-- Secondary -->
<button class="border border-gray-300 dark:border-gray-600
               text-gray-700 dark:text-gray-300
               hover:bg-gray-100 dark:hover:bg-gray-800
               font-semibold py-2 px-4 rounded-lg
               transition-colors duration-200">
  Cancel
</button>

<!-- Ghost -->
<button class="text-gray-600 dark:text-gray-400
               hover:text-gray-900 dark:hover:text-gray-200
               hover:bg-gray-100 dark:hover:bg-gray-800
               py-2 px-4 rounded-lg
               transition-colors duration-200">
  Dismiss
</button>
```

### Card
```html
<div class="bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-2xl p-6 shadow-sm dark:shadow-gray-900/50">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
    Card Title
  </h3>
  <p class="text-gray-600 dark:text-gray-400 mt-2">
    Card description text.
  </p>
  <button class="mt-4 px-4 py-2 bg-cyan-700 dark:bg-cyan-600
                 text-white rounded-lg hover:bg-cyan-800 dark:hover:bg-cyan-500
                 transition-colors">
    Action
  </button>
</div>
```

### Input
```html
<div>
  <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
    Email Address
  </label>
  <input
    type="email"
    placeholder="you@example.com"
    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600
           bg-white dark:bg-gray-800
           text-gray-900 dark:text-white
           placeholder:text-gray-400 dark:placeholder:text-gray-500
           rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
           transition-colors"
  />
</div>
```

### Navbar
```html
<nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <span class="text-xl font-bold text-gray-900 dark:text-white">Logo</span>
      <div class="hidden md:flex space-x-4">
        <a href="#" class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Home
        </a>
      </div>
    </div>
  </div>
</nav>
```

---

## Performance Best Practices

### 1. Let JIT Purge Unused Classes
- Tailwind v4 JIT engine removes unused classes automatically
- Avoid dynamic class construction that Tailwind can't detect

### 2. Use @apply Sparingly
```css
/* Good: Reusable component styles */
.btn-primary {
  @apply bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg
         hover:bg-blue-700 transition-colors;
}

/* Avoid: Using @apply for everything */
```

### 3. Keep Theme Tight
```css
/* Good: Only define what you use */
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
}

/* Avoid: Defining unused colors */
```

### 4. Avoid String Concatenation
```jsx
// Bad: Tailwind can't detect
const classes = `bg-${color}-500`;

// Good: Use complete class names
const colorMap = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
};
```

---

## Accessibility

### Focus States
```html
<button class="focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
  Accessible button
</button>
```

### Screen Reader Only
```html
<span class="sr-only">Screen reader text</span>
```

### Semantic HTML
```html
<!-- Use semantic elements first, then apply utilities -->
<nav class="flex space-x-4">...</nav>
<main class="container mx-auto px-4">...</main>
<article class="prose dark:prose-invert">...</article>
```

### Color Contrast
- Ensure `text-*` and `bg-*` combinations meet WCAG AA contrast ratios
- Use `text-gray-*` on `bg-white` or `bg-gray-*` on `text-white` for safe combinations

---

## Common Patterns

### Centering
```html
<!-- Flex centering -->
<div class="flex items-center justify-center min-h-screen">

<!-- Grid centering -->
<div class="grid place-items-center min-h-screen">
```

### Sticky Footer
```html
<div class="flex flex-col min-h-screen">
  <header class="sticky top-0 z-50">...</header>
  <main class="flex-1">...</main>
  <footer>...</footer>
</div>
```

### Overlay
```html
<div class="relative">
  <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
    Modal content
  </div>
</div>
```

### Truncate Text
```html
<p class="truncate">Long text that will be truncated with ellipsis</p>
<p class="line-clamp-3">Text limited to 3 lines with ellipsis</p>
```

---

## Debugging Tips

1. **Class not working?** Check for typos and ensure the class exists in your Tailwind version
2. **Dark mode not switching?** Verify `darkMode: 'class'` in config and `dark` class on `<html>`
3. **Responsive not working?** Ensure mobile-first approach: base styles first, then `sm:`, `md:`, etc.
4. **Purge removing classes?** Add full class names to safelist or check dynamic class patterns
