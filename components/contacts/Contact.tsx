// components/home/Contact.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, MapPin, Linkedin, Github, Youtube, Globe, Instagram, Send, CheckCircle } from 'lucide-react'
import { useForm, ValidationError } from '@formspree/react'
import { useRef, useState } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface ContactProps {
  lang: Locale
  dict: Dictionary
}

/**
 * The Formspree endpoint. It is a public identifier, not a credential —
 * knowing it does not grant access to submissions — but it does mean anyone
 * can post to it, which is why the honeypot and the submit throttle below
 * matter.
 */
const FORMSPREE_FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || 'xandddko'

/** Field length limits. A contact message has no legitimate use beyond these. */
const LIMITS = { name: 120, email: 254, subject: 200, message: 5000 } as const

/** Ignore a second submit within this window. */
const SUBMIT_COOLDOWN_MS = 3000

export default function Contact({ lang, dict }: ContactProps) {
  const [state, handleSubmit] = useForm(FORMSPREE_FORM_ID)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  /**
   * Honeypot. Real users never see or fill this field; bots that fill every
   * input they find do. It is hidden from sight *and* from assistive
   * technology, so it never affects a genuine submission.
   */
  const [website, setWebsite] = useState('')
  const lastSubmit = useRef(0)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const limit = LIMITS[name as keyof typeof LIMITS]
    setFormData(prev => ({
      ...prev,
      [name]: limit ? value.slice(0, limit) : value,
    }))
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' })
    setWebsite('')
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // A filled honeypot means a bot: pretend to succeed, send nothing.
    if (website) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    // Throttle repeat submissions.
    const now = Date.now()
    if (now - lastSubmit.current < SUBMIT_COOLDOWN_MS) {
      event.preventDefault()
      return
    }
    lastSubmit.current = now
    handleSubmit(event)
  }

  if (state.succeeded) {
    return (
      <section id="contact" className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="bg-green-50 dark:bg-green-900/20 rounded-xl p-12 border border-green-200 dark:border-green-800"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {dict.contact.success.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                {dict.contact.success.message}
              </p>
              <button
                onClick={resetForm}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {dict.contact.success.button}
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              {dict.contact.title}{' '}
              <span className="text-blue-600">{dict.contact.titleHighlight}</span>
            </h2>
            <div className="w-24 h-1 bg-brand mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {dict.contact.subtitle}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {dict.contact.info.heading}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  {dict.contact.info.description}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
                  <Link
                    href={`/${lang}/partners`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {dict.navigation.partners}
                  </Link>{' '}
                  — {dict.metadata.partners.description}
                </p>
              </div>

              {/* Nuniversity Media */}
              <div className="space-y-6">

                <motion.div whileHover={{ x: 10 }} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">YouTube</p>
                    <a
                      href="https://www.youtube.com/@nuniversity"
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      @nuniversity
                    </a>
                  </div>
                </motion.div>

                <motion.div whileHover={{ x: 10 }} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-700 to-blue-500 rounded-lg flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">LinkedIn</p>
                    <a
                      href="https://www.linkedin.com/company/nuniversity/"
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      company/nuniversity
                    </a>
                  </div>
                </motion.div>

                <motion.div whileHover={{ x: 10 }} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Instagram</p>
                    <a
                      href="https://www.instagram.com/nuniversityedu/"
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      @nuniversityedu
                    </a>
                  </div>
                </motion.div>

                <motion.div whileHover={{ x: 10 }} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                    <Github className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">GitHub</p>
                    <a
                      href="https://github.com/nuniversity"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      github.com/nuniversity
                    </a>
                  </div>
                </motion.div>

                <motion.div whileHover={{ x: 10 }} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                    <a
                      href="mailto:thenuniversitybr@gmail.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      thenuniversitybr@gmail.com
                    </a>
                  </div>
                </motion.div>

              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 border border-gray-100 dark:border-gray-700"
            >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {dict.contact.form.heading}
                </h3>

                <form onSubmit={onSubmit} className="flex flex-col gap-6">
                {/* Honeypot — hidden from people, tempting to bots. */}
                <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="contact-website">Website</label>
                    <input
                        type="text"
                        id="contact-website"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        {dict.contact.form.name}
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        maxLength={LIMITS.name}
                        autoComplete="name"
                        placeholder={dict.contact.form.namePlaceholder}
                        className="input"
                    />
                    <ValidationError prefix="Name" field="name" errors={state.errors} />
                    </div>
                    <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        {dict.contact.form.email}
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        maxLength={LIMITS.email}
                        autoComplete="email"
                        placeholder={dict.contact.form.emailPlaceholder}
                        className="input"
                    />
                    <ValidationError prefix="Email" field="email" errors={state.errors} />
                    </div>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    {dict.contact.form.subject}
                    </label>
                    <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    maxLength={LIMITS.subject}
                    placeholder={dict.contact.form.subjectPlaceholder}
                    className="input"
                    />
                    <ValidationError prefix="Subject" field="subject" errors={state.errors} />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    {dict.contact.form.message}
                    </label>
                    <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    maxLength={LIMITS.message}
                    placeholder={dict.contact.form.messagePlaceholder}
                    className="textarea"
                    />
                    <ValidationError prefix="Message" field="message" errors={state.errors} />
                </div>

                <p className="text-xs leading-relaxed text-foreground-muted">
                    {dict.contact.form.privacyNote ||
                        'Your message is sent to Formspree, a third-party delivery service, and is used only to reply to you. Please do not include sensitive information.'}
                </p>

                <motion.button
                    type="submit"
                    disabled={state.submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn btn-primary w-full py-4 text-base"
                >
                    {state.submitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    ) : (
                    <>
                        <Send className="w-5 h-5 mr-2" />
                        {dict.contact.form.button}
                    </>
                    )}
                </motion.button>
                </form>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}