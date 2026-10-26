'use client'

import { useState, useEffect, useRef } from 'react'
import { Printer, X } from 'lucide-react'
import { getCertName, setCertName, clearCertName, CERT_NAME_MAX_LENGTH } from '@/lib/quizzes/storage'

interface CertificateCardProps {
  dict: any
  slug: string
  score: number
  pass: number
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

/** Debounce delay before the name is persisted to browser storage. */
const SAVE_DEBOUNCE_MS = 400

export function CertificateCard({ dict, slug, score, pass }: CertificateCardProps) {
  const [name, setName] = useState('')
  const [issuedAt, setIssuedAt] = useState('')
  const [code, setCode] = useState('')
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nameRef = useRef(name)
  nameRef.current = name

  useEffect(() => {
    setName(getCertName())
    const now = new Date()
    setIssuedAt(now.toLocaleDateString())
    const compact = now.toISOString().slice(0, 10).replace(/-/g, '')
    setCode(`NU-${slug}-${compact}`.toUpperCase())
  }, [slug])

  // Persist any pending write when the component unmounts.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
        setCertName(nameRef.current)
      }
    }
  }, [])

  function handleChange(value: string) {
    const next = value.slice(0, CERT_NAME_MAX_LENGTH)
    setName(next)
    setSaved(false)

    // Debounce: the name is personal data, so it is written to storage on a
    // pause in typing rather than on every keystroke.
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      setCertName(next)
      setSaved(true)
    }, SAVE_DEBOUNCE_MS)
  }

  function handleBlur() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setCertName(name)
    setSaved(true)
  }

  function handleClear() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setName('')
    setSaved(false)
    clearCertName()
  }

  return (
    <div className="certificate-print bg-card border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-6 mb-6 print:border-yellow-600">
      <div className="text-center mb-4 print:mb-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          {dict.quizzes?.certificate?.title || 'Certificate of Achievement'}
        </p>
        <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full print:hidden" />
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {dict.quizzes?.certificate?.awarded || 'This certifies that'}
        </p>
        <input
          type="text"
          value={name}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          maxLength={CERT_NAME_MAX_LENGTH}
          placeholder={dict.quizzes?.certificate?.name_placeholder || 'Enter your name for the certificate'}
          aria-label={dict.quizzes?.certificate?.name_placeholder || 'Enter your name for the certificate'}
          className="w-full max-w-md mx-auto text-center text-xl font-bold bg-transparent border-b-2 border-dashed border-muted-foreground/40 focus:outline-none focus:border-primary py-1 print:border-none print:py-0"
        />
        {!name.trim() && (
          <p className="text-xs text-amber-600 dark:text-amber-400 print:hidden">
            {dict.quizzes?.certificate?.required_name || 'Enter your name to issue the certificate'}
          </p>
        )}
        {name.trim() && (
          <p className="text-xs text-muted-foreground print:hidden flex items-center justify-center gap-2">
            <span>{saved ? (dict.quizzes?.certificate?.saved_locally || 'Saved in this browser only') : ''}</span>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              {dict.quizzes?.certificate?.clear_name || 'Remove'}
            </button>
          </p>
        )}
        <p className="text-sm text-muted-foreground break-words">
          {dict.quizzes?.certificate?.completed || 'has successfully completed'}
        </p>
        <p className="text-lg font-semibold break-words">{slug}</p>
        <p className="text-sm font-medium">
          {tpl(dict.quizzes?.certificate?.score_line || 'Score: {score}% · Passing: {pass}%', { score, pass })}
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground print:gap-10">
        <div className="text-center">
          <p className="font-semibold text-foreground">
            {dict.quizzes?.certificate?.date || 'Date'}
          </p>
          <p>{issuedAt}</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">
            {dict.quizzes?.certificate?.code || 'Certificate ID'}
          </p>
          <p className="break-all">{code}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 print:hidden"
      >
        <Printer className="w-4 h-4" />
        {dict.quizzes?.certificate?.print || 'Print certificate'}
      </button>
    </div>
  )
}
