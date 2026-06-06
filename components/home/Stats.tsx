'use client'

import { motion } from 'framer-motion'
import { BookOpen, Wrench, GamepadIcon, Library } from 'lucide-react'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

const iconMap = {
  BookOpen,
  Wrench,
  GamepadIcon,
  Library,
} as const

export type StatIcon = keyof typeof iconMap

export interface StatItem {
  label: string
  value: string
  icon: StatIcon
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
}

interface StatsProps {
  dict: Dictionary
  stats: StatItem[]
}

export default function Stats({ dict, stats }: StatsProps) {
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
            Join Our Growing{' '}
            <span className="text-gradient">Community</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {dict.features?.subtitle || 'Thousands of learners trust NUniversity to advance their careers and knowledge.'}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {stats.map((stat) => {
            const Icon = iconMap[stat.icon]
            return (
              <motion.div
                key={stat.label}
                variants={statVariants}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
