import type { MetadataRoute } from 'next'
import { getAllCourses, getAllLessons } from '@/lib/courses/get-course-content'
import { getAllTools } from '@/lib/tools/get-tool-content'
import { getAllGames } from '@/lib/games/get-game-content'
import { getAllQuizzes } from '@/lib/quizzes/get-quiz-content'
import { getAllRoadmaps } from '@/lib/roadmaps/get-roadmap-content'
import { getAllLanguageActivities, getAllPairs } from '@/lib/languages/get-language-content'
import { i18n } from '@/lib/i18n/config'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://nuniversity.github.io'
  const entries: MetadataRoute.Sitemap = []
  const staticPaths = ['about', 'contact', 'courses', 'games', 'library', 'languages', 'quizzes', 'roadmaps', 'tools']

  for (const lang of i18n.locales) {
    const prefix = `/${lang}`
    entries.push({ url: `${base}${prefix}/`, changeFrequency: 'daily', priority: 1 })
    for (const p of staticPaths) {
      entries.push({ url: `${base}${prefix}/${p}/`, changeFrequency: 'weekly', priority: 0.8 })
    }
    entries.push({
      url: `${base}${prefix}/quizzes/certificates/`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
    for (const course of await getAllCourses(lang)) {
      entries.push({
        url: `${base}${prefix}/courses/${course.slug}/`,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
    for (const course of await getAllLessons(null, lang)) {
      for (const lesson of course.lessons) {
        entries.push({
          url: `${base}${prefix}/courses/${course.slug}/${lesson.slug}/`,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
    for (const tool of await getAllTools(lang)) {
      entries.push({
        url: `${base}${prefix}/tools/${tool.slug}/`,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    for (const game of await getAllGames(lang)) {
      entries.push({
        url: `${base}${prefix}/games/${game.category}/${game.slug}/`,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }
    for (const quiz of await getAllQuizzes(lang)) {
      entries.push({
        url: `${base}${prefix}/quizzes/${quiz.slug}/`,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
    for (const roadmap of await getAllRoadmaps(lang)) {
      entries.push({
        url: `${base}${prefix}/roadmaps/${roadmap.id}/`,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    for (const pair of await getAllPairs()) {
      entries.push({
        url: `${base}${prefix}/languages/${pair}/`,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
    for (const activity of await getAllLanguageActivities(lang)) {
      entries.push({
        url: `${base}${prefix}/languages/${activity.languagePair.source}-${activity.languagePair.target}/${activity.slug}/`,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}
