# Tailwind CSS Component Examples

## Responsive Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <div
      key={item.id}
      className="bg-white dark:bg-gray-800
                 border border-gray-200 dark:border-gray-700
                 rounded-2xl p-6 shadow-sm dark:shadow-gray-900/50
                 hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {item.title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        {item.description}
      </p>
      <button className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500
                         text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-400
                         transition-colors">
        Learn More
      </button>
    </div>
  ))}
</div>
```

## Dark Mode Toggle

```tsx
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800
                 text-gray-700 dark:text-gray-300
                 hover:bg-gray-200 dark:hover:bg-gray-700
                 transition-colors"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
```

## Responsive Navigation

```tsx
<nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      <span className="text-xl font-bold text-gray-900 dark:text-white">
        Logo
      </span>
      <div className="hidden md:flex space-x-4">
        <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          Home
        </a>
        <a href="#" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          About
        </a>
      </div>
      <button className="md:hidden p-2 text-gray-700 dark:text-gray-300">
        Menu
      </button>
    </div>
  </div>
</nav>
```

## Form Input

```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
      Email Address
    </label>
    <input
      type="email"
      placeholder="you@example.com"
      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-800
                 text-gray-900 dark:text-white
                 placeholder:text-gray-400 dark:placeholder:text-gray-500
                 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 transition-colors"
    />
  </div>
  <button className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg
                     hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                     transition-colors duration-200">
    Submit
  </button>
</div>
```
