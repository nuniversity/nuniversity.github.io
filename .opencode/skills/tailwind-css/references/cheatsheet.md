# Tailwind CSS Quick Reference

## Breakpoints
| Prefix | Min Width | Typical Use |
|--------|-----------|-------------|
| (none) | 0px | Mobile (base) |
| `sm:` | 640px | Large mobile |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1536px | Extra large |

## Spacing Scale
| Class | Value |
|-------|-------|
| `p-0` / `m-0` | 0px |
| `p-1` / `m-1` | 4px |
| `p-2` / `m-2` | 8px |
| `p-3` / `m-3` | 12px |
| `p-4` / `m-4` | 16px |
| `p-5` / `m-5` | 20px |
| `p-6` / `m-6` | 24px |
| `p-8` / `m-8` | 32px |
| `p-10` / `m-10` | 40px |
| `p-12` / `m-12` | 48px |

## Font Sizes
| Class | Size | Line Height |
|-------|------|-------------|
| `text-xs` | 12px | 16px |
| `text-sm` | 14px | 20px |
| `text-base` | 16px | 24px |
| `text-lg` | 18px | 28px |
| `text-xl` | 20px | 28px |
| `text-2xl` | 24px | 32px |
| `text-3xl` | 30px | 36px |
| `text-4xl` | 36px | 40px |

## Colors (Gray Scale)
| Class | Light | Dark |
|-------|-------|------|
| `gray-50` | #f9fafb | |
| `gray-100` | #f3f4f6 | |
| `gray-200` | #e5e7eb | |
| `gray-300` | #d1d5db | |
| `gray-400` | #9ca3af | |
| `gray-500` | #6b7280 | |
| `gray-600` | #4b5563 | |
| `gray-700` | #374151 | |
| `gray-800` | #1f2937 | |
| `gray-900` | #111827 | |
| `gray-950` | #030712 | |

## Border Radius
| Class | Value |
|-------|-------|
| `rounded-none` | 0px |
| `rounded-sm` | 2px |
| `rounded` | 4px |
| `rounded-md` | 6px |
| `rounded-lg` | 8px |
| `rounded-xl` | 12px |
| `rounded-2xl` | 16px |
| `rounded-full` | 9999px |

## Shadows
| Class | Description |
|-------|-------------|
| `shadow-sm` | Small shadow |
| `shadow` | Default shadow |
| `shadow-md` | Medium shadow |
| `shadow-lg` | Large shadow |
| `shadow-xl` | Extra large shadow |
| `shadow-2xl` | 2x large shadow |
| `shadow-inner` | Inner shadow |
| `shadow-none` | No shadow |

## Common Combos

### Card
```
bg-white dark:bg-gray-800
border border-gray-200 dark:border-gray-700
rounded-2xl p-6 shadow-sm
```

### Button Primary
```
bg-blue-600 text-white
hover:bg-blue-700
focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
font-semibold py-2 px-4 rounded-lg
transition-colors duration-200
```

### Input
```
w-full px-4 py-2
border border-gray-300 dark:border-gray-600
bg-white dark:bg-gray-800
text-gray-900 dark:text-white
placeholder:text-gray-400
rounded-lg focus:ring-2 focus:ring-blue-500
```
