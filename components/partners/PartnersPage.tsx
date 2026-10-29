// components/partners/PartnersPage.tsx
'use client'

import Link from '@/components/navigation/AppLink'
import { motion } from 'framer-motion'
import {
  HeartHandshake,
  Globe,
  Linkedin,
  Github,
  Mail,
  ExternalLink,
  Check,
  Send,
  CheckCircle,
  BookOpen,
  Wrench,
  Presentation,
  Building2,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import { useForm, ValidationError } from '@formspree/react'
import { useRef, useState } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/get-dictionary'

interface PartnersPageProps {
  lang: Locale
  dict: Dictionary
}

/**
 * The Formspree endpoint. It is a public identifier, not a credential —
 * knowing it does not grant access to submissions. Partnership inquiries
 * share the contact inbox and are distinguished by the `_subject` line,
 * which is prefilled with the organization name.
 */
const FORMSPREE_FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || 'xandddko'

/** Field length limits. A partnership inquiry has no legitimate use beyond these. */
const LIMITS = { name: 120, email: 254, organization: 160, website: 200, message: 5000 } as const

/** Ignore a second submit within this window. */
const SUBMIT_COOLDOWN_MS = 3000

/** Icons for the "Ways to Partner" cards, matched by position to the copy. */
const TYPE_ICONS = [BookOpen, Wrench, Presentation, Building2]

/**
 * Fade-up animation shared by every section. `once` keeps the page calm
 * when scrolling back up.
 */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

export default function PartnersPage({ lang, dict }: PartnersPageProps) {
  const p = dict.partners
  const [state, handleSubmit] = useForm(FORMSPREE_FORM_ID)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    website: '',
    partnership_type: '',
    message: '',
  })
  /**
   * Honeypot. Real users never see or fill this field; bots that fill every
   * input they find do. The contact form uses a `website` honeypot, but this
   * form has a *real* website field, so the decoy lives under a different
   * name and stays hidden from sight and from assistive technology.
   */
  const [honeypot, setHoneypot] = useState('')
  const lastSubmit = useRef(0)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const limit = LIMITS[name as keyof typeof LIMITS]
    setFormData(prev => ({
      ...prev,
      [name]: limit ? value.slice(0, limit) : value,
    }))
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // A filled honeypot means a bot: pretend to succeed, send nothing.
    if (honeypot) {
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
      <section id="become-a-partner" className="py-24">
        <div className="container-custom mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {p.success.title}
            </h1>
            <p className="mt-4 text-lg text-foreground-muted">{p.success.message}</p>
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', email: '', organization: '', website: '', partnership_type: '', message: '' })
                setHoneypot('')
              }}
              className="btn btn-secondary btn-lg mt-8"
            >
              {p.success.button}
            </button>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <div className="bg-background text-foreground">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: 'var(--brand-glow)' }}
          aria-hidden="true"
        />
        <div className="container-custom relative">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-foreground-muted backdrop-blur">
              <HeartHandshake className="h-4 w-4 text-primary" aria-hidden="true" />
              {p.hero.title}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {p.hero.title}{' '}
              <span className="text-gradient">{p.hero.titleHighlight}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-foreground-muted">
              {p.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <a href="#become-a-partner" className="btn btn-primary btn-lg group w-full sm:w-auto">
                <span>{p.hero.ctaPrimary}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
              <a href="#directory" className="btn btn-secondary btn-lg group w-full sm:w-auto">
                <span>{p.hero.ctaSecondary}</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Partner directory ────────────────────────────────────────────── */}
      <section id="directory" className="scroll-mt-20 py-20">
        <div className="container-custom">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.directory.heading}</h2>
            <p className="mt-4 text-lg text-foreground-muted">{p.directory.description}</p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8">
            {p.list.map((partner) => (
              <motion.article
                key={partner.name}
                className="relative overflow-hidden rounded-2xl border border-border bg-surface p-8 shadow-sm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {/* Monogram tile — avoids hotlinking partner assets entirely. */}
                  <span
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold tracking-tight text-white shadow-sm ring-1 ring-inset ring-white/20"
                    style={{ backgroundImage: 'var(--brand-mark-gradient)' }}
                    aria-hidden="true"
                  >
                    {partner.monogram}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-bold tracking-tight">{partner.name}</h3>
                      <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-soft-foreground">
                        {partner.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-primary">{partner.tagline}</p>
                    <p className="mt-4 leading-relaxed text-foreground-muted">{partner.description}</p>

                    {/* Expertise tags */}
                    <div className="mt-5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                        {p.directory.servicesLabel}
                      </h4>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {partner.services.map((service) => (
                          <li
                            key={service}
                            className="rounded-full border border-border bg-surface-sunken px-3 py-1 text-xs font-medium text-foreground-muted"
                          >
                            {service}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Connect links */}
                    <div className="mt-6">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                        {p.directory.connectLabel}
                      </h4>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm group"
                        >
                          <Globe className="h-4 w-4" aria-hidden="true" />
                          <span>{p.directory.visitWebsite}</span>
                          <ExternalLink
                            className="h-3.5 w-3.5 opacity-70 transition-transform duration-200 group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </a>
                        <a
                          href={partner.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          aria-label={`${partner.name} on LinkedIn`}
                        >
                          <Linkedin className="h-4 w-4" aria-hidden="true" />
                          <span>LinkedIn</span>
                        </a>
                        <a
                          href={partner.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          aria-label={`${partner.name} on GitHub`}
                        >
                          <Github className="h-4 w-4" aria-hidden="true" />
                          <span>GitHub</span>
                        </a>
                        <a href={`mailto:${partner.email}`} className="btn btn-ghost btn-sm">
                          <Mail className="h-4 w-4" aria-hidden="true" />
                          <span>Email</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ways to partner ──────────────────────────────────────────────── */}
      <section className="bg-surface-sunken/50 py-20">
        <div className="container-custom">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.types.heading}</h2>
            <p className="mt-4 text-lg text-foreground-muted">{p.types.description}</p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {p.types.items.map((item, index) => {
              const Icon = TYPE_ICONS[index % TYPE_ICONS.length]
              return (
                <motion.div
                  key={item.title}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Mutual value ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.benefits.heading}</h2>
            <p className="mt-4 text-lg text-foreground-muted">{p.benefits.description}</p>
          </motion.div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            {[
              { ...p.benefits.forPartners, highlight: true },
              { ...p.benefits.forUs, highlight: false },
            ].map((column) => (
              <motion.div
                key={column.heading}
                className={`rounded-2xl border p-8 shadow-sm ${
                  column.highlight
                    ? 'border-primary/30 bg-primary-soft/40'
                    : 'border-border bg-surface'
                }`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
              >
                <h3 className="text-xl font-bold">{column.heading}</h3>
                <ul className="mt-5 space-y-3">
                  {column.items.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          column.highlight ? 'bg-primary text-primary-foreground' : 'bg-surface-sunken text-foreground-muted'
                        }`}
                        aria-hidden="true"
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm leading-relaxed text-foreground-muted">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────────────────── */}
      <section className="bg-surface-sunken/50 py-20">
        <div className="container-custom">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.process.heading}</h2>
            <p className="mt-4 text-lg text-foreground-muted">{p.process.description}</p>
          </motion.div>

          <ol className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {p.process.steps.map((step, index) => (
              <motion.li
                key={step.title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                  style={{ backgroundImage: 'var(--brand-mark-gradient)' }}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{step.description}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Inquiry form ─────────────────────────────────────────────────── */}
      <section id="become-a-partner" className="scroll-mt-20 py-20">
        <div className="container-custom">
          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-5">
            <motion.div
              className="lg:col-span-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{p.form.heading}</h2>
              <p className="mt-4 leading-relaxed text-foreground-muted">{p.form.description}</p>
              <p className="mt-6 text-sm text-foreground-subtle">
                General question instead?{' '}
                <Link
                  href={`/${lang}/contact`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {dict.navigation.contact}
                  <span className="sr-only"> — {dict.metadata.contact.title}</span>
                </Link>
              </p>
            </motion.div>

            <motion.div
              className="lg:col-span-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
            >
              <form
                onSubmit={onSubmit}
                className="space-y-5 rounded-2xl border border-border bg-surface p-8 shadow-sm"
              >
                {/* Tells Formspree (and the inbox) what this submission is. */}
                <input
                  type="hidden"
                  name="_subject"
                  value={`Partnership inquiry — ${formData.organization || 'New inquiry'}`}
                />
                {/* Honeypot: hidden from users and assistive technology. */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="partner-url">URL</label>
                  <input
                    id="partner-url"
                    type="text"
                    name="url"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="partner-name" className="mb-1.5 block text-sm font-medium">
                      {p.form.name}
                    </label>
                    <input
                      id="partner-name"
                      type="text"
                      name="name"
                      required
                      maxLength={LIMITS.name}
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={p.form.namePlaceholder}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <ValidationError prefix="Name" field="name" errors={state.errors} />
                  </div>
                  <div>
                    <label htmlFor="partner-email" className="mb-1.5 block text-sm font-medium">
                      {p.form.email}
                    </label>
                    <input
                      id="partner-email"
                      type="email"
                      name="email"
                      required
                      maxLength={LIMITS.email}
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={p.form.emailPlaceholder}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <ValidationError prefix="Email" field="email" errors={state.errors} />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="partner-organization" className="mb-1.5 block text-sm font-medium">
                      {p.form.organization}
                    </label>
                    <input
                      id="partner-organization"
                      type="text"
                      name="organization"
                      required
                      maxLength={LIMITS.organization}
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder={p.form.organizationPlaceholder}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="partner-website" className="mb-1.5 block text-sm font-medium">
                      {p.form.website}
                    </label>
                    <input
                      id="partner-website"
                      type="url"
                      name="website"
                      maxLength={LIMITS.website}
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder={p.form.websitePlaceholder}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="partner-type" className="mb-1.5 block text-sm font-medium">
                    {p.form.type}
                  </label>
                  <select
                    id="partner-type"
                    name="partnership_type"
                    required
                    value={formData.partnership_type}
                    onChange={handleInputChange}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>
                      —
                    </option>
                    {Object.entries(p.form.typeOptions).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="partner-message" className="mb-1.5 block text-sm font-medium">
                    {p.form.message}
                  </label>
                  <textarea
                    id="partner-message"
                    name="message"
                    required
                    rows={5}
                    maxLength={LIMITS.message}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={p.form.messagePlaceholder}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <ValidationError prefix="Message" field="message" errors={state.errors} />
                </div>

                <div className="flex flex-col gap-4">
                  <button type="submit" disabled={state.submitting} className="btn btn-primary btn-lg group self-start">
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>{p.form.button}</span>
                  </button>
                  <p className="text-xs leading-relaxed text-foreground-subtle">{p.form.privacyNote}</p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-surface-sunken/50 py-20">
        <div className="container-custom">
          <motion.h2
            className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            {p.faq.heading}
          </motion.h2>

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {p.faq.items.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-border bg-surface shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-foreground-muted transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-foreground-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
