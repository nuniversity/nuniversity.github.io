'use client'

import { useEffect, useState } from 'react'
import { Crown, Flame, Languages, Route, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { getProfile, levelFromXp } from '@/lib/gamification/profile'
import { onAward } from '@/lib/gamification/bus'
import { BADGE_IDS, type BadgeId, type GamificationProfile } from '@/lib/gamification/types'

const BADGE_ICON: Record<BadgeId, typeof Trophy> = {
  'first-lesson': Sparkles,
  'quiz-pass': ShieldCheck,
  'perfect-quiz': Crown,
  'course-complete': Trophy,
  'roadmap-complete': Route,
  'streak-7': Flame,
  'polyglot-start': Languages,
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
    template
  )
}

interface ProfileChipProps {
  dict: any
}

export default function ProfileChip({ dict }: ProfileChipProps) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setProfile(getProfile())
    return onAward(() => setProfile(getProfile()))
  }, [])

  if (!profile) return null

  const level = levelFromXp(profile.xp)

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        data-testid="profile-chip"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Trophy className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {tpl(dict?.gamification?.level || 'Level {n}', { n: level })}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-300">
          {tpl(dict?.gamification?.xp || '{n} XP', { n: profile.xp })}
        </span>
        {profile.streak.current > 1 && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium text-orange-500"
            data-testid="profile-streak"
          >
            <Flame className="h-3.5 w-3.5" />
            {profile.streak.current}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20 p-4"
            data-testid="badge-popover"
          >
            <p className="text-sm font-semibold mb-3">
              {dict?.gamification?.badges?.title || 'Badges'}
            </p>
            <ul className="space-y-2.5">
              {BADGE_IDS.map(id => {
                const awardedAt = profile.badges[id]
                const key = id.replace(/-/g, '_')
                const Icon = BADGE_ICON[id]
                return (
                  <li
                    key={id}
                    className={`flex items-start gap-3 ${awardedAt ? '' : 'opacity-50'}`}
                    data-testid={`badge-${id}`}
                    data-awarded={awardedAt ? 'true' : 'false'}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        awardedAt
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {dict?.gamification?.badges?.[key] || id}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {dict?.gamification?.badges?.[`${key}_desc`] || ''}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
            {profile.streak.best > 0 && (
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex justify-between">
                <span>{tpl(dict?.gamification?.streak?.days || '{n} day streak', { n: profile.streak.current })}</span>
                <span>{tpl(dict?.gamification?.streak?.best || 'Best: {n}', { n: profile.streak.best })}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
