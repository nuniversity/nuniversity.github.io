// components/home/Contact.tsx
'use client'

import { motion } from 'framer-motion'
import { Mail, MapPin, Linkedin, Github, Youtube, Globe, Instagram, Send, CheckCircle } from 'lucide-react'
import { useForm, ValidationError } from '@formspree/react'
import { useState } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface ContactProps {
  lang: Locale
  dict: Dictionary
}

export default function Contact({ lang, dict }: ContactProps) {
  const [state, handleSubmit] = useForm("xandddko") // Replace with your Formspree form ID
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' })
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
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-6"></div>
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
              </div>

              {/* Nuniversity Media */}
              <div className="space-y-6">

                <motion.div whileHover={{ x: 10 }} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
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
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Instagram</p>
                    <a
                      href="https://www.instagram.com/thenuniversity/"
                      target="_blank"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      @thenuniversity
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {dict.contact.form.name}
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder={dict.contact.form.namePlaceholder}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <ValidationError prefix="Name" field="name" errors={state.errors} />
                    </div>
                    <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {dict.contact.form.email}
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder={dict.contact.form.emailPlaceholder}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <ValidationError prefix="Email" field="email" errors={state.errors} />
                    </div>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {dict.contact.form.subject}
                    </label>
                    <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder={dict.contact.form.subjectPlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <ValidationError prefix="Subject" field="subject" errors={state.errors} />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {dict.contact.form.message}
                    </label>
                    <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder={dict.contact.form.messagePlaceholder}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <ValidationError prefix="Message" field="message" errors={state.errors} />
                </div>

                <motion.button
                    type="submit"
                    disabled={state.submitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg flex items-center justify-center"
                >
                    {state.submitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
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