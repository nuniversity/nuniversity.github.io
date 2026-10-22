// File structure for markdown courses:
// /content/courses/{course-slug}/{lang}/
// /content/courses/{course-slug}/course.json (metadata)
// Example:
// /content/courses/intro-to-programming/en/01-introduction.md
// /content/courses/intro-to-programming/en/02-variables.md
// /content/courses/intro-to-programming/pt/01-introduction.md
// /content/courses/intro-to-programming/course.json

// lib/courses/get-course-content.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'

export interface CourseMetadata {
  title: string
  description: string
  order: number
  duration?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  exam?: boolean
  examMinutes?: number
}

export interface CourseContent {
  metadata: CourseMetadata
  content: string
  slug: string
}

export interface CourseInfo {
  slug: string
  title: string
  description: string
  area: string
  author?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  icon?: string
  firstLessonSlug?: string
  lessonCount?: number
}

export interface CourseWithLessons {
  slug: string
  lessons: CourseContent[]
}


const COURSES_DIR = path.join(process.cwd(), 'content', 'courses')

const DIFFICULTY_ALIASES: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
  beginner: 'beginner',
  iniciante: 'beginner',
  principiante: 'beginner',
  intermediate: 'intermediate',
  'intermediário': 'intermediate',
  intermediario: 'intermediate',
  intermedio: 'intermediate',
  advanced: 'advanced',
  avanzado: 'advanced',
  'avançado': 'advanced',
}

function normalizeDifficulty(
  value?: string
): 'beginner' | 'intermediate' | 'advanced' | undefined {
  if (!value || typeof value !== 'string') return undefined
  return DIFFICULTY_ALIASES[value.trim().toLowerCase()] ?? 'beginner'
}


export async function getCourseContent(
  courseSlug: string,
  lessonSlug: string,
  locale: Locale
): Promise<CourseContent | null> {
  try {
    const filePath = path.join(
      COURSES_DIR,
      courseSlug,
      locale,
      `${lessonSlug}.md`
    )
    
    if (!fs.existsSync(filePath)) {
      // Fallback to default locale if translation not available
      if (locale !== 'en') {
        return getCourseContent(courseSlug, lessonSlug, 'en')
      }
      return null
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    const metadata = data as CourseMetadata
    if (metadata.difficulty) {
      metadata.difficulty = normalizeDifficulty(String(metadata.difficulty))
    }

    return {
      metadata,
      content,
      slug: lessonSlug,
    }
  } catch (error) {
    console.error(`Error reading course content: ${courseSlug}/${lessonSlug}`, error)
    return null
  }
}

export async function getAllLessons(
  courseSlug: string | null,
  locale: Locale
): Promise<CourseWithLessons[]> {
  try {
    if (!fs.existsSync(COURSES_DIR)) {
      return []
    }

    const courseDirs = fs.readdirSync(COURSES_DIR)
    const result: CourseWithLessons[] = []

    for (const dir of courseDirs) {
      // Skip if looking for specific course and this isn't it
      if (courseSlug && dir !== courseSlug) continue

      const coursePath = path.join(COURSES_DIR, dir, locale)
      
      // Try fallback to English if locale doesn't exist
      const actualPath = fs.existsSync(coursePath) 
        ? coursePath 
        : path.join(COURSES_DIR, dir, 'en')

      if (!fs.existsSync(actualPath)) continue

      const files = fs.readdirSync(actualPath).filter(f => f.endsWith('.md'))
      
      const lessons = files
        .map(file => {
          const lessonSlug = file.replace(/\.md$/, '')
          const filePath = path.join(actualPath, file)
          const fileContents = fs.readFileSync(filePath, 'utf8')
          const { data, content } = matter(fileContents)

          const metadata = data as CourseMetadata
          if (metadata.difficulty) {
            metadata.difficulty = normalizeDifficulty(String(metadata.difficulty))
          }

          return {
            metadata,
            content,
            slug: lessonSlug,
          }
        })
        .sort((a, b) => (a.metadata.order || 0) - (b.metadata.order || 0))

      result.push({
        slug: dir,
        lessons,
      })
    }
    
    return result
  } catch (error) {
    console.error('Error reading lessons:', error)
    return []
  }
}

export async function getAllCourses(locale: Locale): Promise<CourseInfo[]> {
  try {
    if (!fs.existsSync(COURSES_DIR)) {
      console.warn('Courses directory does not exist:', COURSES_DIR)
      return []
    }

    const courseDirs = fs.readdirSync(COURSES_DIR)
    const courses: CourseInfo[] = []

    for (const dir of courseDirs) {
      // Check if course has content in this locale or fallback to English
      const localeDir = path.join(COURSES_DIR, dir, locale)
      const enDir = path.join(COURSES_DIR, dir, 'en')
      
      if (!fs.existsSync(localeDir) && !fs.existsSync(enDir)) {
        continue
      }

      // Try to read course metadata from course.json
      const courseJsonPath = path.join(COURSES_DIR, dir, 'course.json')
      let courseInfo: CourseInfo = {
        slug: dir,
        title: dir.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        description: 'Course description',
        area: 'General',
      }

      if (fs.existsSync(courseJsonPath)) {
        try {
          const courseJson = JSON.parse(fs.readFileSync(courseJsonPath, 'utf8'))
          // Try to get localized info or fallback to default
          const localizedInfo = courseJson[locale] || courseJson.en || courseJson
          courseInfo = {
            slug: dir,
            title: localizedInfo.title || courseInfo.title,
            description: localizedInfo.description || courseInfo.description,
            area: localizedInfo.area || courseJson.area || courseInfo.area,
            author: courseJson.author,
            difficulty: normalizeDifficulty(localizedInfo.difficulty || courseJson.difficulty),
            duration: localizedInfo.duration || courseJson.duration,
            icon: courseJson.icon,
          }
        } catch (error) {
          console.error(`Error parsing course.json for ${dir}:`, error)
        }
      } else {
        // Fallback: get info from first lesson
        const targetDir = fs.existsSync(localeDir) ? localeDir : enDir
        const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'))
        
        if (files.length > 0) {
          try {
            const firstFile = path.join(targetDir, files[0])
            const fileContents = fs.readFileSync(firstFile, 'utf8')
            const { data } = matter(fileContents)
            
            courseInfo.title = data.courseTitle || courseInfo.title
            courseInfo.description = data.courseDescription || data.description || courseInfo.description
            courseInfo.difficulty = normalizeDifficulty(data.difficulty)
            courseInfo.duration = data.courseDuration || data.duration
          } catch (error) {
            console.error(`Error reading first lesson for ${dir}:`, error)
          }
        }
      }

      // First lesson slug for deep links (prefer locale dir, fallback to en —
      // mirrors getAllLessons so generated params always cover the chosen slug)
      const lessonDir = fs.existsSync(localeDir) ? localeDir : enDir
      if (fs.existsSync(lessonDir)) {
        const lessonFiles = fs
          .readdirSync(lessonDir)
          .filter((f) => f.endsWith('.md'))
          .sort()
        if (lessonFiles.length > 0) {
          courseInfo.firstLessonSlug = lessonFiles[0].replace(/\.md$/, '')
        }
        courseInfo.lessonCount = lessonFiles.length
      }

      courses.push(courseInfo)
    }

    return courses
  } catch (error) {
    console.error('Error reading courses:', error)
    return []
  }
}
