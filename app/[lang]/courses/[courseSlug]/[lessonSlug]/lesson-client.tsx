// // app/[lang]/courses/[courseSlug]/[lessonSlug]/lesson-client.tsx
// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { 
//   ChevronLeft, 
//   ChevronRight, 
//   BookOpen, 
//   Menu, 
//   X,
//   Clock,
//   BarChart,
//   User,
//   Calendar
// } from 'lucide-react'
// import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'
// import { type Locale } from '@/lib/i18n/config'

// interface LessonClientProps {
//   lang: Locale
//   courseSlug: string
//   lessonSlug: string
//   courseData: any
//   lessonData: any
//   allLessons: Array<{ slug: string; title: string; order: number }>
//   dict: any
// }

// export default function LessonClient({
//   lang,
//   courseSlug,
//   lessonSlug,
//   courseData,
//   lessonData,
//   allLessons,
//   dict,
// }: LessonClientProps) {
//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   // Find current lesson index
//   const currentIndex = allLessons.findIndex(l => l.slug === lessonSlug)
//   const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
//   const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

//   // Get difficulty color
//   const getDifficultyColor = (difficulty?: string) => {
//     switch (difficulty?.toLowerCase()) {
//       case 'beginner':
//       case 'iniciante':
//       case 'principiante':
//         return 'text-green-600 dark:text-green-400'
//       case 'intermediate':
//       case 'intermediário':
//       case 'intermedio':
//         return 'text-yellow-600 dark:text-yellow-400'
//       case 'advanced':
//       case 'avançado':
//       case 'avanzado':
//         return 'text-red-600 dark:text-red-400'
//       default:
//         return 'text-gray-600 dark:text-gray-400'
//     }
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Mobile Header */}
//       <div className="lg:hidden sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
//         <button
//           onClick={() => setSidebarOpen(!sidebarOpen)}
//           className="p-2 hover:bg-muted rounded-lg transition-colors"
//           aria-label="Toggle menu"
//         >
//           {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//         </button>
//         <h1 className="text-sm font-semibold truncate flex-1 mx-4">
//           {lessonData.title}
//         </h1>
//         <div className="w-9" /> {/* Spacer for centering */}
//       </div>

//       <div className="flex">
//         {/* Sidebar */}
//         <aside
//           className={`
//             fixed lg:sticky top-0 left-0 z-30 h-screen
//             w-80 bg-card border-r overflow-y-auto
//             transition-transform duration-300 ease-in-out
//             ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//           `}
//         >
//           <div className="p-6">
//             {/* Course Header */}
//             <Link
//               href={`/${lang}/courses`}
//               className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
//             >
//               <ChevronLeft className="w-4 h-4" />
//               {dict.courses?.back_to_courses || 'Back to Courses'}
//             </Link>

//             <div className="mb-6">
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
//                   <BookOpen className="w-5 h-5 text-white" />
//                 </div>
//                 <div className="flex-1">
//                   <h2 className="font-semibold text-lg line-clamp-2">
//                     {courseData.title}
//                   </h2>
//                 </div>
//               </div>

//               {/* Course Metadata */}
//               <div className="space-y-2 text-sm text-muted-foreground mt-4">
//                 {courseData.author && (
//                   <div className="flex items-center gap-2">
//                     <User className="w-4 h-4" />
//                     <span>{courseData.author}</span>
//                   </div>
//                 )}
//                 {courseData.difficulty && (
//                   <div className="flex items-center gap-2">
//                     <BarChart className="w-4 h-4" />
//                     <span className={getDifficultyColor(courseData.difficulty)}>
//                       {courseData.difficulty}
//                     </span>
//                   </div>
//                 )}
//                 {courseData.duration && (
//                   <div className="flex items-center gap-2">
//                     <Clock className="w-4 h-4" />
//                     <span>{courseData.duration}</span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Lessons List */}
//             <div>
//               <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
//                 {dict.courses?.course_content || 'Course Content'}
//               </h3>
//               <nav className="space-y-1">
//                 {allLessons.map((lesson, index) => {
//                   const isActive = lesson.slug === lessonSlug
//                   return (
//                     <Link
//                       key={lesson.slug}
//                       href={`/${lang}/courses/${courseSlug}/${lesson.slug}`}
//                       onClick={() => setSidebarOpen(false)}
//                       className={`
//                         block px-3 py-2 rounded-lg text-sm transition-colors
//                         ${isActive
//                           ? 'bg-primary text-primary-foreground font-medium'
//                           : 'hover:bg-muted text-foreground'
//                         }
//                       `}
//                     >
//                       <div className="flex items-center gap-2">
//                         <span className="text-xs opacity-70">
//                           {String(index + 1).padStart(2, '0')}
//                         </span>
//                         <span className="flex-1 line-clamp-2">{lesson.title}</span>
//                       </div>
//                     </Link>
//                   )
//                 })}
//               </nav>
//             </div>
//           </div>
//         </aside>

//         {/* Overlay for mobile */}
//         {sidebarOpen && (
//           <div
//             className="fixed inset-0 bg-black/50 z-20 lg:hidden"
//             onClick={() => setSidebarOpen(false)}
//           />
//         )}

//         {/* Main Content */}
//         <main className="flex-1 min-w-0">
//           <article className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
//             {/* Lesson Header */}
//             <header className="mb-8">
//               <h1 className="text-4xl font-bold mb-4">{lessonData.title}</h1>
              
//               {lessonData.description && (
//                 <p className="text-lg text-muted-foreground mb-4">
//                   {lessonData.description}
//                 </p>
//               )}

//               {/* Lesson Metadata */}
//               <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
//                 {lessonData.author && (
//                   <div className="flex items-center gap-2">
//                     <User className="w-4 h-4" />
//                     <span>
//                       {dict.common?.by || 'by'} {lessonData.author}
//                     </span>
//                   </div>
//                 )}
//                 {lessonData.duration && (
//                   <div className="flex items-center gap-2">
//                     <Clock className="w-4 h-4" />
//                     <span>{lessonData.duration}</span>
//                   </div>
//                 )}
//                 {lessonData.difficulty && (
//                   <div className="flex items-center gap-2">
//                     <BarChart className="w-4 h-4" />
//                     <span className={getDifficultyColor(lessonData.difficulty)}>
//                       {lessonData.difficulty}
//                     </span>
//                   </div>
//                 )}
//               </div>

//               <hr className="mt-6 border-border" />
//             </header>

//             {/* Lesson Content */}
//             <div className="prose prose-lg dark:prose-invert max-w-none">
//               <MarkdownRenderer content={lessonData.content} />
//             </div>

//             {/* Navigation Footer */}
//             <footer className="mt-12 pt-8 border-t border-border">
//               <div className="flex items-center justify-between gap-4">
//                 {prevLesson ? (
//                   <Link
//                     href={`/${lang}/courses/${courseSlug}/${prevLesson.slug}`}
//                     className="group flex items-center gap-2 px-6 py-3 rounded-lg border hover:bg-muted transition-colors"
//                   >
//                     <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
//                     <div className="text-left">
//                       <div className="text-xs text-muted-foreground uppercase tracking-wider">
//                         {dict.common?.previous || 'Previous'}
//                       </div>
//                       <div className="font-medium line-clamp-1">{prevLesson.title}</div>
//                     </div>
//                   </Link>
//                 ) : (
//                   <div />
//                 )}

//                 {nextLesson ? (
//                   <Link
//                     href={`/${lang}/courses/${courseSlug}/${nextLesson.slug}`}
//                     className="group flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity ml-auto"
//                   >
//                     <div className="text-right">
//                       <div className="text-xs opacity-90 uppercase tracking-wider">
//                         {dict.common?.next || 'Next'}
//                       </div>
//                       <div className="font-medium line-clamp-1">{nextLesson.title}</div>
//                     </div>
//                     <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//                   </Link>
//                 ) : (
//                   <Link
//                     href={`/${lang}/courses`}
//                     className="group flex items-center gap-2 px-6 py-3 rounded-lg border hover:bg-muted transition-colors ml-auto"
//                   >
//                     <div className="text-right">
//                       <div className="font-medium">{dict.courses?.back_to_courses || 'Back to Courses'}</div>
//                     </div>
//                     <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//                   </Link>
//                 )}
//               </div>
//             </footer>
//           </article>
//         </main>
//       </div>
//     </div>
//   )
// }