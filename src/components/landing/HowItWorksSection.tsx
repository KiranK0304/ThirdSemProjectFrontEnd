import React from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import styles from './HowItWorksSection.module.css'

interface StepItem {
  number: string
  title: string
  description: string
}

export default function HowItWorksSection() {
  const { ref, inView } = useScrollReveal()

  const steps: StepItem[] = [
    {
      number: '1',
      title: 'Create your profile',
      description: 'Upload your resume and set your preferences in minutes.',
    },
    {
      number: '2',
      title: 'Set your criteria',
      description: 'Choose the skills, roles, and salary expectations that matter to you.',
    },
    {
      number: '3',
      title: 'Get matched by AI',
      description: 'Our agent evaluates and ranks matches based on real project depth.',
    },
    {
      number: '4',
      title: 'Connect & get hired',
      description: 'Chat directly with hiring managers, schedule interviews, and accept offers.',
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
            A clear path from application to hired. No gatekeepers, no redundant forms: just intelligent matching that works.
          </p>
        </div>

        {/* ── Right Column: 4 Numbered Steps ── */}
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
                  <h3 className={styles.stepTitle}>{step.title}</h3>
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
