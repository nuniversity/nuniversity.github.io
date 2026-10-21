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
}

console.log('')
if (failures.length) {
  console.error(`verify_out: ${failures.length} failure(s)`)
  process.exit(1)
}
console.log(`verify_out: all checks passed${coreOnly ? ' (core)' : ''}`)
