import React, { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { extractApiError, extractFieldErrors } from '@/api/utils'
import {
  FiUser,
  FiBriefcase,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
} from 'react-icons/fi'
import styles from './Auth.module.css'

interface AuthProps {
  defaultMode?: 'login' | 'register'
}

export default function Auth({ defaultMode = 'login' }: AuthProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, register } = useAuth()

  // Track flip state based on current route
  const isFlipped = location.pathname === '/register' || (!location.pathname.includes('/login') && defaultMode === 'register')

  // ── Login State ──
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false)

  // ── Register State ──
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)
  const [accountType, setAccountType] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER')
  const [regGeneralError, setRegGeneralError] = useState<string | null>(null)
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({})
  const [isRegSubmitting, setIsRegSubmitting] = useState(false)

  // Navigation handlers
  const flipToRegister = () => {
    setLoginError(null)
    navigate('/register')
  }

  const flipToLogin = () => {
    setRegGeneralError(null)
    setRegFieldErrors({})
    navigate('/login')
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoginSubmitting(true)

    try {
      await login({ email: loginEmail, password: loginPassword })
      navigate('/', { replace: true })
    } catch (err: any) {
      setLoginError(extractApiError(err) || 'Failed to sign in. Please check your credentials.')
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegGeneralError(null)
    setRegFieldErrors({})

    if (regPassword !== regConfirmPassword) {
      setRegFieldErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    setIsRegSubmitting(true)
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        password_confirm: regConfirmPassword,
        account_type: accountType,
      })
      navigate('/', { replace: true })
    } catch (err: any) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setRegFieldErrors(fieldErrs)
      } else {
        setRegGeneralError(extractApiError(err) || 'Registration failed. Please try again.')
      }
    } finally {
      setIsRegSubmitting(false)
    }
  }

  return (
    <div className={styles.flipPerspective}>
      <div className={`${styles.flipCard} ${isFlipped ? styles.isFlipped : ''}`}>
        {/* ═══════════════════════════════════════════════
            FRONT FACE: SIGN IN
            ═══════════════════════════════════════════════ */}
        <div
          className={`${styles.cardFace} ${styles.frontFace}`}
          inert={isFlipped ? true : undefined}
          aria-hidden={isFlipped}
        >
          <div className={styles.header}>
            <h1 className={styles.title}>
              Welcome <span className={styles.accent}>back</span>
            </h1>
          </div>

          <form className={styles.form} onSubmit={handleLoginSubmit}>
            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} size={16} />
                <input
                  id="loginEmail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  className={styles.input}
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value)
                    setLoginError(null)
                  }}
                  tabIndex={isFlipped ? -1 : 0}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  id="loginPassword"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  aria-label="Password"
                  className={styles.input}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value)
                    setLoginError(null)
                  }}
                  tabIndex={isFlipped ? -1 : 0}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  tabIndex={isFlipped ? -1 : 0}
                >
                  {showLoginPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className={styles.errorBanner} role="alert">
                <FiAlertCircle size={16} className={styles.errorIcon} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoginSubmitting}
              tabIndex={isFlipped ? -1 : 0}
            >
              <span>{isLoginSubmitting ? 'Signing in...' : 'Sign in'}</span>
              <FiArrowRight size={16} />
            </button>
          </form>

          <div className={styles.footer}>
            <span className={styles.footerText}>New to Hirely? </span>
            <button
              type="button"
              className={styles.flipLink}
              onClick={flipToRegister}
              tabIndex={isFlipped ? -1 : 0}
            >
              Create an account →
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            BACK FACE: CREATE ACCOUNT (FLIPPED 180 DEG)
            ═══════════════════════════════════════════════ */}
        <div
          className={`${styles.cardFace} ${styles.backFace}`}
          inert={!isFlipped ? true : undefined}
          aria-hidden={!isFlipped}
        >
          <div className={styles.header}>
            <h1 className={styles.title}>
              Create <span className={styles.accent}>Account</span>
            </h1>
          </div>

          {/* Minimal 36px Role Switcher */}
          <div className={styles.roleBar}>
            <button
              type="button"
              className={`${styles.rolePill} ${accountType === 'SEEKER' ? styles.rolePillActive : ''}`}
              onClick={() => setAccountType('SEEKER')}
              tabIndex={!isFlipped ? -1 : 0}
            >
              <FiUser size={14} />
              <span>Job Seeker</span>
            </button>
            <button
              type="button"
              className={`${styles.rolePill} ${accountType === 'EMPLOYER' ? styles.rolePillActive : ''}`}
              onClick={() => setAccountType('EMPLOYER')}
              tabIndex={!isFlipped ? -1 : 0}
            >
              <FiBriefcase size={14} />
              <span>Employer</span>
            </button>
          </div>

          <form className={styles.form} onSubmit={handleRegisterSubmit}>
            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.inputIcon} size={16} />
                <input
                  id="regName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Full name"
                  aria-label="Full name"
                  className={`${styles.input} ${regFieldErrors.name ? styles.inputError : ''}`}
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value)
                    setRegFieldErrors((prev) => ({ ...prev, name: '' }))
                  }}
                  tabIndex={!isFlipped ? -1 : 0}
                />
              </div>
              {regFieldErrors.name && (
                <span className={styles.fieldErrorText}>{regFieldErrors.name}</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} size={16} />
                <input
                  id="regEmail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Work email"
                  aria-label="Work email"
                  className={`${styles.input} ${regFieldErrors.email ? styles.inputError : ''}`}
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value)
                    setRegFieldErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  tabIndex={!isFlipped ? -1 : 0}
                />
              </div>
              {regFieldErrors.email && (
                <span className={styles.fieldErrorText}>{regFieldErrors.email}</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  id="regPassword"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Password (min. 8 characters)"
                  aria-label="Password"
                  className={`${styles.input} ${regFieldErrors.password ? styles.inputError : ''}`}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value)
                    setRegFieldErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  tabIndex={!isFlipped ? -1 : 0}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  tabIndex={!isFlipped ? -1 : 0}
                >
                  {showRegPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {regFieldErrors.password && (
                <span className={styles.fieldErrorText}>{regFieldErrors.password}</span>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  id="regConfirmPassword"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  aria-label="Confirm password"
                  className={`${styles.input} ${regFieldErrors.confirmPassword ? styles.inputError : ''}`}
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value)
                    setRegFieldErrors((prev) => ({ ...prev, confirmPassword: '' }))
                  }}
                  tabIndex={!isFlipped ? -1 : 0}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={!isFlipped ? -1 : 0}
                >
                  {showRegConfirmPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {regFieldErrors.confirmPassword && (
                <span className={styles.fieldErrorText}>{regFieldErrors.confirmPassword}</span>
              )}
            </div>

            {regGeneralError && (
              <div className={styles.errorBanner} role="alert">
                <FiAlertCircle size={16} className={styles.errorIcon} />
                <span>{regGeneralError}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isRegSubmitting}
              tabIndex={!isFlipped ? -1 : 0}
            >
              <span>{isRegSubmitting ? 'Creating account...' : 'Create Account'}</span>
              <FiArrowRight size={16} />
            </button>
          </form>

          <div className={styles.footer}>
            <span className={styles.footerText}>Already have an account? </span>
            <button
              type="button"
              className={styles.flipLink}
              onClick={flipToLogin}
              tabIndex={!isFlipped ? -1 : 0}
            >
              Sign in →
            </button>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
