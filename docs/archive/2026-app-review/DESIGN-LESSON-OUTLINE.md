> **HISTORICAL — superseded.** Kept for decision provenance only. Do not follow as current guidance. See `docs/INDEX.md`.

# Design — Lesson Outline (from retired `lesson-client.tsx`)

The original `app/[lang]/courses/[courseSlug]/[lessonSlug]/lesson-client.tsx` (281 lines)
was never imported — the entire file was commented out. It was deleted under F-081.
This document preserves the non-trivial design intent so Phase 6 (lesson outline &
navigation) can resurrect it deliberately rather than rediscovering it.

---

## 1. Component hierarchy

```
LessonClient (client component)
├── Mobile Header (lg:hidden, sticky top-0 z-40)
│   ├── Menu/X toggle button (aria-label="Toggle menu")
│   ├── Truncated lesson title (flex-1, centered via spacer)
│   └── Fixed-width spacer for optical centering
├── Sidebar <aside> (fixed on mobile, sticky on desktop)
│   ├── Course Header block
│   │   ├── "Back to Courses" link (ChevronLeft + dict.courses.back_to_courses)
│   │   └── Gradient course icon (BookOpen, blue-600 → purple-600) + course title
│   ├── Course Metadata rows (User/author, BarChart/difficulty, Clock/duration)
│   └── Lessons List <nav>
│       └── Per-lesson Link: zero-padded index (01, 02…) + title, active state
├── Mobile Overlay (bg-black/50, closes sidebar on click)
└── Main Content <main>
    ├── <article> (max-w-4xl, prose prose-lg dark:prose-invert)
    │   ├── Lesson Header (h1 title, description, metadata row, <hr>)
    │   ├── MarkdownRenderer content area
    │   └── Navigation Footer
    │       ├── Prev lesson card (bordered, group-hover translate)
    │       └── Next lesson card (primary bg) or "Back to Courses" fallback
```

## 2. Sidebar / drawer structure worth revisiting

- **Dual-mode sidebar**: one `<aside>` serves both breakpoints —
  `fixed lg:sticky top-0 left-0 z-30 h-screen w-80`, toggled with
  `translate-x-0` / `-translate-x-full lg:translate-x-0` and a
  `transition-transform duration-300 ease-in-out`. Desktop never hides it;
  mobile treats it as an off-canvas drawer.
- **Drawer state**: single `sidebarOpen` boolean; every in-drawer link's
  `onClick` closes the drawer; a full-screen overlay (below the sidebar z-index,
  above content) closes it on outside click.
- **Course identity at the top of the sidebar**: back-link, gradient icon tile,
  course title, then author/difficulty/duration rows — so the learner always
  knows where they are without scrolling the lesson list.
- **Numbered syllabus**: lessons rendered as a `<nav>` of links with
  `String(index + 1).padStart(2, '0')` prefixes; the active lesson gets
  `bg-primary text-primary-foreground font-medium`, others `hover:bg-muted`.
  Titles use `line-clamp-2` to keep the 320px-wide rail stable.
- **Prev/next computation**: `allLessons.findIndex` → prev/next; edge cases
  degrade gracefully (missing side renders a spacer `<div />`; next-at-end
  falls back to a "Back to Courses" bordered card).

## 3. Styling patterns worth revisiting

- Difficulty color mapping keyed on localized strings
  (`beginner|iniciante|principiante` → green, `intermediate|intermediário|intermedio`
  → yellow, `advanced|avançado|avanzado` → red, default gray) — all with
  `dark:` variants; this i18n-aware difficulty palette should survive any rewrite.
- Lesson metadata chips (author/duration/difficulty) appear **twice**: once in the
  sidebar (course-level) and once in the article header (lesson-level), both as
  icon+text flex rows in `text-sm text-muted-foreground`.
- Navigation footer cards use the `group` + `group-hover:-translate-x-1` /
  `group-hover:translate-x-1` chevron nudge pattern; the next-card is emphasized
  with `bg-primary text-primary-foreground hover:opacity-90`.
- Content column: `max-w-4xl mx-auto px-6 py-8 lg:py-12` with
  `prose prose-lg dark:prose-invert max-w-none` around `MarkdownRenderer` —
  matches the site's Tailwind typography setup.
- Mobile header keeps a `w-9` spacer opposite the toggle so the truncated title
  stays optically centered.

## 4. i18n keys the design assumed

- `dict.courses.back_to_courses`, `dict.courses.course_content`
- `dict.common.by`, `dict.common.previous`, `dict.common.next`
- All with inline English fallbacks (`|| 'Back to Courses'` etc.) — a rewrite
  should source these from the dictionaries package instead.

## 5. Props contract (as designed)

```
lang, courseSlug, lessonSlug,
courseData (title, author, difficulty, duration),
lessonData (title, description, author, duration, difficulty, content),
allLessons: Array<{ slug, title, order }>,
dict
```

## 6. Phase 6 implementation notes

- The live lesson page currently renders without a sidebar/drawer; resurrect the
  structure above as the outline/navigation feature (see IMPROVEMENTS.md
  "Lesson outline & navigation": sticky sidebar + mobile drawer, in-page TOC,
  scroll progress, keyboard ←/→, reading time, feedback widget).
- Keep the dual-mode single-aside approach; add the TOC inside the sidebar below
  the lesson list or in a right rail — the original left rail is the syllabus,
  not a heading TOC, so the two are complementary.
- The original used `courseData: any` / `lessonData: any` — replace with the
  typed content schema from the courses content layer.
- Reuse the difficulty color map and prev/next logic verbatim where possible;
  they were the most finished parts of the design.
