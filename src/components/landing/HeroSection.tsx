import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import {
  FiArrowRight,
  FiSearch,
  FiMapPin,
  FiSun,
  FiMoon,
  FiCheckCircle,
  FiZap,
  FiShield,
  FiCpu,
  FiSliders,
} from 'react-icons/fi'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')

  const getDashboardPath = () => {
    if (user?.is_staff) return '/admin/dashboard'
    if (user?.account_type === 'EMPLOYER') return '/employer/dashboard'
    return '/seeker/dashboard'
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('search', searchQuery.trim())
    if (locationQuery.trim()) params.set('location', locationQuery.trim())
    navigate(`/jobs?${params.toString()}`)
  }

  return (
    <section className={styles.hero}>
      {/* ── Top Navigation Bar ── */}
      <header className={styles.navBar}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.logo}>
            Hirely<span className={styles.logoDot}>.</span>
          </Link>
          <nav className={styles.navLinks}>
            <Link to="/jobs" className={styles.navLink}>
              Explore Jobs
            </Link>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#ai-interactive" className={styles.navLink}>
              AI Screening
            </a>
            <a href="#how-it-works" className={styles.navLink}>
              How It Works
            </a>
          </nav>
        </div>

        <div className={styles.navRight}>
          {user ? (
            <button
              className={styles.dashboardBtn}
              onClick={() => navigate(getDashboardPath())}
            >
              Dashboard
            </button>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.signInLink}>
                Sign In
              </Link>
              <button
                className={styles.getStartedBtn}
                onClick={() => navigate('/register')}
              >
                Get Started <FiArrowRight size={14} />
              </button>
            </div>
          )}

          <div className={styles.navDivider} aria-hidden="true" />

          <button
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? <FiSun size={14} /> : <FiMoon size={14} />}
            <span className={styles.themeLabel}>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
          </button>
        </div>
      </header>

      {/* ── Hero Split Content ── */}
      <div className={styles.heroContentGrid}>
        {/* Left: Value Proposition & Hero Search */}
        <div className={styles.heroLead}>
          <div className={styles.eyebrowBadge}>
            <span className={styles.sparkle}>✦</span>
            <span>NEXT-GEN AI RESUME SCREENING & ATS</span>
          </div>

          <h1 className={styles.mainHeading}>
            Where high-growth teams meet <span className={styles.accentText}>verified talent</span>.
          </h1>

          <p className={styles.subHeading}>
            Automate candidate evaluations with deep semantic matching, multi-criteria skill verification, and intelligent copilot screening.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearchSubmit} className={styles.heroSearchBox}>
            <div className={styles.searchInputGroup}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Job title, skill (e.g. Python, React)..."
                className={styles.heroInput}
              />
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchInputGroup}>
              <FiMapPin className={styles.searchIcon} />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Location or Remote"
                className={styles.heroInput}
              />
            </div>
            <button type="submit" className={styles.heroSearchBtn}>
              <span>Search Roles</span>
              <FiArrowRight size={15} />
            </button>
          </form>

          {/* Live Trust & Performance Stats */}
          <div className={styles.statsStrip}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>&lt; 30s</span>
              <span className={styles.statLabel}>Screening Speed</span>
            </div>
            <div className={styles.statSeparator} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>96.4%</span>
              <span className={styles.statLabel}>Match Accuracy</span>
            </div>
            <div className={styles.statSeparator} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Verified Postings</span>
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Screening Card (Right above the fold) */}
        <div className={styles.heroPreview}>
          <div className={styles.previewCard}>
            <div className={styles.cardHeader}>
              <div className={styles.liveIndicator}>
                <span className={styles.pulseDot} />
                <span className={styles.liveText}>AI EVALUATION ENGINE · LIVE</span>
              </div>
              <span className={styles.stageTag}>Stage: Candidate Screening</span>
            </div>

            <div className={styles.candidateHeader}>
              <div className={styles.candidateAvatar}>AR</div>
              <div className={styles.candidateMeta}>
                <div className={styles.candidateNameRow}>
                  <h3 className={styles.candidateName}>Alex Rivera</h3>
                  <span className={styles.fitBadge}>95% STRONG FIT</span>
                </div>
                <p className={styles.candidateRole}>Senior Fullstack & AI Systems Engineer · 6+ yrs</p>
              </div>
            </div>

            {/* Match Breakdown Progress Bars */}
            <div className={styles.scoreMetrics}>
              <div className={styles.metricRow}>
                <div className={styles.metricLabels}>
                  <span>Skill Alignment (Python, React, Vector DBs)</span>
                  <span className={styles.metricPercent}>98%</span>
                </div>
                <div className={styles.metricTrack}>
                  <div className={styles.metricBar} style={{ width: '98%' }} />
                </div>
              </div>

              <div className={styles.metricRow}>
                <div className={styles.metricLabels}>
                  <span>Production Experience & System Design</span>
                  <span className={styles.metricPercent}>94%</span>
                </div>
                <div className={styles.metricTrack}>
                  <div className={styles.metricBar} style={{ width: '94%' }} />
                </div>
              </div>
            </div>

            {/* Identified Skills Pills */}
            <div className={styles.skillsPills}>
              {['Python', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'LangChain', 'FastAPI'].map((s) => (
                <span key={s} className={styles.skillPill}>
                  {s}
                </span>
              ))}
            </div>

            {/* AI Synthesized Verdict */}
            <div className={styles.verdictBox}>
              <div className={styles.verdictHeader}>
                <FiCpu size={14} className={styles.verdictIcon} />
                <span>Copilot Candidate Synthesis</span>
              </div>
              <p className={styles.verdictText}>
                &ldquo;Candidate matches 100% of required tech stack. Demonstrated architecture of low-latency RAG systems and multi-agent backend pipelines. Highly recommended for Senior Lead interview.&rdquo;
              </p>
            </div>

            {/* Action Bar */}
            <div className={styles.cardActions}>
              <button
                className={styles.shortlistActionBtn}
                onClick={() => navigate('/jobs')}
              >
                <FiCheckCircle size={14} />
                <span>Shortlist Candidate</span>
              </button>
              <button
                className={styles.exploreActionBtn}
                onClick={() => navigate('/jobs')}
              >
                <span>View Full Analysis</span>
                <FiArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
