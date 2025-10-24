'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Linkedin, Github, Youtube, Instagram, Send, CheckCircle, Sparkles, Phone, Globe } from 'lucide-react';
import { useForm, ValidationError } from '@formspree/react';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

interface ContactPageClientProps {
  lang: Locale;
  dict: Dictionary;
}

export default function ContactPageClient({ lang, dict }: ContactPageClientProps) {
  const [state, handleSubmit] = useForm("xandddko"); // Replace with your Formspree form ID
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const socialLinks = [
    {
      icon: Youtube,
      label: 'YouTube',
      handle: '@nuniversity',
      url: 'https://www.youtube.com/@nuniversity',
      gradient: 'from-red-500 to-pink-500'
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      handle: 'company/nuniversity',
      url: 'https://www.linkedin.com/company/nuniversity/',
      gradient: 'from-blue-700 to-blue-500'
    },
    {
      icon: Instagram,
      label: 'Instagram',
      handle: '@thenuniversity',
      url: 'https://www.instagram.com/thenuniversity/',
      gradient: 'from-pink-500 to-purple-500'
    },
    {
      icon: Github,
      label: 'GitHub',
      handle: 'github.com/nuniversity',
      url: 'https://github.com/nuniversity',
      gradient: 'from-gray-700 to-gray-900'
    }
  ];

  if (state.succeeded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 flex items-center justify-center py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-12 border border-gray-200 dark:border-gray-700 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="inline-flex p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6"
                >
                  <CheckCircle className="w-16 h-16 text-white" />
                </motion.div>

                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {dict.contact.success.title}
                </h2>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {dict.contact.success.message}
                </p>

                <motion.button
                  onClick={resetForm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {dict.contact.success.button}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-block mb-6"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Mail className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              {dict.contact.title}{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {dict.contact.titleHighlight}
              </span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {dict.contact.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="pb-20 container-custom">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Contact Info & Social */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dict.contact.info.heading}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {dict.contact.info.description}
              </p>
            </div>

            {/* Email Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      {dict.contact.email}
                    </p>
                    <a
                      href="mailto:thenuniversitybr@gmail.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      thenuniversitybr@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {dict.contact.social}
              </h4>
              
              {socialLinks.map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ x: 10, scale: 1.02 }}
                  className="block"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${social.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <social.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {social.label}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                          {social.handle}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl" />
              
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {dict.contact.form.heading}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
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
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all"
                    />
                    <ValidationError prefix="Message" field="message" errors={state.errors} />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={state.submitting}
                    whileHover={{ scale: state.submitting ? 1 : 1.02 }}
                    whileTap={{ scale: state.submitting ? 1 : 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.submitting ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {dict.contact.form.button}
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}