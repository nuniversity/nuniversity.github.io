'use client'

/**
 * Self-hosted flag artwork (`public/flags/<code>.svg`, from flagcdn.com —
 * public-domain flags). Flag emojis (🇧🇷 🇬🇧) render as plain letter codes
 * on Windows, so any language-pair indicator in the UI uses these SVGs.
 */

export function FlagImage({
  code,
  size = 20,
  className = '',
}: {
  code: string
  size?: number
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny self-hosted SVG, no optimisation needed
    <img
      src={`/flags/${code}.svg`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`rounded-full object-cover ring-1 ring-border ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
