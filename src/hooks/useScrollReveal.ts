import { useEffect, useRef, useState } from 'react'

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { threshold = 0.08, rootMargin = '0px 0px -40px 0px' } = options
  const ref = useRef<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    // Immediate fallback for SEO crawlers, SSR, or environments without IntersectionObserver
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    // If user prefers reduced motion, trigger instantly
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          // Once revealed, disconnect to save resources
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    const el = ref.current
    if (el) {
      observer.observe(el)
    }

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin])

  return { ref, inView }
}
