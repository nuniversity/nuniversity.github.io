# Nuniversity Platform Assessment — 27 Oct 2026 update

Oct 27, 2026 · @Leo

Your 26–27 Oct changes closed most of the earlier security, accessibility and bundle-size findings, but the pipeline does not ship them: CI runs `next build` instead of `npm run build`, and production was still serving the old build 18 minutes after your last push. 19 findings remain open (0 critical, 3 high, 12 medium, 4 low); 2 are P0.

## Fix order

1. **Make CI run the real build (R-01, R-10).** Change the workflow to `npm ci` then `npm run build` on Node 22. Then open the Actions run for the latest commit to see why production is stale (R-02). About 1 hour.
2. **Check the published size (R-03).** The site is 937 MB against GitHub's 1 GB limit. If the last deploy failed on size, this moves to P0.
3. **Fix the quiz-widget hydration error (R-04).** One pattern, three components, about 300 lesson pages. About 2 hours.
4. **Tighten the Content-Security-Policy (R-05, R-06).** Allow the video hosts the new embed needs, drop `unsafe-eval`, and keep one copy of the policy.
5. **Fix contrast and unnamed controls (R-08, R-09).** One colour token causes 262 of the 674 contrast failures. About 2 hours.
6. **Plan the quarter's work.** Dictionary split, per-page hreflang, dependency upgrades, Formspree-side bot protection (R-07, R-11 to R-15).

## Open findings

Priority: P0 blocks shipping this week, P1 next two weeks, P2 this quarter, P3 backlog. Severity: High affects users or deploys now, Medium degrades quality or defence in depth, Low is hygiene. Every row was checked against the code at commit `b0fc298` (27 Oct, 11:17 Sydney time); "measured" means I ran it.

| ID | Finding | Severity | Priority | Evidence | Fix (effort) |
| --- | --- | --- | --- | --- | --- |
| R-01 | CI deploys with `next build`, so the postbuild, CSS and CSP gates never run | High | P0 | The workflow runs `next build` (nextjs.yml lines 80–82). In a CI-identical build, all 1,630 inner pages keep the home canonical `/en/` and `404.html` is Next's default page. The search index exists only because a unit test writes it before the build. Run by hand, all three gates pass. | Build step becomes `npm run build`; generate the search index explicitly (0.5 h) |
| R-02 | Production still serves the 26 Oct build | High | P0 | Live fetch 18 minutes after the last push: no skip link, no hero search, "NEW" badges and the Stay Updated section still present. All four are removed in the latest commit. I could not read the Actions log. | Open the Actions run for the latest commit; fix and redeploy if it failed (0.5 h) |
| R-03 | Published site is 937 MB against GitHub's 1 GB limit | High | P1 | Measured: 778 MB yesterday, 937 MB now (HTML 501 to 591 MB, RSC payloads 252 to 324 MB; 283 MB gzipped). Each lesson carries its text in the HTML, again in inline flight data, and again in a `.txt` file. [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): 1 GB site size, 10-minute deploy timeout. Cause of the jump not isolated. | Stop serialising the read-aloud text as a prop; bisect the growth; set a per-page payload budget (4–8 h). P0 if R-02 is a size rejection |
| R-04 | Hydration mismatch on lessons with Matching, BucketDrop or DragOrder widgets | Medium | P1 | `Math.random()` shuffles run during render, so server and client HTML differ. Measured: React error #425 on `/en/courses/aws-clf-c02/05-shared-responsibility/` in the production build; the dev log says the server HTML was replaced with client content. 294 lessons use these widgets (81 en, 132 pt, 81 es). | Render in fixed order, shuffle in `useEffect` after mount (2 h) |
| R-05 | CSP is enforced but weak: `unsafe-inline`, `unsafe-eval`, any HTTPS image | Medium | P1 | Measured in Chromium: foreign scripts, frames and fetches are blocked, but an injected inline script ran, `eval()` worked, and `img-src https:` allows image-beacon exfiltration. A code comment says `unsafe-eval` exists for the dev overlay. | Remove `unsafe-eval` after smoke-testing Mermaid, 3Dmol and plots; hash the inline bootstrap scripts in postbuild; narrow `img-src` (4–6 h) |
| R-06 | CSP blocks the new video embeds | Medium | P1 | `frame-src` lists only PhET. Measured: Chromium blocks YouTube and Vimeo frames. No lesson uses video yet, so this is latent. The policy is copied by hand into `layout.tsx`, `postbuild.mjs` and `_headers` (inert on GitHub Pages). The link renderer also returns a `<figure>` inside a `<p>` for bare video links. | One shared policy module; add the video hosts; assert them in `verify-csp` (2 h) |
| R-07 | Contact form bot protection is client-side only | Medium | P2 | The honeypot and submit throttle live in `Contact.tsx`. The Formspree form ID is public, so direct POSTs bypass both. | Enable Formspree CAPTCHA and a domain allow-list (1–2 h) |
| R-08 | A text colour token fails WCAG AA contrast | Medium | P1 | Measured with axe: 674 failing nodes across 17 of 24 page and theme scans, almost all light mode. `--foreground-muted` `#65758b` on `#f1f5f9` is 4.29:1 (262 nodes). Footer muted text on `#0f1729` is 3.81:1. Teal `#119c8c` is 3.41:1 and orange `#f5600a` 3.2:1 on white. | Darken the token to `#5a6a80` (5.03:1); footer text to `#94a3b8` (6.97:1); accents to `#0f766e` and `#c2410c` (2 h) |
| R-09 | Unnamed controls and an unfocusable scroll area | Medium | P1 | Measured with axe, critical: 4 icon buttons on the SWOT tool and 1 select on Library have no accessible name. `.katex-display` on lessons scrolls but cannot take focus. | `aria-label` on the controls; `tabindex="0"` on KaTeX blocks (1 h) |
| R-10 | CI environment drifts from the project | Medium | P1 | CI uses Node 20; `package.json` requires `>=22 <23` and `.node-version` is 22.20. Actions are pinned by tag, not commit SHA. No `npm audit` step, no Dependabot. | Node 22; pin actions; add Dependabot and an audit step (1 h) |
| R-11 | 23 npm advisories (4 critical, 7 high) | Medium | P2 | Same lockfile as yesterday; 25 then, 23 now as the advisory feed moved. By my triage none is exploitable in the static artifact, but `prismjs` and `katex` do ship to browsers and the `next` fix is a major upgrade. I triaged from advisory text and how the code uses each package, not by exploit attempts. | Upgrade Next, `katex`, `react-syntax-highlighter`, `vitest`; re-run `npm audit` (4 h) |
| R-12 | Whole dictionaries are bundled into pages | Medium | P2 | `get-dictionary.ts` statically imports all three dictionaries (196 KB combined, 62 KB English). The home page HTML is 267 KB. | Load dictionaries per namespace (6 h) |
| R-13 | hreflang points at locale homepages on every page | Medium | P2 | Measured: a lesson page declares `en`, `pt`, `es` alternates as `/en/`, `/pt/`, `/es/`, not its own translations. The canonical fix works only through the postbuild step (R-01). | Per-page `generateMetadata` alternates and canonical (4 h) |
| R-14 | Lesson pages download 2.19 MB of JavaScript | Medium | P2 | Measured in Playwright on one lesson with diagrams: 23 files, 2.19 MB uncompressed after idle. Four chunks are 508 to 651 KB; I did not attribute them. | Attribute the chunks; load Mermaid, KaTeX and 3Dmol only on lessons that use them (4 h) |
| R-15 | Lesson-level content checks waived for most pairs | Medium | P2 | `GATE-WAIVERS.md`: 110 of 138 course and locale pairs are exempt from lesson validation. Spanish has 406 lesson files against 436 English and 456 Portuguese. | Retire waivers course by course; add a parity gate (ongoing) |
| R-16 | KaTeX strict-mode warnings in the build | Low | P3 | Measured: 2,657 warnings, mostly em and en dashes inside math and `%` comments at the end of a formula. | Fix in content or add a prose-lint rule (2 h) |
| R-17 | Dead `middleware.ts` | Low | P3 | 76 lines that never run on a static export; the build prints a warning and a 26.7 kB middleware entry. Locale redirect logic exists in three places. | Delete it and keep one redirect (1 h) |
| R-18 | Repository hygiene gaps | Low | P3 | No LICENSE, SECURITY.md, CODEOWNERS or Dependabot config. `daisyui` is still in `package.json` though the plugin is gone. `ads.txt` names an AdSense ID with no ad code, consent banner or CSP allowance. | Add the files; remove the dependency; decide on ads (1 h) |
| R-19 | The in-repo audit documents contradict each other | Low | P3 | The audit README says work paused after Phase 1; its status section lists Phases 4 and 5 as landed; it cites 1,253 passing tests where the suite now has 1,329. | Update the status section with the next change (0.5 h) |

## Confirmed fixed since the 26 Oct baseline

These were open in the baseline commit (`1006edd`) and are closed in the code now.

| Area | What changed | How I verified |
| --- | --- | --- |
| Bundle size | Prism's 277 grammars replaced by 19 registered languages (`PrismLight`); the 1.2 MB chunk is gone | Build output: largest chunk 635 KB, was 1,175 KB |
| CSP | A Content-Security-Policy ships on every page, with a verification script | `verify-csp` passes on 1,633 pages; Chromium blocks foreign script, frame and fetch |
| Embeds | PDB ids validated (4 characters, 8 MB cap, abortable fetch); PhET slug and language validated and the iframe sandboxed | Source review |
| Browser storage | One `safe-storage` module replaces five copies; theme value validated; certificate name capped at 120 characters, debounced and removable | Source review; tests pass |
| Cookie | `NEXT_LOCALE` gets `SameSite=Lax`, plus `Secure` on HTTPS | Source review |
| Contact form | Honeypot, submit throttle and length limits added (see R-07 for what remains) | Source review |
| Newsletter | The mock "subscribe" form that sent nothing is parked | Source: commented out of the home page |
| Accessibility | Skip link, `aria-current` on the active nav item, command palette as a modal dialog, "NEW" badges removed | Chromium: first Tab lands on the skip link at 8 px from the top-left; `role=dialog` with `aria-modal=true`; 0 badges in the header |
| Layout | No horizontal overflow at 375 px | Chromium on 10 pages (8 English, plus the Portuguese and Spanish homes) |
| Error pages | `error.tsx` and `not-found.tsx` added to the locale route | Source review; the 404 stub still depends on R-01 |
| Quality gates | Type-check and lint clean; 1,329 tests pass; `verify-css` resolves 382 classes | Ran each |

## Before and after

Both columns were produced the same way: a production build with the CI command, then measured. Lesson JavaScript fell by a third, but the published size grew by a fifth.

| Measure | 26 Oct (`1006edd`) | 27 Oct (`b0fc298`) |
| --- | --- | --- |
| Lesson route first-load JS (Next, gzipped) | 604 kB | 397 kB |
| Home route first-load JS (Next, gzipped) | 144 kB | 110 kB |
| Largest JS chunk | 1,175 KB | 635 KB |
| Published output | 778 MB | 937 MB |
| Static pages generated | 1,633 | 1,633 |
| Tests passing | 1,252 | 1,329 |
| npm advisories | 25 | 23 |
| Inner-page canonical in a CI build | `/en/` (wrong) | `/en/` (wrong) |

## Method, limits and sources

I cloned [nuniversity/nuniversity.github.io](https://github.com/nuniversity/nuniversity.github.io) at `b0fc298`, built it with the exact CI command, then ran the repo's own postbuild, CSS and CSP scripts against the output. I served the static export locally and drove it in Chromium (Playwright) for CSP enforcement, hydration errors, mobile overflow and keyboard behaviour. I ran axe-core 4.10.2 (WCAG 2.0 to 2.2, levels A and AA) in light and dark mode on 12 pages, plus type-check, ESLint, the test suite and `npm audit`.

Limits:

- I could not read GitHub Actions logs, so the cause of R-02 is unconfirmed. Open the run for the latest commit to settle it.
- My sandbox cannot reach Google Fonts, so I replaced the font with a stub for builds only and reverted it. Font loading and layout shift were not assessed.
- The live site was checked by fetching pages, not response headers, and its `robots.txt` and sitemap were unreachable from my sandbox. Those two are judged from the build output.
- The contrast scan covers 12 pages, not all 1,633. Mermaid, 3Dmol and PhET were not exercised under the CSP, so R-05 needs that smoke test before `unsafe-eval` goes.
- Dependency risk (R-11) was judged from advisory text and code use, without exploit attempts.

Sources: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) (site size, deploy timeout); the [live home page](https://nuniversity.github.io/en/) fetched 27 Oct 00:35 UTC.
