import fs from 'node:fs'
import path from 'node:path'

const ORIGIN = 'https://nuniversity.github.io'
const OUT = path.join(process.cwd(), 'out')
const coreOnly = process.argv.includes('--core')
const failures = []

function ok(cond, label) {
  if (cond) {
    console.log(`  PASS ${label}`)
  } else {
    failures.push(label)
    console.log(`  FAIL ${label}`)
  }
}

function read(rel) {
  return fs.readFileSync(path.join(OUT, rel), 'utf8')
}

function exists(rel) {
  return fs.existsSync(path.join(OUT, rel))
}

if (!fs.existsSync(OUT)) {
  console.error('verify_out: out/ not found')
  process.exit(1)
}

console.log('verify_out — core invariants:')

ok(exists('index.html'), 'root index.html exists')
if (exists('index.html')) {
  ok(read('index.html').includes('/en/'), 'root index redirects to /en/')
}

ok(exists('404.html'), '404.html exists')
if (exists('404.html')) {
  const stub = read('404.html')
  ok(stub.includes('NEXT_LOCALE') && stub.includes('/404/?p='), '404 stub has locale + ?p= logic')
}

ok(exists('en/tools/index.html'), 'en/tools page exists')
if (exists('en/tools/index.html')) {
  ok(
    read('en/tools/index.html').includes(`<link rel="canonical" href="${ORIGIN}/en/tools/"/>`),
    'canonical en/tools = self URL'
  )
  const alternates = (read('en/tools/index.html').match(/rel="alternate"/g) || []).length
  ok(alternates === 4, `exactly 4 hreflang alternates on en/tools (found ${alternates})`)
}

ok(exists('es/about/index.html'), 'es/about page exists')
if (exists('es/about/index.html')) {
  ok(
    read('es/about/index.html').includes(`<link rel="canonical" href="${ORIGIN}/es/about/"/>`),
    'canonical es/about = self URL'
  )
}

let lessonSample = null
if (exists('en/courses')) {
  outer: for (const course of fs.readdirSync(path.join(OUT, 'en', 'courses'))) {
    const courseDir = path.join(OUT, 'en', 'courses', course)
    if (!fs.statSync(courseDir).isDirectory()) continue
    for (const entry of fs.readdirSync(courseDir)) {
      const lessonDir = path.join(courseDir, entry)
      if (entry.endsWith('.html') || !fs.statSync(lessonDir).isDirectory()) continue
      if (fs.existsSync(path.join(lessonDir, 'index.html'))) {
        lessonSample = `en/courses/${course}/${entry}/index.html`
        break outer
      }
    }
  }
}
ok(lessonSample !== null, 'a lesson page exists to sample')
if (lessonSample) {
  const route = '/' + lessonSample.replace('/index.html', '').split(path.sep).join('/')
  ok(read(lessonSample).includes(`<link rel="canonical" href="${ORIGIN}${route}/"/>`), 'canonical lesson = self URL')
}

ok(exists('robots.txt'), 'robots.txt exists')
if (exists('robots.txt')) {
  ok(read('robots.txt').includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'robots has Sitemap line')
}

ok(exists('sitemap.xml'), 'sitemap.xml exists')
if (exists('sitemap.xml')) {
  const sm = read('sitemap.xml')
  ok(sm.includes(`${ORIGIN}/en/tools/`), 'sitemap contains en/tools')
  ok(sm.includes(`${ORIGIN}/pt/`), 'sitemap contains pt root')
  ok(sm.includes(`${ORIGIN}/en/quizzes/`), 'sitemap contains en/quizzes hub')
  ok(sm.includes(`${ORIGIN}/en/quizzes/snowpro-core-cof-c03/`), 'sitemap contains quiz detail')
  ok(sm.includes(`${ORIGIN}/en/languages/`), 'sitemap contains en/languages hub')
  ok(sm.includes(`${ORIGIN}/en/languages/en-pt/en-to-pt/`), 'sitemap contains language activity')
  ok(!sm.includes('/games/vocabulary/'), 'sitemap has no legacy vocabulary URLs')
}

ok(exists('ads.txt'), 'ads.txt exists (lowercase)')
ok(!exists('Ads.txt'), 'Ads.txt removed')

ok(exists('og-image.png'), 'og-image.png exists')
if (exists('og-image.png')) {
  const buf = fs.readFileSync(path.join(OUT, 'og-image.png'))
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  ok(w === 1200 && h === 630, `og-image is 1200x630 (got ${w}x${h})`)
}

if (!coreOnly) {
  console.log('verify_out — extended invariants:')

  ok(exists('en/404/index.html') && exists('pt/404/index.html') && exists('es/404/index.html'), 'localized 404 routes exported')

  const locales = ['en', 'pt', 'es']
  let landings = 0
  let missingLandings = []
  for (const locale of locales) {
    const localeCourses = path.join(process.cwd(), 'content', 'courses')
    for (const course of fs.readdirSync(localeCourses)) {
      const enDir = path.join(localeCourses, course, 'en')
      const localeDir = path.join(localeCourses, course, locale)
      const targetDir = fs.existsSync(localeDir) ? localeDir : fs.existsSync(enDir) ? enDir : null
      if (!targetDir) continue
      const hasLessons = fs.readdirSync(targetDir).some((f) => f.endsWith('.md'))
      if (!hasLessons) continue
      if (exists(`${locale}/courses/${course}/index.html`)) landings++
      else missingLandings.push(`${locale}/courses/${course}`)
    }
  }
  ok(missingLandings.length === 0, `all course landings exported (${landings} found${missingLandings.length ? ', missing: ' + missingLandings.slice(0, 5).join(', ') : ''})`)

  const examB = 'en/courses/aws-dea-c01/16-exam-simulation-b/index.html'
  if (exists(examB)) {
    const html = read(examB)
    ok(!html.includes('"buckets": ['), 'exam-b: raw dragdrop JSON no longer rendered')
    ok(html.includes('BucketDrop') || html.includes('bucket') || !html.includes('```interactive'), 'exam-b: interactive blocks processed')
  } else {
    ok(false, 'exam-b lesson page exists')
  }

  console.log('  -- quizzes app --')
  const QUIZ_SLUG = 'snowpro-core-cof-c03'
  for (const loc of locales) {
    ok(exists(`${loc}/quizzes/index.html`), `${loc}/quizzes hub exported`)
    ok(exists(`${loc}/quizzes/${QUIZ_SLUG}/index.html`), `${loc}/quizzes detail exported`)
    const stubRel = `${loc}/games/quiz/${QUIZ_SLUG}/index.html`
    ok(exists(stubRel), `${loc}/games/quiz stub exported`)
    if (exists(stubRel)) {
      const stubHtml = read(stubRel)
      ok(stubHtml.includes('noindex'), `${loc} quiz stub has noindex`)
      ok(stubHtml.includes(`href="/${loc}/quizzes/${QUIZ_SLUG}/"`), `${loc} quiz stub links to new URL`)
    }
  }
  if (exists('en/games/index.html')) {
    const gamesHub = read('en/games/index.html')
    ok(!gamesHub.includes('/en/games/quiz/'), 'games hub has no quiz card links')
    ok(!gamesHub.toLowerCase().includes('snowpro'), 'games hub has no snowpro card')
    ok(!gamesHub.includes('/en/games/vocabulary/'), 'games hub has no vocabulary card links')
    ok(gamesHub.includes('/en/languages/'), 'games hub cross-links to languages hub')
  } else {
    ok(false, 'games hub exists')
  }

  console.log('  -- languages app --')
  const LANG_PAIR = 'en-pt'
  const LANG_SLUG = 'en-to-pt'
  for (const loc of locales) {
    ok(exists(`${loc}/languages/index.html`), `${loc}/languages hub exported`)
    ok(exists(`${loc}/languages/${LANG_PAIR}/index.html`), `${loc}/languages pair exported`)
    ok(exists(`${loc}/languages/${LANG_PAIR}/${LANG_SLUG}/index.html`), `${loc}/languages player exported`)
    const stubRel = `${loc}/games/vocabulary/${LANG_SLUG}/index.html`
    ok(exists(stubRel), `${loc} vocabulary stub exported`)
    if (exists(stubRel)) {
      const stubHtml = read(stubRel)
      ok(stubHtml.includes('noindex'), `${loc} language stub has noindex`)
      ok(stubHtml.includes(`href="/${loc}/languages/${LANG_PAIR}/${LANG_SLUG}/"`), `${loc} language stub links to new URL`)
    }
  }
  let languageActivityCount = 0
  if (exists('en/languages')) {
    const countPlayers = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) countPlayers(full)
        else if (entry.name === 'index.html' && path.dirname(full) !== path.join(OUT, 'en', 'languages')) {
          const rel = path.relative(path.join(OUT, 'en', 'languages'), full).split(path.sep).join('/')
          if (rel.split('/').length === 3) languageActivityCount++
        }
      }
    }
    countPlayers(path.join(OUT, 'en', 'languages'))
  }
  ok(languageActivityCount === 5, `5 language players exported under en/languages (found ${languageActivityCount})`)
  const examLessonEn = 'en/courses/aws-clf-c02/15-exam-simulation-a/index.html'
  const examLessonPt = 'pt/courses/aws-clf-c02/15-exam-simulation-a/index.html'
  if (exists(examLessonEn)) {
    ok(read(examLessonEn).includes('Start Exam'), 'exam lesson EN renders Start Exam callout')
  } else {
    ok(false, 'exam lesson EN page exists')
  }
  if (exists(examLessonPt)) {
    ok(read(examLessonPt).includes('Iniciar Exame'), 'exam lesson PT renders localized callout')
  } else {
    ok(false, 'exam lesson PT page exists')
  }

  console.log('  -- search --')
  const searchCounts = {}
  for (const loc of locales) {
    const rel = `search-index/${loc}.json`
    ok(exists(rel), `${loc} search index exported`)
    if (exists(rel)) {
      let count = -1
      try {
        count = JSON.parse(read(rel)).length
      } catch {
        count = -1
      }
      ok(count > 400 && count < 900, `${loc} search index size within 400-900 (got ${count})`)
      searchCounts[loc] = count
    }
  }
  ok(searchCounts.pt !== searchCounts.en, 'pt search index differs from en')
  if (exists('search-index/en.json') && exists('search-index/pt.json') && exists('search-index/es.json')) {
    try {
      const titles = (loc) => JSON.parse(read(`search-index/${loc}.json`)).map((d) => d.title)
      const enTitles = new Set(titles('en'))
      const ptOnly = titles('pt').filter((t) => !enTitles.has(t)).length
      const esOnly = titles('es').filter((t) => !enTitles.has(t)).length
      ok(ptOnly > 0 && esOnly > 0, `pt/es index titles localized vs en (pt-only ${ptOnly}, es-only ${esOnly})`)
    } catch {
      ok(false, 'pt/es index titles localized vs en')
    }
  } else {
    ok(false, 'all 3 search indexes exist for title sample')
  }
  if (exists('en/index.html')) {
    const home = read('en/index.html')
    ok(
      home.includes('search-trigger') && home.includes('aria-label="Search"'),
      'EN header search trigger (data-testid + aria-label)'
    )
    ok(home.includes('⌘K'), 'EN header shows ⌘K shortcut')
  } else {
    ok(false, 'en home exists')
  }

  console.log('  -- post-sanitize lesson html (W6) --')
  const katexPage = 'en/courses/aws-aif-c01/04-ml-algorithms-evaluation/index.html'
  const detailsPage = 'en/courses/processes-flowchart/01-what-are-processes/index.html'
  const citePage = 'en/courses/dbt-redshift-advanced/11-dbt-fusion-engine-and-dbt-wizard/index.html'
  if (exists(katexPage)) {
    const katexHtml = read(katexPage)
    const katexCount = (katexHtml.match(/class="katex"/g) || []).length
    ok(katexCount >= 20, `KaTeX rendered after sanitization (${katexCount} nodes)`)
    ok(
      /<h2 id="[^"]+"/.test(katexHtml) && katexHtml.includes('scroll-mt-24'),
      'heading ids + scroll-mt-24 survive sanitization'
    )
  } else {
    ok(false, 'katex probe lesson exists')
  }
  const calloutPage = 'en/courses/agent-memory-knowledge/01-foundations-of-agent-memory/index.html'
  if (exists(calloutPage)) {
    ok(read(calloutPage).includes('class="callout callout-'), 'callout classes survive sanitization')
  } else {
    ok(false, 'callout probe lesson exists')
  }
  if (exists(detailsPage)) {
    const detailsHtml = read(detailsPage)
    ok(detailsHtml.includes('<details') && detailsHtml.includes('<summary'), 'details/summary preserved after sanitization')
  } else {
    ok(false, 'details probe lesson exists')
  }
  if (exists(citePage)) {
    ok(read(citePage).includes('<cite index='), 'cite index attribute preserved after sanitization')
  } else {
    ok(false, 'cite probe lesson exists')
  }
  const sanitizePages = [katexPage, detailsPage, citePage, 'en/index.html'].filter((p) => exists(p))
  const dirtyPages = sanitizePages.filter((p) => {
    const html = read(p)
    return /<[a-z][^>]*\sonerror=/i.test(html) || /<a [^>]*href="javascript:/i.test(html)
  })
  ok(
    dirtyPages.length === 0,
    `no onerror= or javascript: hrefs on probe pages (${sanitizePages.length} checked${dirtyPages.length ? ': ' + dirtyPages.join(', ') : ''})`
  )

  console.log('  -- certificates + footer (W7/D64) --')
  for (const loc of locales) {
    const certRel = `${loc}/quizzes/certificates/index.html`
    ok(
      exists(certRel) &&
        read(certRel).includes(`<link rel="canonical" href="${ORIGIN}/${loc}/quizzes/certificates/"/>`),
      `${loc} certificates route exported with self canonical`
    )
  }
  if (exists('en/quizzes/index.html')) {
    const hub = read('en/quizzes/index.html')
    ok(
      hub.includes('certificates-link') && hub.includes('href="/en/quizzes/certificates/'),
      'quizzes hub links to certificates'
    )
  } else {
    ok(false, 'en quizzes hub exists')
  }
  if (exists('sitemap.xml')) {
    const sm = read('sitemap.xml')
    ok(
      locales.every((l) => sm.includes(`${ORIGIN}/${l}/quizzes/certificates/`)),
      'sitemap lists certificates route for all locales'
    )
  }
  const chunkFiles = []
  const chunksDir = path.join(OUT, '_next', 'static', 'chunks')
  const scanChunks = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) scanChunks(full)
      else if (entry.name.endsWith('.js')) chunkFiles.push(full)
    }
  }
  if (fs.existsSync(chunksDir)) scanChunks(chunksDir)
  const hasBadgeString = chunkFiles.some((f) => fs.readFileSync(f, 'utf8').includes('Badge earned:'))
  const hasLevelString = chunkFiles.some((f) =>
    fs.readFileSync(f, 'utf8').includes('Level up! You reached level')
  )
  ok(hasBadgeString, 'Badge earned: template ships in client bundle')
  ok(hasLevelString, 'level-up template ships in client bundle')
  if (exists('en/index.html')) {
    const footerMatch = read('en/index.html').match(/<footer[\s\S]*?<\/footer>/)
    ok(!!footerMatch, 'en home has a footer element')
    if (footerMatch) {
      ok(footerMatch[0].includes('/en/roadmaps'), 'footer links to Roadmaps (D64)')
      ok(footerMatch[0].includes('/en/languages'), 'footer links to Languages (D64)')
    } else {
      ok(false, 'footer links to Roadmaps (D64)')
      ok(false, 'footer links to Languages (D64)')
    }
  }

  console.log('  -- i18n leak audit (pt/es chrome strings) --')
  const LEAK_STRINGS = [
    'Nuniversity - Learn, Code, and Grow',
    'Games - Learn While Playing',
    'Search games...',
    'No games found matching your search',
    'No games available yet',
    'Back to Games',
    "You've completed the game!",
    'Master new skills through interactive games and challenges',
    'Try another mode or category.',
    'Reset all progress?',
    'Type your answer here...',
    'Download Answers',
    'Powerful tools to enhance your learning',
    'Search tools...',
    'No tools found matching your search',
    'No tools available yet',
    'View All Tools',
    'Try a different search term',
    'Check back soon for new tools',
    'Clear Search',
    'Check Answers',
    'All correct!',
    'Sort into Buckets',
    'Items — click an item, then click a bucket to place it:',
    'Ordering Question',
    'red items are in the wrong position',
    'Word Bank',
    'Search quizzes...',
    'Start Exam',
    'Back to Quizzes',
    'This quiz has moved — continue to the Quizzes section',
    'Quizzes — Tests & Certification Practice',
    'Language Practice — Flashcards',
    'Learn languages through flashcards and translation quizzes',
    'Translation Quiz',
    'Search language activities...',
    'No activities match your search',
    'Back to Languages',
    'This activity has moved — continue to the Languages section',
    'Language courses',
    'Coming soon — new language tracks are on the way.',
    'Best score:',
    'Not attempted',
    'Number of pairs:',
    'My certificates',
    'No certificates yet',
    'Certifications earned by passing mock exams',
    'Badge earned:',
    'Level up! You reached level',
    'Enter your name to issue the certificate',
  ]
  const LEAK_WAIVERS = []
  const LESSON_BODY_RE = /^\/(pt|es)\/courses\/[^/]+\/[^/]+\/index\.html$/
  const LEAK_SLUG_RE = />\s*(beginner|intermediate|advanced)\s*</i
  const stripForSlugProbe = (html) =>
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
      .replace(/<code[\s\S]*?<\/code>/gi, ' ')
      .replace(/<span class="token[^"]*"[\s\S]*?<\/span>/gi, ' ')
  const leakHits = []
  for (const loc of ['pt', 'es']) {
    const root = path.join(OUT, loc)
    if (!fs.existsSync(root)) {
      ok(false, `${loc}/ output exists for leak audit`)
      continue
    }
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.html')) {
          const rel = '/' + path.relative(OUT, full).split(path.sep).join('/')
          if (LEAK_WAIVERS.some((w) => rel.includes(w))) continue
          const raw = fs.readFileSync(full, 'utf8').replace(/\\u0027/g, "'")
          for (const s of LEAK_STRINGS) {
            const needle = s.replace(' →', '')
            if (raw.includes(needle)) leakHits.push(`${loc} ${rel} :: ${s}`)
          }
          if (!LESSON_BODY_RE.test(rel)) {
            const slugProbe = stripForSlugProbe(raw)
            const m = slugProbe.match(LEAK_SLUG_RE)
            if (m) leakHits.push(`${loc} ${rel} :: raw difficulty slug >${m[1]}<`)
          }
        }
      }
    }
    walk(root)
  }
  ok(leakHits.length === 0, `no EN chrome leaks in pt/es (${LEAK_STRINGS.length + 1} probes${leakHits.length ? ', hits: ' + leakHits.slice(0, 8).join(' | ') : ''})`)
}

console.log('')
if (failures.length) {
  console.error(`verify_out: ${failures.length} failure(s)`)
  process.exit(1)
}
console.log(`verify_out: all checks passed${coreOnly ? ' (core)' : ''}`)
