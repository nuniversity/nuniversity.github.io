import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const LOCALES = ['en', 'pt', 'es']
const OUT_DIR = path.join(ROOT, 'public', 'search-index')

let skipped = 0

const excerpt = body =>
  String(body || '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

const readJson = file => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    skipped += 1
    console.error(`search-index: skipped ${file}: ${error.message}`)
    return null
  }
}

const readMatter = file => {
  try {
    return matter(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    skipped += 1
    console.error(`search-index: skipped ${file}: ${error.message}`)
    return null
  }
}

const indexes = Object.fromEntries(LOCALES.map(lang => [lang, []]))

const push = (lang, type, title, description, url, text, key, courseSlug) => {
  const entry = { id: `${lang}:${type}:${key || url}`, type, title, description, url }
  if (text) entry.text = text
  if (courseSlug) entry.courseSlug = courseSlug
  indexes[lang].push(entry)
}

const listDirs = dir =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(name => fs.statSync(path.join(dir, name)).isDirectory())
    : []

const listFiles = (dir, ext) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(name => name.endsWith(ext)).sort()
    : []

const localize = (data, lang, keys = ['title', 'description']) => {
  const loc = data?.locales?.[lang] || {}
  const out = { ...data }
  for (const key of keys) {
    if (loc[key]) out[key] = loc[key]
  }
  return out
}

const coursesDir = path.join(ROOT, 'content', 'courses')
for (const slug of listDirs(coursesDir)) {
  const courseDir = path.join(coursesDir, slug)
  const meta = readJson(path.join(courseDir, 'course.json'))
  if (!meta) continue
  for (const lang of LOCALES) {
    const localeDir = path.join(courseDir, lang)
    const targetDir = fs.existsSync(localeDir) ? localeDir : path.join(courseDir, 'en')
    if (!fs.existsSync(targetDir)) continue
    const loc = meta[lang] || meta.en || meta
    const fallbackTitle = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    push(lang, 'course', loc.title || fallbackTitle, loc.description || 'Course description', `/${lang}/courses/${slug}/`, undefined, undefined, slug)
    for (const file of listFiles(targetDir, '.md')) {
      const parsed = readMatter(path.join(targetDir, file))
      if (!parsed) continue
      const stem = file.replace(/\.md$/, '')
      const body = excerpt(parsed.content)
      push(
        lang,
        'lesson',
        parsed.data.title || stem,
        parsed.data.description || body,
        `/${lang}/courses/${slug}/${stem}/`,
        body,
        undefined,
        slug
      )
    }
  }
}

const toolsDir = path.join(ROOT, 'content', 'tools')
for (const slug of listDirs(toolsDir)) {
  for (const lang of LOCALES) {
    const localePath = path.join(toolsDir, slug, `${lang}.md`)
    const filePath = fs.existsSync(localePath)
      ? localePath
      : path.join(toolsDir, slug, 'en.md')
    if (!fs.existsSync(filePath)) continue
    const parsed = readMatter(filePath)
    if (!parsed) continue
    push(lang, 'tool', parsed.data.title || slug, parsed.data.description || '', `/${lang}/tools/${slug}/`)
  }
}

const gamesDir = path.join(ROOT, 'content', 'games')
for (const category of listDirs(gamesDir)) {
  for (const file of listFiles(path.join(gamesDir, category), '.json')) {
    const data = readJson(path.join(gamesDir, category, file))
    if (!data) continue
    const slug = data.id || file.replace(/\.json$/, '')
    for (const lang of LOCALES) {
      const loc = localize(data, lang)
      push(lang, 'game', loc.title || slug, loc.description || '', `/${lang}/games/${category}/${slug}/`)
    }
  }
}

const quizzesDir = path.join(ROOT, 'content', 'quizzes')
for (const file of listFiles(quizzesDir, '.json')) {
  const data = readJson(path.join(quizzesDir, file))
  if (!data) continue
  const slug = data.slug || file.replace(/\.json$/, '')
  for (const lang of LOCALES) {
    const loc = localize(data, lang)
    push(lang, 'quiz', loc.title || slug, loc.description || '', `/${lang}/quizzes/${slug}/`)
  }
}

const roadmapsDir = path.join(ROOT, 'content', 'roadmaps')
for (const id of listDirs(roadmapsDir)) {
  for (const lang of LOCALES) {
    const localePath = path.join(roadmapsDir, id, `${lang}.md`)
    const filePath = fs.existsSync(localePath) ? localePath : path.join(roadmapsDir, id, 'en.md')
    if (!fs.existsSync(filePath)) continue
    const parsed = readMatter(filePath)
    if (!parsed) continue
    const roadmapId = parsed.data.id || id
    push(lang, 'roadmap', parsed.data.title || roadmapId, parsed.data.description || '', `/${lang}/roadmaps/${roadmapId}/`)
  }
}

for (const lang of LOCALES) {
  const langDir = path.join(ROOT, 'content', 'library', lang)
  const targetDir = fs.existsSync(langDir) ? langDir : path.join(ROOT, 'content', 'library', 'en')
  if (!fs.existsSync(targetDir)) continue
  for (const type of listDirs(targetDir)) {
    for (const file of listFiles(path.join(targetDir, type), '.md')) {
      const parsed = readMatter(path.join(targetDir, type, file))
      if (!parsed) continue
      const url = String(parsed.data.url || '')
      if (!/^https?:\/\//i.test(url)) continue
      const id = parsed.data.id || file.replace(/\.md$/, '')
      push(
        lang,
        'library',
        parsed.data.title || id,
        parsed.data.description || excerpt(parsed.content),
        url,
        excerpt(parsed.content),
        id
      )
    }
  }
}

const vocabDir = path.join(ROOT, 'content', 'languages', 'vocabulary')
for (const file of listFiles(vocabDir, '.json')) {
  const data = readJson(path.join(vocabDir, file))
  if (!data) continue
  const slug = data.id || file.replace(/\.json$/, '')
  const source = data.language_pair?.source
  const target = data.language_pair?.target
  if (!source || !target) continue
  for (const lang of LOCALES) {
    const loc = localize(data, lang)
    push(lang, 'language', loc.title || slug, loc.description || '', `/${lang}/languages/${source}-${target}/${slug}/`)
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })
for (const lang of LOCALES) {
  fs.writeFileSync(path.join(OUT_DIR, `${lang}.json`), `${JSON.stringify(indexes[lang])}\n`)
}

console.log(`search-index: ${LOCALES.map(lang => `${lang}=${indexes[lang].length}`).join(', ')}`)
if (skipped > 0) {
  console.error(`search-index: ${skipped} file(s) skipped`)
  process.exitCode = 1
}
