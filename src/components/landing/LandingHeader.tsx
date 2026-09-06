import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui'
import { FiMenu, FiX, FiArrowRight } from 'react-icons/fi'
import styles from './LandingHeader.module.css'

export default function LandingHeader() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const getDashboardPath = () => {
    if (user?.is_staff) return '/admin/dashboard'
    if (user?.account_type === 'EMPLOYER') return '/employer/dashboard'
    return '/seeker/dashboard'
  }

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link to="/" className={styles.logoText}>
            Hirely<span className={styles.logoDot} />
          </Link>
        </div>

        <nav className={styles.navLinks}>
          <Link to="/jobs" className={styles.navLink}>
            Explore Jobs
          </Link>
          <a href="#features" className={styles.navLink}>
            AI Matching
          </a>
          <a href="#how-it-works" className={styles.navLink}>
            How It Works
          </a>
          <a href="#roles" className={styles.navLink}>
            For Employers
          </a>
        </nav>

        <div className={styles.navRight}>
          {user ? (
            <Button
              variant="primary"
              onClick={() => navigate(getDashboardPath())}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Link to="/login" className={styles.signInLink}>
                Sign In
              </Link>
              <Button
                variant="primary"
                onClick={() => navigate('/register')}
              >
                Get Started <FiArrowRight style={{ marginLeft: 6 }} />
              </Button>
            </>
          )}

          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link
            to="/jobs"
            className={styles.mobileNavLink}
            onClick={() => setMobileOpen(false)}
          >
            Explore Jobs
          </Link>
          <a
            href="#features"
            className={styles.mobileNavLink}
            onClick={() => setMobileOpen(false)}
          >
            AI Matching
          </a>
          <a
            href="#how-it-works"
            className={styles.mobileNavLink}
            onClick={() => setMobileOpen(false)}
          >
            How It Works
          </a>
          <a
            href="#roles"
            className={styles.mobileNavLink}
            onClick={() => setMobileOpen(false)}
          >
            For Employers
          </a>

          <div className={styles.mobileAuthButtons}>
            {user ? (
              <Button
                variant="primary"
                onClick={() => {
                  setMobileOpen(false)
                  navigate(getDashboardPath())
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setMobileOpen(false)
                    navigate('/login')
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setMobileOpen(false)
                    navigate('/register')
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
