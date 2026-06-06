'use client'

import { motion } from 'framer-motion'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface NewsletterProps {
  dict: Dictionary
}

export default function Newsletter({ dict }: NewsletterProps) {
  return (
    <section className="py-20 gradient-bg">
      <div className="container-custom text-center text-white">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {dict.footer?.newsletter?.title || 'Stay Updated'}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {dict.footer?.newsletter?.description || 'Get the latest courses, tools, and learning resources delivered to your inbox.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <input
              type="email"
              placeholder={dict.footer?.newsletter?.placeholder || 'Enter your email'}
              className="w-full sm:w-96 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-6 py-4 text-white placeholder-blue-100 focus:ring-2 focus:ring-white focus:border-transparent"
            />
            <button className="w-full sm:w-auto bg-white text-blue-600 font-medium py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors">
              {dict.footer?.newsletter?.button || 'Subscribe'}
            </button>
          </div>

          <p className="text-sm text-blue-200">
            No spam, unsubscribe at any time. We respect your privacy.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
