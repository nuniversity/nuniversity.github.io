# 🌍 Internationalization (i18n)

NUniversity supports three languages out of the box: **English (en)**, **Portuguese (pt)**, and **Spanish (es)**. This document explains how locale routing, dictionary loading, language switching, and content fallback all work together.

---

## Table of Contents

1. [Locale Configuration](#1-locale-configuration)
2. [URL Structure](#2-url-structure)
3. [Middleware — Locale Detection & Redirect](#3-middleware--locale-detection--redirect)
4. [Dictionaries — UI Strings](#4-dictionaries--ui-strings)
5. [Language Switcher](#5-language-switcher)
6. [Content Localization](#6-content-localization)
7. [SEO & hreflang](#7-seo--hreflang)
8. [Adding a New Language](#8-adding-a-new-language)
9. [Locale Fallback Strategy](#9-locale-fallback-strategy)

---

## 1. Locale Configuration

All locale settings live in a single config file:

```ts
// lib/i18n/config.ts

export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'pt', 'es'],
} as const

export type Locale = (typeof i18n)['locales'][number]  // 'en' | 'pt' | 'es'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  pt: '🇧🇷',
  es: '🇪🇸',
}
```

This is the **single source of truth** for locales. Any new language must be added here first.

---

## 2. URL Structure

Every page is prefixed with the locale code:

```
https://nuniversity.github.io/en/           → English home
https://nuniversity.github.io/pt/           → Portuguese home
https://nuniversity.github.io/es/           → Spanish home

https://nuniversity.github.io/en/courses/   → English courses
https://nuniversity.github.io/pt/courses/   → Portuguese courses

https://nuniversity.github.io/en/courses/intro-to-programming/01-introduction/
https://nuniversity.github.io/pt/courses/intro-to-programming/01-introduction/
```

The `[lang]` dynamic segment in `app/[lang]/` captures the locale and passes it as `params.lang` to every page component.

---

## 3. Middleware — Locale Detection & Redirect

When a user visits a URL **without** a locale prefix (e.g., `/courses`), the middleware automatically detects their preferred language and redirects them.

```ts
// middleware.ts

function getLocale(request: NextRequest): string {
  // 1. Check URL pathname for existing locale prefix
  const pathnameLocale = i18n.locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (pathnameLocale) return pathnameLocale

  // 2. Check NEXT_LOCALE cookie (set when user manually switches language)
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie && i18n.locales.includes(localeCookie)) return localeCookie

  // 3. Parse Accept-Language header from browser
  const acceptLanguage = request.headers.get('accept-language')
  // ... parses and matches against supported locales

  // 4. Fallback to defaultLocale ('en')
  return i18n.defaultLocale
}
```

### Middleware Detection Priority

```
1. URL already has locale prefix  →  use it as-is
2. NEXT_LOCALE cookie exists      →  use cookie value
3. Accept-Language header matches →  use browser preference
4. None of the above              →  use 'en' (default)
```

### Middleware Exclusions

The middleware skips these paths to avoid interfering with static assets:

```ts
export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)', ],
}
```

Paths starting with `/_next`, `/api`, or containing a file extension (e.g., `.ico`, `.png`) are excluded.

---

## 4. Dictionaries — UI Strings

All UI text labels (navigation, buttons, headings, error messages, etc.) are stored in **JSON dictionary files**:

```
dictionaries/
├── en.json   ← English UI strings
├── pt.json   ← Portuguese UI strings
└── es.json   ← Spanish UI strings
```

### Dictionary Structure

```json
{
  "metadata": { "home": { "title": "...", "description": "..." } },
  "navigation": { "home": "Home", "courses": "Courses", ... },
  "hero": { "badge": "...", "title": "...", "subtitle": "...", ... },
  "features": { ... },
  "courses": { ... },
  "games": { ... },
  "tools": { ... },
  "library": { ... },
  "footer": { ... },
  "common": { "loading": "Loading...", "next": "Next", ... }
}
```

### Loading a Dictionary

```ts
// lib/i18n/get-dictionary.ts

import en from '@/dictionaries/en.json'
import pt from '@/dictionaries/pt.json'
import es from '@/dictionaries/es.json'

const dictionaries = { en, pt, es }

export const getDictionary = (locale: Locale) => {
  return dictionaries[locale] || dictionaries.en
}

export type Dictionary = ReturnType<typeof getDictionary>
```

### Using the Dictionary in Pages

```tsx
// app/[lang]/page.tsx (Server Component)

export default async function HomePage({ params }) {
  const dict = await getDictionary(params.lang)

  return (
    <>
      <Hero lang={params.lang} dict={dict} />
      <Features lang={params.lang} dict={dict} />
    </>
  )
}
```

### Using the Dictionary in Components

```tsx
// components/home/Hero.tsx

interface HeroProps {
  lang: Locale
  dict: Dictionary
}

export default function Hero({ lang, dict }: HeroProps) {
  return (
    <section>
      <h1>{dict.hero.title}</h1>
      <p>{dict.hero.subtitle}</p>
    </section>
  )
}
```

---

## 5. Language Switcher

The `LanguageSwitcher` component is rendered in the `Header` and allows users to switch languages at any time.

```tsx
// components/language/LanguageSwitcher.tsx

const switchLanguage = (newLocale: Locale) => {
  // 1. Replace locale segment in current URL path
  const segments = pathname.split('/')
  segments[1] = newLocale
  const newPathname = segments.join('/')

  // 2. Persist the choice in a cookie (1 year)
  document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`

  // 3. Navigate to the same page in the new locale
  router.push(newPathname)
}
```

**Example:** If the user is on `/en/courses/intro-to-programming/01-introduction` and switches to `pt`, they are navigated to `/pt/courses/intro-to-programming/01-introduction`.

The switcher displays:
- The flag emoji for the current locale
- The locale name in its own language (e.g., "Português", not "Portuguese")
- A checkmark `✓` next to the currently active locale

---

## 6. Content Localization

### Courses

Course lessons are stored in locale-specific subdirectories:

```
content/courses/intro-to-programming/
├── course.json          # multilingual metadata
├── en/
│   ├── 01-introduction.md
│   ├── 02-variables.md
│   └── 03-functions.md
├── pt/
│   ├── 01-introduction.md
│   ├── 02-variables.md
│   └── 03-functions.md
└── es/
    ├── 01-introduction.md
    ├── 02-variables.md
    └── 03-functions.md
```

**Fallback behavior:** If a lesson doesn't exist in the requested locale, the system automatically falls back to English:

```ts
// lib/courses/get-course-content.ts

if (!fs.existsSync(filePath)) {
  if (locale !== 'en') {
    return getCourseContent(courseSlug, lessonSlug, 'en')  // fallback
  }
  return null
}
```

### Course Metadata (`course.json`)

The `course.json` supports per-locale fields:

```json
{
  "area": "Computer Science",
  "difficulty": "Intermediate",
  "en": {
    "title": "Introduction to Programming",
    "description": "Learn the fundamentals...",
    "duration": "4 Weeks"
  },
  "pt": {
    "title": "Introdução à Programação",
    "description": "Aprenda os fundamentos...",
    "duration": "4 Semanas"
  },
  "es": {
    "title": "Introducción a la Programación",
    "description": "Aprende los fundamentos...",
    "duration": "4 Semanas"
  }
}
```

### Tools

Each tool has a Markdown file per locale:

```
content/tools/eisenhower-matrix/
├── en.md    # English metadata
├── pt.md    # Portuguese metadata
└── es.md    # Spanish metadata
```

### Library Resources

Library resources are organized by language first:

```
content/library/
├── en/
│   ├── video/
│   ├── ebook/
│   ├── course/
│   ├── blog/
│   ├── repository/
│   ├── podcast/
│   └── article/
└── (pt/, es/ can be added in the future)
```

### Games

Vocabulary games are **language-agnostic** JSON files that contain word pairs for any language combination:

```json
{
  "id": "en-to-pt",
  "language_pair": { "source": "en", "target": "pt" },
  "words": [
    { "id": "1", "source": "Hello", "target": "Olá", "context": "greeting" }
  ]
}
```

Available game files:
- `en-to-pt.json` — English → Portuguese (Basic)
- `en-to-pt-advanced.json` — English → Portuguese (Advanced)
- `es-to-en.json` — Spanish → English
- `es-to-pt.json` — Spanish → Portuguese

---

## 7. SEO & hreflang

The root layout (`app/[lang]/layout.tsx`) sets correct `hreflang` alternate link tags for all supported locales:

```tsx
// HTML head alternates
<link rel="alternate" hrefLang="en" href="https://nuniversity.github.io/en" />
<link rel="alternate" hrefLang="pt" href="https://nuniversity.github.io/pt" />
<link rel="alternate" hrefLang="es" href="https://nuniversity.github.io/es" />
<link rel="alternate" hrefLang="x-default" href="https://nuniversity.github.io/en" />
```

The `generateMetadata()` function in each page also sets the correct OpenGraph locale:

```ts
openGraph: {
  locale: params.lang === 'en' ? 'en_US'
        : params.lang === 'pt' ? 'pt_BR'
        : 'es_ES',
}
```

The Layout also injects **JSON-LD structured data** for search engines:

```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "NUniversity",
  "contactPoint": {
    "availableLanguage": ["English", "Português", "Español"]
  }
}
```

---

## 8. Adding a New Language

Follow these steps to add a new language (e.g., French `fr`):

### Step 1 — Register the locale

```ts
// lib/i18n/config.ts
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'pt', 'es', 'fr'],   // ← add 'fr'
} as const

export const localeNames = {
  ...existing,
  fr: 'Français',
}

export const localeFlags = {
  ...existing,
  fr: '🇫🇷',
}
```

### Step 2 — Create the dictionary

```bash
cp dictionaries/en.json dictionaries/fr.json
# Then translate all values in dictionaries/fr.json
```

### Step 3 — Register dictionary in loader

```ts
// lib/i18n/get-dictionary.ts
import fr from '@/dictionaries/fr.json'
const dictionaries = { en, pt, es, fr }
```

### Step 4 — Translate course content

```bash
mkdir -p content/courses/intro-to-programming/fr
# Create translated .md files
```

### Step 5 — Translate tool metadata

```bash
# For each tool:
cp content/tools/eisenhower-matrix/en.md content/tools/eisenhower-matrix/fr.md
# Translate title, description fields
```

### Step 6 — Add library resources (optional)

```bash
mkdir -p content/library/fr/{video,ebook,course,blog}
# Add .md resource files with French frontmatter
```

### Step 7 — Update `app/[lang]/layout.tsx`

Add the new `hreflang` link and OpenGraph locale mapping.

---

## 9. Locale Fallback Strategy

| Content Type | Missing Locale | Fallback |
|---|---|---|
| Course lesson | `pt` version doesn't exist | Falls back to `en` lesson |
| Course metadata | `fr` key missing in `course.json` | Falls back to `en` key, then root key |
| Tool metadata | `fr.md` doesn't exist | Returns `null` (tool hidden) |
| Library resource | No `fr/` directory | Returns empty array |
| UI strings (dictionary) | Key missing | `getDictionary` returns `en` dictionary |

> **Best practice:** Always create English (`en`) versions of all content first. Other locale translations can be added incrementally.
