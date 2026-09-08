import React from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import styles from './HowItWorksSection.module.css'

interface StepItem {
  number: string
  role: string
  isAi?: boolean
  title: string
  description: string
}

export default function HowItWorksSection() {
  const { ref, inView } = useScrollReveal()

  const steps: StepItem[] = [
    {
      number: '1',
      role: 'Employer',
      title: 'Post the Job & Role Criteria',
      description: 'Employers publish positions specifying technical requirements, must-have skills, and role expectations in minutes.',
    },
    {
      number: '2',
      role: 'Job Seeker',
      title: 'Apply by Uploading Resume',
      description: 'Seekers apply in one click by uploading their resume—zero tedious multi-page forms or manual data entry.',
    },
    {
      number: '3',
      role: 'AI Matching',
      isAi: true,
      title: 'AI Shortlists Based on Requirements',
      description: 'Our autonomous screening engine parses actual project depth and skills, scoring and ranking applicants against job benchmarks.',
    },
    {
      number: '4',
      role: 'Recruiter',
      title: 'Recruiter Reviews & Confirms Shortlist',
      description: 'Hiring managers inspect AI evaluation breakdowns, query candidate insights via the Copilot drawer, and finalize the shortlist.',
    },
    {
      number: '5',
      role: 'Job Seeker',
      title: 'Seeker Receives Live Pipeline Updates',
      description: 'Candidates receive real-time notifications and transparent stage updates right on their dashboard from screening to offer.',
    },
  ]

  return (
    <section
      id="how-it-works"
      ref={ref}
      className={`${styles.section} ${inView ? styles.inView : ''}`}
    >
      <div className={styles.inner}>
        {/* ── Left Column: Headline & Simple Subtitle ── */}
        <div className={styles.leftCol}>
          <h2 className={styles.title}>
            How <span className={styles.accent}>Hirely</span> works
          </h2>
          <p className={styles.subtitle}>
            An intelligent recruitment lifecycle connecting employers and talent through autonomous AI matching and real-time candidate updates.
          </p>
        </div>

        {/* ── Right Column: 5 Numbered Steps ── */}
        <div className={styles.rightCol}>
          <div className={styles.stepsList}>
            {steps.map((step, idx) => (
              <div
                key={step.number}
                className={styles.stepItem}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={styles.stepBadge}>{step.number}</div>
                <div className={styles.stepContent}>
                  <div className={styles.stepHeader}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <span className={step.isAi ? styles.roleBadgeAi : styles.roleBadge}>
                      {step.role}
                    </span>
                  </div>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
