import React from 'react'
import {
  HeroSection,
  InteractiveAiDemo,
  FeaturesSection,
  HowItWorksSection,
  CtaSection,
  LandingFooter,
} from '@/components/landing'
import styles from './Landing.module.css'

export default function Landing() {
  return (
    <div className={styles.landingPage}>
      <HeroSection />
      <main className={styles.mainContent}>
        <FeaturesSection />
        <InteractiveAiDemo />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
