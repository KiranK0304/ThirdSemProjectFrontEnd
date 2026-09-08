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
      id: 'pipeline-workspace',
      caption: 'STAGE 01 // PIPELINE WORKSPACE',
      subcaption: 'End-to-end recruitment workspace & stage tracking',
      tilt: -3,
      offsetY: 12,
    },
    {
      id: 'shortlist-ranking',
      caption: 'STAGE 02 // SHORTLIST RANKING',
      subcaption: 'Multi-criteria weighted scoring & candidate tiers',
      tilt: 0,
      offsetY: -8,
    },
    {
      id: 'copilot-drawer',
      caption: 'STAGE 03 // COPILOT DRAWER',
      subcaption: 'Natural language candidate intelligence & recruiter copilot',
      tilt: 3,
      offsetY: 12,
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
                {/* Image or Feature Mockup Graphic */}
                <div className={styles.mediaContainer}>
                  {card.id === 'pipeline-workspace' && (
                    <div className={styles.mockupBox}>
                      <div className={styles.mockupHeader}>
                        <span className={styles.mockupTitle}>Full-Stack Architect</span>
                        <span className={styles.mockupBadge}>42 Active</span>
                      </div>
                      <div className={styles.pipelineLanes}>
                        <div className={styles.pipelineLane}>
                          <span className={styles.laneTitle}>Applied (24)</span>
                          <div className={styles.laneCard}>
                            <span className={styles.cardInitials}>SC</span>
                            <div className={styles.cardMeta}>
                              <span className={styles.candidateName}>Sarah C.</span>
                              <span className={styles.candidateRole}>React · Node</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.pipelineLane}>
                          <span className={styles.laneTitle}>Shortlist (8)</span>
                          <div className={styles.laneCard}>
                            <span className={styles.cardInitialsAccent}>AC</span>
                            <div className={styles.cardMeta}>
                              <span className={styles.candidateName}>Alex Chen</span>
                              <span className={styles.matchScore}>96% Match</span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.pipelineLane}>
                          <span className={styles.laneTitle}>Offer (2)</span>
                          <div className={styles.laneCard}>
                            <span className={styles.cardInitials}>ER</span>
                            <div className={styles.cardMeta}>
                              <span className={styles.candidateName}>Elena R.</span>
                              <span className={styles.statusOffered}>Offer Sent</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {card.id === 'shortlist-ranking' && (
                    <div className={styles.mockupBox}>
                      <div className={styles.mockupHeader}>
                        <span className={styles.mockupTitle}>Ranked Shortlist</span>
                        <span className={styles.mockupBadge}>AI Scored</span>
                      </div>
                      <div className={styles.tableWrap}>
                        <div className={styles.tableHeaderRow}>
                          <span>Candidate</span>
                          <span>Score</span>
                          <span>Tier</span>
                        </div>
                        <div className={styles.tableRow}>
                          <div className={styles.candidateCell}>
                            <span className={styles.rankNum}>01</span>
                            <span className={styles.rowName}>Alex Chen</span>
                          </div>
                          <span className={styles.scorePill}>96%</span>
                          <span className={styles.tierPill}>Tier 1</span>
                        </div>
                        <div className={styles.tableRow}>
                          <div className={styles.candidateCell}>
                            <span className={styles.rankNum}>02</span>
                            <span className={styles.rowName}>Elena Rostova</span>
                          </div>
                          <span className={styles.scorePill}>92%</span>
                          <span className={styles.tierPill}>Tier 1</span>
                        </div>
                        <div className={styles.tableRow}>
                          <div className={styles.candidateCell}>
                            <span className={styles.rankNum}>03</span>
                            <span className={styles.rowName}>Marcus Vance</span>
                          </div>
                          <span className={styles.scorePill}>88%</span>
                          <span className={styles.tierPillMuted}>Tier 2</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {card.id === 'copilot-drawer' && (
                    <div className={styles.mockupBox}>
                      <div className={styles.mockupHeader}>
                        <span className={styles.mockupTitle}>Recruiter Copilot</span>
                        <span className={styles.activeDotBadge}>
                          <span className={styles.greenDot} /> Online
                        </span>
                      </div>
                      <div className={styles.copilotChat}>
                        <div className={styles.chatUser}>
                          Compare candidates on distributed system scaling.
                        </div>
                        <div className={styles.chatAi}>
                          Alex architected Redis cache clusters handling 50k QPS; Elena managed AWS Kafka streaming across 8 regions.
                        </div>
                        <div className={styles.recTag}>
                          ★ Recommended: Advance Alex to Technical Screen
                        </div>
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
