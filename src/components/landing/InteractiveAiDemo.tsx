import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { FiArrowUpRight, FiImage } from 'react-icons/fi'
import styles from './InteractiveAiDemo.module.css'

interface ShowcaseCard {
  id: string
  caption: string
  subcaption: string
  tilt: number
  offsetY: number
  imageUrl?: string
}

export default function InteractiveAiDemo() {
  const navigate = useNavigate()
  const { ref, inView } = useScrollReveal()

  const cards: ShowcaseCard[] = [
    {
      id: 'agent-1',
      caption: 'AGENT 01 // RESUME SCAN',
      subcaption: 'Deep context parsing & skills extraction',
      tilt: -4,
      offsetY: 18,
    },
    {
      id: 'agent-2',
      caption: 'AGENT 02 // CRITERIA RANKING',
      subcaption: 'Multi-criteria scoring & candidate tiers',
      tilt: -1.5,
      offsetY: -10,
    },
    {
      id: 'agent-3',
      caption: 'AGENT 03 // COPILOT DRAWER',
      subcaption: 'Natural language candidate intelligence',
      tilt: 2,
      offsetY: 14,
    },
    {
      id: 'agent-4',
      caption: 'AGENT 04 // SHORTLIST DISPATCH',
      subcaption: 'Automated export & recruiter handoff',
      tilt: 4.5,
      offsetY: -6,
    },
  ]

  return (
    <section
      id="ai-interactive"
      ref={ref}
      className={`${styles.section} ${inView ? styles.inView : ''}`}
    >
      <div className={styles.inner}>
        {/* ── Top Header Row ── */}
        <div className={styles.header}>
          <div className={styles.titleColumn}>
            <h2 className={styles.heading}>
              Autonomous hiring.
              <br />
              <span className={styles.headingMuted}>
                In <span className={styles.accent}>action</span>.
              </span>
            </h2>
          </div>

          <div className={styles.actionColumn}>
            <p className={styles.description}>
              Deep context resume parsing, customized weighted ranking, and an interactive recruiter copilot agent built right into your pipeline.
            </p>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={() => navigate('/login')}
            >
              <span>Start using</span>
              <FiArrowUpRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Tilted Overlapping Showcase Gallery (Showcase 6) ── */}
        <div className={styles.galleryWrapper}>
          <div className={styles.cardsRow}>
            {cards.map((card, idx) => (
              <div
                key={card.id}
                className={styles.card}
                style={{
                  '--tilt': `${card.tilt}deg`,
                  '--offset-y': `${card.offsetY}px`,
                  zIndex: idx + 1,
                  animationDelay: `${idx * 0.1}s`,
                } as React.CSSProperties}
              >
                {/* Image or Placeholder Graphic */}
                <div className={styles.mediaContainer}>
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.caption}
                      className={styles.cardImage}
                    />
                  ) : (
                    <div className={styles.placeholder}>
                      {/* Concentric radial rings from reference image */}
                      <svg
                        className={styles.radialSvg}
                        viewBox="0 0 200 200"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Radial sector spokes */}
                        <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <line x1="36" y1="36" x2="164" y2="164" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                        <line x1="36" y1="164" x2="164" y2="36" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                        {/* Outer burst ring */}
                        <circle cx="100" cy="100" r="82" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                        {/* Middle ring */}
                        <circle cx="100" cy="100" r="54" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
                        {/* Inner ring */}
                        <circle cx="100" cy="100" r="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                      </svg>
                      <div className={styles.placeholderIconWrapper}>
                        <FiImage size={24} className={styles.placeholderIcon} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Polaroid / Mono Caption */}
                <div className={styles.cardFooter}>
                  <div className={styles.cardCaption}>
                    <span className={styles.captionAccent}>
                      {card.caption.split(' // ')[0]}
                    </span>
                    {' // ' + card.caption.split(' // ')[1]}
                  </div>
                  <div className={styles.cardSubcaption}>{card.subcaption}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
