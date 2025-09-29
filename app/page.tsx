import Hero from '@/components/home/Hero'
// import FeaturedCourses from '@/components/home/FeaturedCourses'
import Features from '@/components/home/Features'
// import Tools from '@/components/home/Tools'
// import Stats from '@/components/home/Stats'
// import Newsletter from '@/components/home/Newsletter'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NUniversity - Interactive Learning Platform',
  description: 'Master technology, engineering, and sciences through interactive courses, coding tools, and educational games. Start your learning journey today.',
  openGraph: {
    title: 'NUniversity - Interactive Learning Platform',
    description: 'Master technology, engineering, and sciences through interactive courses, coding tools, and educational games.',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      {/* <FeaturedCourses /> */}
      {/* <Tools /> */}
      {/* <Stats /> */}
      {/* <Newsletter /> */}
    </>
  )
}