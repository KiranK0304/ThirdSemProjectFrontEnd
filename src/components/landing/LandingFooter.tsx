import React from 'react'
import { Link } from 'react-router-dom'
import styles from './LandingFooter.module.css'

export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.topRow}>
          <div className={styles.brandCol}>
            <Link to="/" className={styles.logoText}>
              Hirely<span className={styles.logoDot} />
            </Link>
            <p className={styles.brandTagline}>
              The AI-native recruitment platform connecting verified builders with forward-thinking tech teams.
            </p>
          </div>

          <nav className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#ai-interactive" className={styles.navLink}>
              AI Agent
            </a>
            <a href="#how-it-works" className={styles.navLink}>
              How It Works
            </a>
          </nav>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} Hirely Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
