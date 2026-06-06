// components/home/Features.tsx
'use client'

import { motion } from 'framer-motion'
import { Code, BookOpen, Calculator, GamepadIcon, Video, Users } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface FeaturesProps {
  lang: Locale
  dict: Dictionary
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

export default function Features({ lang, dict }: FeaturesProps) {
  const features = [
    {
      icon: BookOpen,
      title: dict.features.items.courses.title,
      description: dict.features.items.courses.description,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Code,
      title: dict.features.items.coding.title,
      description: dict.features.items.coding.description,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Calculator,
      title: dict.features.items.study.title,
      description: dict.features.items.study.description,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: GamepadIcon,
      title: dict.features.items.games.title,
      description: dict.features.items.games.description,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Video,
      title: dict.features.items.video.title,
      description: dict.features.items.video.description,
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Users,
      title: dict.features.items.community.title,
      description: dict.features.items.community.description,
      gradient: 'from-pink-500 to-purple-500',
    },
  ]

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container-custom">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {dict.features.title}{' '}
            <span className="text-gradient">{dict.features.titleHighlight}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {dict.features.subtitle}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 card-hover"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`w-full h-1 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
