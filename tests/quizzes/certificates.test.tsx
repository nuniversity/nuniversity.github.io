import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CertificatesClient } from '@/components/quizzes/CertificatesClient'
import { QuizzesClient } from '@/app/[lang]/quizzes/quizzes-client'
import { quizBestKey } from '@/lib/quizzes/storage'
import dict from '../../dictionaries/en.json'

vi.stubGlobal('React', React)

const SNOWPRO = 'snowpro-core-cof-c03'

const quizzes = [{ slug: SNOWPRO, title: 'SnowPro Core Certification (COF-C03)', passingScore: 75 }]

beforeEach(() => {
  window.localStorage.clear()
})

function seedBest(overrides: Record<string, unknown> = {}) {
  window.localStorage.setItem(
    quizBestKey(SNOWPRO),
    JSON.stringify({ score: 65, total: 70, passed: true, date: '2026-01-01', ...overrides })
  )
}

describe('CertificatesClient', () => {
  it('shows the empty state when no exam has been passed', async () => {
    render(<CertificatesClient lang="en" dict={dict} quizzes={quizzes} />)

    expect(await screen.findByTestId('certificates-empty')).toHaveTextContent(
      dict.quizzes.certificates.empty
    )
    expect(screen.getByTestId('certificates-count')).toHaveTextContent('0 certificates')
    expect(screen.queryByTestId('certificates-print')).not.toBeInTheDocument()
  })

  it('lists passed certificates with score and print action', async () => {
    seedBest()

    render(<CertificatesClient lang="en" dict={dict} quizzes={quizzes} />)

    const card = await screen.findByTestId(`certificate-${SNOWPRO}`)
    expect(card).toHaveAttribute('data-quiz-title', 'SnowPro Core Certification (COF-C03)')
    expect(card).toHaveTextContent('Score: 93% · Passing: 75%')
    expect(screen.getByTestId('certificates-count')).toHaveTextContent('1 certificates')
    expect(screen.getByTestId('certificates-print')).toBeInTheDocument()
    expect(screen.queryByTestId('certificates-empty')).not.toBeInTheDocument()
  })

  it('ignores bests that did not pass', async () => {
    seedBest({ passed: false })

    render(<CertificatesClient lang="en" dict={dict} quizzes={quizzes} />)

    expect(await screen.findByTestId('certificates-empty')).toBeInTheDocument()
    expect(screen.queryByTestId(`certificate-${SNOWPRO}`)).not.toBeInTheDocument()
    expect(screen.getByTestId('certificates-count')).toHaveTextContent('0 certificates')
  })
})

describe('quizzes hub certificates link', () => {
  it('links to the certificates hub from the quizzes page', () => {
    render(
      <QuizzesClient
        lang="en"
        quizzes={[
          {
            slug: SNOWPRO,
            id: SNOWPRO,
            kind: 'certification',
            category: 'data-platforms',
            title: 'SnowPro Core Certification (COF-C03)',
            description: 'Snowflake core exam',
            difficulty: 'intermediate',
            topic: 'Data platforms',
            certification: 'SnowPro Core',
            durationSeconds: 90,
            passingScore: 75,
            questionCount: 45,
            domains: [],
          } as any,
        ]}
        dict={dict}
      />
    )

    const link = screen.getByTestId('certificates-link')
    expect(link).toHaveAttribute('href', '/en/quizzes/certificates/')
    expect(link).toHaveTextContent('My certificates')
  })
})
