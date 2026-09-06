import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import styles from './CtaSection.module.css'

export default function CtaSection() {
  const navigate = useNavigate()
  const { ref, inView } = useScrollReveal()

  return (
    <section
      id="cta"
      ref={ref}
      className={`${styles.ctaSection} ${inView ? styles.inView : ''}`}
    >
      {/* ── Framing corner tick marks matching reference ── */}
      <div className={`${styles.corner} ${styles.cornerTL}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerTR}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerBL}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerBR}`} aria-hidden="true" />

      {/* ── Top Center: Button & Small Attractive Description ── */}
      <div className={styles.ctaTop}>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={() => navigate('/register')}
        >
          Start using
        </button>

        <p className={styles.description}>
          Intelligent talent matching. Zero noise, zero gatekeepers.
        </p>
      </div>

      {/* ── Giant Brand Typography with Full Descender Clearance ── */}
      <div className={styles.brandWrapper}>
        <h2 className={styles.brandHeading}>
          <span className={styles.brandText}>Hirely</span>
          <span className={styles.brandDot} aria-hidden="true" />
        </h2>
      </div>
    </section>
  )
}
