import React, { useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import {
  FiBox,
  FiMessageSquare,
  FiCompass,
  FiCheckCircle,
  FiCpu,
  FiSliders,
  FiShield,
  FiGrid,
  FiArrowRight,
} from 'react-icons/fi'
import styles from './FeaturesSection.module.css'

interface FeatureCardItem {
  icon: React.ReactNode
  title: string
  text: string
  blobColor: string
  accentColor: string
}

const seekerFeatures: FeatureCardItem[] = [
  {
    icon: <FiBox size={22} />,
    title: 'One-Click Apply',
    text: 'Lock in applications with tailored profiles instantly. No redundant question fields or repetitive data entry.',
    blobColor: 'rgba(168, 85, 247, 0.5)',
    accentColor: '#a855f7',
  },
  {
    icon: <FiMessageSquare size={22} />,
    title: 'Direct Recruiter Chat',
    text: 'Bypass automated gatekeepers. Chat directly with engineering leaders who already reviewed your craft.',
    blobColor: 'rgba(59, 130, 246, 0.5)',
    accentColor: '#3b82f6',
  },
  {
    icon: <FiCompass size={22} />,
    title: 'Salary Transparency',
    text: 'Upfront compensation benchmarks, equity packages, and remote policies on every single opening.',
    blobColor: 'rgba(245, 158, 11, 0.5)',
    accentColor: '#f59e0b',
  },
  {
    icon: <FiCheckCircle size={22} />,
    title: 'Live Status Tracking',
    text: 'Real-time stage updates as your resume is evaluated, shortlisted, and advanced to interviews.',
    blobColor: 'rgba(16, 185, 129, 0.5)',
    accentColor: '#10b981',
  },
]

const employerFeatures: FeatureCardItem[] = [
  {
    icon: <FiCpu size={22} />,
    title: 'AI Screening Agent',
    text: 'Automate resume evaluations with deep context parsing that ranks candidates on verified project execution.',
    blobColor: 'rgba(168, 85, 247, 0.5)',
    accentColor: '#a855f7',
  },
  {
    icon: <FiSliders size={22} />,
    title: 'Custom Scoring Weights',
    text: 'Fine-tune criteria between tech stacks, years of depth, and specialized domain knowledge with one slider.',
    blobColor: 'rgba(59, 130, 246, 0.5)',
    accentColor: '#3b82f6',
  },
  {
    icon: <FiShield size={22} />,
    title: 'Verified Talent Quality',
    text: 'Connect with proactive builders actively seeking roles, supported by structured skill evaluations.',
    blobColor: 'rgba(245, 158, 11, 0.5)',
    accentColor: '#f59e0b',
  },
  {
    icon: <FiGrid size={22} />,
    title: 'Pipeline Management',
    text: 'Manage job postings, applicant stages, direct candidate chats, and shortlist decisions in one place.',
    blobColor: 'rgba(16, 185, 129, 0.5)',
    accentColor: '#10b981',
  },
]

export default function FeaturesSection() {
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker')
  const { ref, inView } = useScrollReveal()

  const features = role === 'seeker' ? seekerFeatures : employerFeatures

  return (
    <section
      id="features"
      ref={ref}
      className={`${styles.section} ${inView ? styles.inView : ''}`}
    >
      <div className={styles.inner}>
        {/* ── Left-aligned Header with Switcher ── */}
        <div className={styles.header}>
          <h2 className={styles.heading}>
            Engineered for every way
            <br />
            teams & <span className={styles.accent}>talent</span> build together
          </h2>

          <div className={styles.toggleSwitch}>
            <button
              type="button"
              className={`${styles.toggleOption} ${role === 'seeker' ? styles.toggleActive : ''}`}
              onClick={() => setRole('seeker')}
            >
              For Job Seekers
            </button>
            <button
              type="button"
              className={`${styles.toggleOption} ${role === 'employer' ? styles.toggleActive : ''}`}
              onClick={() => setRole('employer')}
            >
              For Employers
            </button>
          </div>
        </div>

        {/* ── 4 Interactive Features-6 Cards ── */}
        <div className={styles.cardsGrid} key={role}>
          {features.map((item, idx) => (
            <div
              key={idx}
              className={styles.card}
              style={{
                '--hover-accent': item.accentColor,
                animationDelay: `${idx * 0.08}s`,
              } as React.CSSProperties}
            >
              {/* Colored gradient blob visible on hover */}
              <div
                className={styles.gradientBlob}
                style={{
                  background: `radial-gradient(circle at 40% 90%, ${item.blobColor} 0%, transparent 68%)`,
                }}
              />

              {/* Card top: icon and hover-revealed description */}
              <div className={styles.cardTop}>
                <div className={styles.icon}>{item.icon}</div>
                <p className={styles.description}>{item.text}</p>
              </div>

              {/* Card bottom: title and hover-accent arrow */}
              <div className={styles.cardBottom}>
                <span className={styles.title}>{item.title}</span>
                <div className={styles.arrowButton}>
                  <FiArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
