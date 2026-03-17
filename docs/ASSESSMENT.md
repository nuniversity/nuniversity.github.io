# 🔍 Code Assessment — Bugs & Improvement Analysis

> **Scope:** Full codebase audit of the NUniversity platform.  
> **Methodology:** Static analysis of all `app/`, `components/`, `lib/`, `content/`, `dictionaries/`, and config files.  
> **Priority Levels:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## Table of Contents

1. [Critical Bugs](#1-critical-bugs)
2. [High-Priority Issues](#2-high-priority-issues)
3. [Medium-Priority Improvements](#3-medium-priority-improvements)
4. [Low-Priority / Nice-to-Have](#4-low-priority--nice-to-have)
5. [Security Considerations](#5-security-considerations)
6. [Performance Opportunities](#6-performance-opportunities)
7. [Summary Table](#7-summary-table)

---

## 1. Critical Bugs

---

### 🔴 BUG-01 — Contact Page Has Wrong Metadata and Renders Wrong Component

**File:** `app/[lang]/contact/page.tsx`

**Severity:** 🔴 Critical — The contact page has the wrong comment header, uses the **home page's metadata**, and imports unused components.

**Evidence:**
```tsx
// app/[lang]/page.tsx  ← WRONG comment, this is contact/page.tsx

import Hero from '@/components/home/Hero'     // ← imported but never used
import Features from '@/components/home/Features' // ← imported but never used

export async function generateMetadata(...) {
  return {
    title: dict.metadata.home.title,       // ← Uses HOME metadata, not contact
    description: dict.metadata.home.description, // ← Uses HOME metadata
  }
}
```

**Impact:**
- Search engines index the contact page as if it were the home page (duplicate SEO metadata)
- Dead imports bloat the bundle (Hero, Features never used)
- No contact-specific metadata exists in the dictionary

**Fix:**
```tsx
// app/[lang]/contact/page.tsx

// Remove Hero and Features imports entirely

export async function generateMetadata({ params }) {
  const dict = await getDictionary(params.lang)
  return {
    title: dict.contact?.title
      ? `${dict.contact.title} ${dict.contact.titleHighlight}` 
      : 'Contact',
    description: dict.contact?.subtitle || 'Get in touch with the NUniversity team',
  }
}
```

---

### 🔴 BUG-02 — Game Completion Check Uses Stale State (Race Condition)

**File:** `app/[lang]/games/vocabulary/[slug]/vocabulary-game-client.tsx`

**Severity:** 🔴 Critical — The game **never completes** or completes one move too late due to stale closure over `matchedPairs.size`.

**Evidence:**
```tsx
// Inside a setTimeout callback — matchedPairs is stale at closure time
if (matchedPairs.size + 1 === numPairs) {
  setIsComplete(true)   // ← matchedPairs.size is the OLD value here
}
```

React state updates are **asynchronous**. At the time this check runs, `matchedPairs.size` still reflects the value from the previous render. The `setMatchedPairs` call above it has not yet taken effect.

**Impact:**
- The game never shows the completion modal, even when all pairs are matched
- Players are stuck with a finished board and no feedback

**Fix:** Use the functional form of the state updater to access the latest state:
```tsx
setMatchedPairs(prev => {
  const newSet = new Set(prev)
  newSet.add(first.wordId)
  // Check with the NEW size, not the stale closure
  if (newSet.size === numPairs) {
    setIsComplete(true)
  }
  return newSet
})
```

---

### 🔴 BUG-03 — `generateStaticParams` for Tools Deduplicates Across Locales Incorrectly

**File:** `app/[lang]/tools/[slug]/page.tsx`

**Severity:** 🔴 Critical — `getAllTools(lang)` is called per locale, but if a tool only has `en.md` (not `pt.md` or `es.md`), it is missing from the `/pt/tools/...` and `/es/tools/...` static generation. Visiting those URLs returns a 404 in production.

**Evidence:**
```ts
export async function generateStaticParams() {
  const langs: Locale[] = ['en', 'pt', 'es']
  for (const lang of langs) {
    const tools = await getAllTools(lang)   // Returns [] if {lang}.md missing
    for (const tool of tools) {
      params.push({ lang, slug: tool.slug })
      // No fallback to English — PT/ES pages not generated if PT/ES .md missing
    }
  }
}
```

**Impact:** Any tool that lacks a translated metadata file won't be pre-rendered for that locale, resulting in a 404 when the user navigates from the tools listing to the tool detail page in their non-English locale.

**Fix:** Generate params for all known slugs for all locales, falling back to English metadata:
```ts
export async function generateStaticParams() {
  const enTools = await getAllTools('en')   // English is always the source of truth
  const langs: Locale[] = ['en', 'pt', 'es']
  return langs.flatMap(lang =>
    enTools.map(tool => ({ lang, slug: tool.slug }))
  )
}
```

---

### 🔴 BUG-04 — Course Detail Page Link Breaks When `firstLessonSlug` Is Undefined

**File:** `app/[lang]/courses/courses-client.tsx`

**Severity:** 🔴 Critical — When `firstLessonSlug` is `undefined`, the `<Link>` navigates to `/{lang}/courses/{slug}/undefined` which returns a 404.

**Evidence:**
```tsx
const firstLessonSlug = courseData?.lessons?.[0]?.slug  // Can be undefined

href={
  firstLessonSlug
    ? `/${lang}/courses/${course.slug}/${firstLessonSlug}`
    : `/${lang}/courses/${course.slug}`  // ← This fallback route doesn't exist
}
```

The route `/{lang}/courses/{slug}` has no corresponding `page.tsx` in the app router — only `/{lang}/courses/{slug}/{lessonSlug}` exists.

**Impact:** Courses without lessons (or with data loading issues) produce a dead link that 404s.

**Fix:** Either add a `app/[lang]/courses/[courseSlug]/page.tsx` that redirects to the first lesson, or disable the card entirely when there are no lessons:
```tsx
// Option A: Don't render card if no lessons
if (!firstLessonSlug) return null

// Option B: Always disable the card link
href={firstLessonSlug ? `/${lang}/courses/${course.slug}/${firstLessonSlug}` : '#'}
```

---

## 2. High-Priority Issues

---

### 🟠 ISSUE-05 — `dict` Typed as `any` Across Most Components

**Files:** All `*-client.tsx` files, all tool components

**Severity:** 🟠 High — `dict: any` disables all TypeScript safety, allowing silent runtime errors when dictionary keys are missing or renamed.

**Evidence:**
```tsx
// library-client.tsx
interface LibraryClientProps {
  dict: any   // ← kills TypeScript everywhere dict is used
}

// EisenhowerMatrix.tsx
const EisenhowerMatrix = ({ lang = 'en', dict = {} }: EisenhowerMatrixProps) => {
  // dict is any — no autocomplete, no safety
```

**Impact:**
- Typos in dictionary key access (e.g., `dict.libary?.title`) silently return `undefined`
- Displayed UI shows `undefined` or falls through to hardcoded English fallbacks silently
- Impossible to refactor dictionary keys safely

**Fix:** Use the exported `Dictionary` type consistently:
```tsx
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface LibraryClientProps {
  lang: Locale
  resources: LibraryResource[]
  dict: Dictionary   // ← fully typed
}
```

---

### 🟠 ISSUE-06 — Hardcoded English Strings in Game Client Component

**Files:** `app/[lang]/games/vocabulary/[slug]/vocabulary-game-client.tsx`

**Severity:** 🟠 High — Despite accepting `dict` as a prop, the vocabulary game contains **many hardcoded English strings** that are never translated.

**Evidence (partial list):**
```tsx
<p className="text-sm text-muted-foreground mt-1">
  Total words available: {game.words.length}  {/* ← hardcoded */}
</p>

<h3 className="font-semibold text-lg mb-4">Game Settings</h3>  {/* ← hardcoded */}
<span className="text-muted-foreground">Number of pairs:</span>  {/* ← hardcoded */}
<span className="text-sm text-muted-foreground">({numPairs * 2} cards total)</span> {/* ← hardcoded */}

<h2 className="text-3xl font-bold mb-2">Congratulations!</h2>  {/* ← hardcoded */}
<p className="text-muted-foreground mb-6">You've completed the game!</p> {/* ← hardcoded */}
<span>Score</span>  {/* ← hardcoded */}
<span>Time</span>   {/* ← hardcoded */}
<span>Matches</span> {/* ← hardcoded */}
<span>Accuracy</span> {/* ← hardcoded */}
<span>Restart</span>  {/* ← hardcoded */}
<span>Back to Games</span>  {/* ← hardcoded, ignores dict.games.back_to_games */}
<h3>How to Play</h3>        {/* ← hardcoded, ignores dict.games.how_to_play */}
<span>Play Again</span>     {/* ← hardcoded, ignores dict.games.play_again */}
<span>More Games</span>     {/* ← hardcoded, ignores dict.games.more_games */}
```

**Impact:** Portuguese and Spanish users see English text throughout the game, defeating the purpose of i18n.

**Fix:** Replace with dictionary lookups:
```tsx
<span>{dict.games?.back_to_games || 'Back to Games'}</span>
<h2>{dict.games?.congratulations || 'Congratulations!'}</h2>
<span>{dict.games?.stats?.score || 'Score'}</span>
// etc.
```

---

### 🟠 ISSUE-07 — `podcast` and `article` Types Missing from Library Filter UI

**File:** `app/[lang]/library/library-client.tsx`

**Severity:** 🟠 High — Two of the seven resource types are **not filterable** in the UI.

**Evidence:**
```tsx
// Only 5 of 7 types shown in filter:
{(['video', 'ebook', 'course', 'blog', 'repository'] as ResourceType[]).map(type => {
  // 'podcast' and 'article' are completely excluded from the filter UI
```

**Impact:** Users cannot filter by podcast or article resources. They are only discoverable via search, and there is no visual indication that these types exist.

**Fix:**
```tsx
const ALL_FILTER_TYPES: ResourceType[] = ['video', 'ebook', 'course', 'blog', 'repository', 'podcast', 'article']
{ALL_FILTER_TYPES.map(type => ( ... ))}
```

---

### 🟠 ISSUE-08 — Library Result Count Is Hardcoded English

**File:** `app/[lang]/library/library-client.tsx`

**Severity:** 🟠 High — The results count string is hardcoded in English.

**Evidence:**
```tsx
<div className="mb-6 text-sm text-muted-foreground">
  Showing {filteredResources.length} of {resources.length} resources
  {/* ← Hardcoded, not from dictionary */}
</div>
```

**Fix:**
```tsx
{filteredResources.length} {dict.library?.total_resources || 'resources'}
```

---

### 🟠 ISSUE-09 — Courses Area Count Is Hardcoded English

**File:** `app/[lang]/courses/courses-client.tsx`

**Severity:** 🟠 High — Plural handling is hardcoded in English.

**Evidence:**
```tsx
<p className="text-sm text-muted-foreground">
  {areaCourses.length} {areaCourses.length === 1 ? 'course' : 'courses'}
  {/* ← Hardcoded plural form — breaks for PT/ES */}
</p>
```

**Fix:** Use the dictionary string:
```tsx
{areaCourses.length} {dict.courses?.total_courses || 'courses'}
```

---

### 🟠 ISSUE-10 — No `generateStaticParams` for Courses Detail Page Locale Fallback

**File:** `app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx`

**Severity:** 🟠 High — When building, `generateStaticParams()` iterates all locales via `getAllLessons(null, lang)`. If a course only has English lessons, the PT/ES locale pages are **not generated** because `getAllLessons(null, 'pt')` returns no lessons for that course.

**Impact:** `/pt/courses/intro-to-data-engineering/01-...` returns a 404 even though an English fallback exists.

**Fix:** Generate params for all locales based on English lesson list, then let the `getCourseContent` fallback to English handle the content:
```ts
for (const lang of i18n.locales) {
  // Get English lessons as the source of truth for slugs
  const enLessons = await getAllLessons(null, 'en')
  for (const course of enLessons) {
    for (const lesson of course.lessons) {
      params.push({ lang, courseSlug: course.slug, lessonSlug: lesson.slug })
    }
  }
}
```

---

## 3. Medium-Priority Improvements

---

### 🟡 IMPROVE-11 — `EisenhowerMatrix` Has Hardcoded Translations Instead of Using Dictionary

**File:** `components/tools/EisenhowerMatrix.tsx`

**Severity:** 🟡 Medium — The component maintains its own full inline translation map (`translations.en`, `translations.pt`, `translations.es`) instead of using the dictionary system.

**Impact:**
- Duplication of all text strings across the tool and the dictionary
- Adding a new language requires editing both the tool component AND the dictionary files
- Text maintenance is split across two systems

**Recommendation:** Migrate the tool's text to `dictionaries/en.json` (under `tools.eisenhowerMatrix`) and consume it via the `dict` prop, consistent with `LLMPromptBuilder`.

---

### 🟡 IMPROVE-12 — No Loading States or Skeleton UI for Dynamic Imports

**File:** `app/[lang]/tools/[slug]/page.tsx`

**Severity:** 🟡 Medium — Tool components use `next/dynamic` with `ssr: false` but no `loading` component, causing a content flash (blank space) while the JS bundle loads.

**Evidence:**
```ts
const EisenhowerMatrix = dynamicImport(() => import('@/components/tools/EisenhowerMatrix'), {
  ssr: false,
  // ← No loading component specified
})
```

**Fix:**
```ts
const EisenhowerMatrix = dynamicImport(() => import('@/components/tools/EisenhowerMatrix'), {
  ssr: false,
  loading: () => (
    <div className="container-custom py-12 flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  ),
})
```

---

### 🟡 IMPROVE-13 — `mermaid-diagram` Course Has No `course.json`

**File:** `content/courses/mermaid-diagram/`

**Severity:** 🟡 Medium — The `mermaid-diagram` course folder has no `course.json`, so `getAllCourses()` falls back to reading the first lesson's frontmatter. If that fallback also fails, the course gets a generic auto-generated title.

**Evidence:** Directory listing shows `content/courses/mermaid-diagram/en/mermaid-example.md` only — no `course.json`.

**Fix:** Create `content/courses/mermaid-diagram/course.json`:
```json
{
  "area": "Computer Science",
  "difficulty": "beginner",
  "en": {
    "title": "Mermaid Diagrams",
    "description": "Learn to create beautiful diagrams using Mermaid syntax.",
    "duration": "30 min"
  }
}
```

---

### 🟡 IMPROVE-14 — Stale `page copy.tsx` File in Contact Directory

**File:** `app/[lang]/contact/page copy.tsx`

**Severity:** 🟡 Medium — A leftover file named `page copy.tsx` exists in the contact directory. Next.js App Router may pick this up unexpectedly on certain configurations, and it pollutes the source tree.

**Fix:**
```bash
rm "app/[lang]/contact/page copy.tsx"
```

---

### 🟡 IMPROVE-15 — `globals.css` Custom Container Class Not Using Tailwind's `@apply`

**File:** `app/globals.css`

**Severity:** 🟡 Medium — The `.container-custom` class likely uses manual CSS rather than Tailwind's design tokens. This creates inconsistency when Tailwind configuration changes (e.g., breakpoints, padding).

**Recommendation:** Audit `.container-custom` and ensure it uses `@apply` with Tailwind classes, or replace it with a Tailwind container configuration in `tailwind.config.js`.

---

### 🟡 IMPROVE-16 — No Error Boundary Around `MarkdownRenderer`

**File:** `app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx`

**Severity:** 🟡 Medium — `MarkdownRenderer` dynamically imports Mermaid and runs complex rendering logic. If it throws (malformed diagram, Mermaid API change), the entire lesson page crashes.

**Fix:** Wrap in a React Error Boundary:
```tsx
// components/markdown/MarkdownErrorBoundary.tsx
import { Component } from 'react'
class MarkdownErrorBoundary extends Component { ... }

// In lesson page:
<MarkdownErrorBoundary>
  <MarkdownRenderer content={lesson.content} />
</MarkdownErrorBoundary>
```

---

### 🟡 IMPROVE-17 — `About` Page Metadata Uses Placeholder Text

**File:** `dictionaries/en.json`

**Severity:** 🟡 Medium — The about page metadata contains generic placeholder text.

**Evidence:**
```json
"about": {
  "title": "About Us - Your Company Name",  // ← "Your Company Name" is a placeholder
  "description": "Learn about our mission, values, and the team behind our success"
}
```

**Fix:**
```json
"about": {
  "title": "About Us - NUniversity",
  "description": "Learn about NUniversity's mission, values, and the team building accessible education for everyone."
}
```

---

### 🟡 IMPROVE-18 — Game Settings Change Does Not Reset the Timer

**File:** `app/[lang]/games/vocabulary/[slug]/vocabulary-game-client.tsx`

**Severity:** 🟡 Medium — The `numPairs` range slider triggers `initializeGame()` via `useEffect([game, numPairs])`, which resets the board. However, changing the slider mid-game (even with 5 pairs already matched) restarts the game without warning.

**Recommendation:** Either disable the slider once the game has started (i.e., when `matchedPairs.size > 0`), or add a confirmation prompt.

---

## 4. Low-Priority / Nice-to-Have

---

### 🟢 IMPROVE-19 — `tsconfig.json` Has `strict: false`

**File:** `tsconfig.json`

**Severity:** 🟢 Low — TypeScript's strict mode is disabled, allowing implicit `any`, loose null checks, and other common bug sources to go undetected.

```json
"strict": false,
"noImplicitAny": false,
"strictNullChecks": false,
```

**Recommendation:** Enable strict mode incrementally. Start with `"strictNullChecks": true` since it has the highest bug-detection value, and fix the resulting type errors.

---

### 🟢 IMPROVE-20 — No `robots.txt` Disallow for `/out/` Directory

**File:** `public/robots.txt`

**Severity:** 🟢 Low — Verify the `robots.txt` doesn't accidentally block important sections. Currently readable but unchecked. Confirm it correctly points to the sitemap and doesn't disallow `/_next/static/`.

---

### 🟢 IMPROVE-21 — `next-env.d.ts` Should Not Be Manually Edited

**File:** `next-env.d.ts`

**Severity:** 🟢 Low — This file is auto-generated by Next.js. Add a comment reminding contributors not to edit it manually, or add it to `.gitignore` alongside `.next/`.

---

### 🟢 IMPROVE-22 — Footer Links Point to `/{lang}/` Instead of Actual Pages

**File:** `components/layout/Footer.tsx`

**Severity:** 🟢 Low — Several footer links (Privacy Policy, Terms of Service, Cookies, Documentation, Blog, Community, Support) all point to `/${lang}/` (the homepage), indicating placeholder links.

**Evidence:**
```tsx
{ name: dict.footer.links.documentation, href: `/${lang}/` },
{ name: dict.footer.links.blog,          href: `/${lang}/` },
{ name: dict.footer.links.community,     href: `/${lang}/` },
{ name: dict.footer.links.support,       href: `/${lang}/` },
{ name: dict.footer.links.privacy,       href: `/${lang}/` },
{ name: dict.footer.links.terms,         href: `/${lang}/` },
{ name: dict.footer.links.cookies,       href: `/${lang}/` },
```

**Recommendation:** Either create the respective pages or remove the links until the pages are ready.

---

### 🟢 IMPROVE-23 — Vocabulary Game Cards Have No Maximum Height

**File:** `app/[lang]/games/vocabulary/[slug]/vocabulary-game-client.tsx`

**Severity:** 🟢 Low — Cards use `aspect-square` which works for short words, but long words (e.g., "Local de trabalho") overflow or break the layout. Consider using `min-h` + `auto` height instead of `aspect-square`, or truncating with an ellipsis.

---

### 🟢 IMPROVE-24 — `sharp` Dependency Installed But Images Are Unoptimized

**File:** `package.json`

**Severity:** 🟢 Low — `sharp` (a server-side image processing library) is listed as a dependency, but `images.unoptimized: true` in `nextjs.config.js` means it is never used in production.

**Recommendation:** Remove `sharp` from `dependencies` to reduce build time and node_modules size:
```bash
npm uninstall sharp
```

---

## 5. Security Considerations

---

### 🟠 SEC-01 — `rehype-raw` Enables Raw HTML in Markdown

**File:** `components/markdown/MarkdownRenderer.tsx`

**Severity:** 🟠 High (for user-generated content; Low for author-controlled content)

**Evidence:**
```tsx
rehypePlugins={[rehypeRaw]}  // Allows raw HTML tags in Markdown
```

**Assessment:** Since course content is **author-controlled** (committed to the Git repo by trusted contributors), this is an acceptable risk in the current model. However, if the platform ever allows user-submitted content, `rehype-raw` must be replaced with `rehype-sanitize` to prevent XSS attacks.

**Recommendation (defensive):** Add `rehype-sanitize` alongside `rehype-raw` as a precaution:
```tsx
import rehypeSanitize from 'rehype-sanitize'
rehypePlugins={[rehypeRaw, rehypeSanitize]}
```

---

### 🟡 SEC-02 — Mermaid Initialized With `securityLevel: 'loose'`

**File:** `components/markdown/MarkdownRenderer.tsx`

**Evidence:**
```ts
mermaidRef.current.initialize({
  securityLevel: 'loose',  // ← allows clickable links and HTML in diagrams
})
```

**Assessment:** `securityLevel: 'loose'` allows Mermaid diagrams to contain clickable links and HTML nodes. For author-controlled content this is acceptable, but note this setting explicitly disables Mermaid's built-in XSS protections.

**Recommendation:** Document this choice and monitor for Mermaid security advisories. Consider switching to `'antiscript'` which allows links but strips script injection.

---

### 🟢 SEC-03 — Formspree Endpoint May Be Hardcoded Without Rate Limiting

**File:** `components/contacts/ContactForm.tsx`

**Assessment:** Formspree provides rate limiting on their side. However, ensure the Formspree form endpoint is not exposed to spam bots by enabling Formspree's built-in honeypot or reCAPTCHA integration.

---

## 6. Performance Opportunities

---

### 🟠 PERF-01 — Library Thumbnails Load Without `loading="lazy"`

**File:** `app/[lang]/library/library-client.tsx`

**Evidence:**
```tsx
<img 
  src={resource.thumbnail} 
  alt={resource.title}
  className="w-full h-full object-cover ..."
  // ← No loading="lazy"
/>
```

**Impact:** All thumbnails load eagerly on page load, even those below the fold. With a large library (50+ resources), this generates many simultaneous HTTP requests.

**Fix:**
```tsx
<img loading="lazy" src={resource.thumbnail} alt={resource.title} ... />
```

---

### 🟡 PERF-02 — `getDictionary` Re-Imported in Every Component Without Caching

**File:** `lib/i18n/get-dictionary.ts`

**Assessment:** The dictionary is a synchronous in-memory operation (already imported at module load), so this is not a performance issue at runtime. However, the function could be marked `async` unnecessarily — it is currently synchronous despite returning a value directly. No change needed here.

---

### 🟡 PERF-03 — Vocabulary Game Re-Shuffles All Cards on Every `numPairs` Change

**File:** `app/[lang]/games/vocabulary/[slug]/vocabulary-game-client.tsx`

**Evidence:**
```ts
useEffect(() => {
  initializeGame()  // Full reset including re-shuffling ALL game.words
}, [game, numPairs])
```

**Assessment:** For large vocabulary sets (e.g., 300 words in `en-to-pt.json`), `[...game.words].sort(() => Math.random() - 0.5)` runs on every slider change. This is a minor cost at current scale but should be noted for very large datasets.

---

### 🟢 PERF-04 — Framer Motion Loaded on Every Game Page

**File:** `app/[lang]/games/vocabulary/[slug]/vocabulary-game-client.tsx`

**Assessment:** `framer-motion` is a large library (~50KB gzipped). It is used only for card animations in the vocabulary game. Consider lazy-loading it or replacing the animations with pure CSS transitions for this use case.

---

## 7. Summary Table

| ID | Severity | File | Issue |
|---|---|---|---|
| BUG-01 | 🔴 Critical | `contact/page.tsx` | Wrong metadata (uses home metadata) + dead imports |
| BUG-02 | 🔴 Critical | `vocabulary-game-client.tsx` | Game never completes — stale state race condition |
| BUG-03 | 🔴 Critical | `tools/[slug]/page.tsx` | `generateStaticParams` misses PT/ES tool pages → 404 |
| BUG-04 | 🔴 Critical | `courses-client.tsx` | Course link navigates to non-existent route when no lessons |
| ISSUE-05 | 🟠 High | Many files | `dict: any` disables TypeScript safety throughout |
| ISSUE-06 | 🟠 High | `vocabulary-game-client.tsx` | Extensive hardcoded English strings in game UI |
| ISSUE-07 | 🟠 High | `library-client.tsx` | `podcast` and `article` types missing from filter UI |
| ISSUE-08 | 🟠 High | `library-client.tsx` | Results count hardcoded in English |
| ISSUE-09 | 🟠 High | `courses-client.tsx` | Area course count hardcoded in English |
| ISSUE-10 | 🟠 High | `courses/[courseSlug]/[lessonSlug]/page.tsx` | Non-English locale pages 404 for English-only courses |
| SEC-01 | 🟠 High | `MarkdownRenderer.tsx` | `rehype-raw` enables raw HTML (XSS risk if user-content added) |
| IMPROVE-11 | 🟡 Medium | `EisenhowerMatrix.tsx` | Inline translation map duplicates dictionary system |
| IMPROVE-12 | 🟡 Medium | `tools/[slug]/page.tsx` | No loading state on dynamic tool imports |
| IMPROVE-13 | 🟡 Medium | `content/courses/mermaid-diagram/` | Missing `course.json` |
| IMPROVE-14 | 🟡 Medium | `contact/` | Stale `page copy.tsx` file in source tree |
| IMPROVE-16 | 🟡 Medium | Lesson page | No error boundary around `MarkdownRenderer` |
| IMPROVE-17 | 🟡 Medium | `dictionaries/en.json` | About page metadata has placeholder text |
| IMPROVE-18 | 🟡 Medium | `vocabulary-game-client.tsx` | Slider resets mid-game without warning |
| SEC-02 | 🟡 Medium | `MarkdownRenderer.tsx` | Mermaid `securityLevel: 'loose'` disables XSS protection |
| PERF-01 | 🟠 High | `library-client.tsx` | Library thumbnails missing `loading="lazy"` |
| PERF-03 | 🟡 Medium | `vocabulary-game-client.tsx` | Full word re-shuffle on every slider change |
| IMPROVE-19 | 🟢 Low | `tsconfig.json` | TypeScript `strict: false` allows silent bugs |
| IMPROVE-20 | 🟢 Low | `public/robots.txt` | Verify robots.txt doesn't block static assets |
| IMPROVE-22 | 🟢 Low | `Footer.tsx` | 7 footer links point to homepage (placeholders) |
| IMPROVE-23 | 🟢 Low | `vocabulary-game-client.tsx` | Long words overflow `aspect-square` card layout |
| IMPROVE-24 | 🟢 Low | `package.json` | `sharp` installed but unused (images are unoptimized) |

---

## Recommended Fix Priority

### Immediate (before next deploy)
1. **BUG-02** — Fix game completion race condition (1 line fix)
2. **BUG-01** — Fix contact page metadata and remove dead imports
3. **IMPROVE-14** — Delete `page copy.tsx`
4. **IMPROVE-17** — Fix placeholder text in about metadata
5. **PERF-01** — Add `loading="lazy"` to library thumbnails

### Short-term (next sprint)
6. **BUG-03** — Fix `generateStaticParams` for tools
7. **BUG-04** — Fix course cards with no lessons
8. **ISSUE-10** — Fix `generateStaticParams` for locale-fallback courses
9. **ISSUE-06** — Replace hardcoded game strings with dictionary lookups
10. **ISSUE-07** — Add `podcast` and `article` to library filter

### Medium-term (ongoing)
11. **ISSUE-05** — Replace `dict: any` with `Dictionary` type
12. **IMPROVE-11** — Migrate EisenhowerMatrix translations to dictionary
13. **IMPROVE-12** — Add loading states to dynamic tool imports
14. **IMPROVE-13** — Create `course.json` for `mermaid-diagram`
15. **IMPROVE-16** — Add Error Boundary around `MarkdownRenderer`
16. **ISSUE-08 / ISSUE-09** — Fix remaining hardcoded strings
17. **IMPROVE-24** — Remove unused `sharp` dependency
