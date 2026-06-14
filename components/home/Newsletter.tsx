'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, Mail } from 'lucide-react'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface NewsletterProps {
  dict: Dictionary
}

export default function Newsletter({ dict }: NewsletterProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')

    // Mock email send: simulates a request to notify the admin
    await new Promise(r => setTimeout(r, 1500))

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <section className="py-20 gradient-bg">
        <div className="container-custom text-center text-white">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-300" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              You're subscribed!
            </h2>
            <p className="text-xl text-blue-100">
              Thanks for signing up. We'll keep you posted on new courses and tools.
            </p>
          </motion.div>
        </div>
      </section>
    )
  }

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
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {dict.footer?.newsletter?.title || 'Stay Updated'}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {dict.footer?.newsletter?.description || 'Get the latest courses, tools, and learning resources delivered to your inbox.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 max-w-xl mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={dict.footer?.newsletter?.placeholder || 'Enter your email'}
              className="w-full sm:flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-6 py-4 text-white placeholder-blue-100 focus:ring-2 focus:ring-white focus:border-transparent outline-none"
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full sm:w-auto bg-white text-blue-600 font-medium py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                dict.footer?.newsletter?.button || 'Subscribe'
              )}
            </button>
          </form>

          <p className="text-sm text-blue-200">
            No spam, unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
