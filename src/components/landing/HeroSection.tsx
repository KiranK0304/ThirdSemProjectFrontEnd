import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FiArrowRight } from 'react-icons/fi'
import styles from './HeroSection.module.css'

export default function HeroSection() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const getDashboardPath = () => {
    if (user?.is_staff) return '/admin/dashboard'
    if (user?.account_type === 'EMPLOYER') return '/employer/dashboard'
    return '/seeker/dashboard'
  }

  return (
    <section className={styles.hero}>
      {/* ── Top bar: logo ── */}
      <div className={`${styles.heroHeader} ${styles.reveal}`} style={{ animationDelay: '0.1s' }}>
        <Link to="/" className={styles.logo}>
          Hirely<span className={styles.logoDot}>.</span>
        </Link>
      </div>

      {/* ── Main content ── */}
      <div className={styles.heroBody}>
        <h1 className={`${styles.headline} ${styles.reveal}`} style={{ animationDelay: '0.35s' }}>
          Where the right
          <br />
          talent meets the
          <br />
          right <span className={styles.accent}>team</span>.
        </h1>
      </div>

      {/* ── Bottom bar: subtitle + CTAs ── */}
      <div className={`${styles.heroFooter} ${styles.reveal}`} style={{ animationDelay: '0.6s' }}>
        <p className={styles.subtitle}>
          We connect high-performing builders with verified
          <br className={styles.brDesktop} />
          teams through intelligent resume matching.
        </p>

        <div className={styles.ctas}>
          {user ? (
            <button
              className={styles.ctaOutlined}
              onClick={() => navigate(getDashboardPath())}
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                className={styles.ctaOutlined}
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
              <button
                className={styles.ctaAccent}
                onClick={() => navigate('/register')}
                aria-label="Get Started"
              >
                <FiArrowRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
