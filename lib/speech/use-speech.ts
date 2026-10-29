'use client'

import { useEffect, useState } from 'react'
import { getVoices } from './speech'

/**
 * Loads the browser voice list reactively. Chrome populates voices
 * asynchronously and fires `voiceschanged` once ready; reading the list only
 * at play time misses the first click.
 */
export function useSpeechVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    const load = () => setVoices(synth.getVoices() ?? [])
    load()
    synth.addEventListener?.('voiceschanged', load)
    return () => synth.removeEventListener?.('voiceschanged', load)
  }, [])

  return voices
}
