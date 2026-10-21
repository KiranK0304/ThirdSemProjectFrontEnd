import React, { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { extractApiError, extractFieldErrors } from '@/api/utils'
import { resendVerificationApi } from '@/api/auth'
import {
  FiUser,
  FiBriefcase,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
  FiCheckCircle,
  FiGlobe,
  FiPhone,
  FiMapPin,
  FiAward,
  FiLayers,
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
  const [showVerifyHint, setShowVerifyHint] = useState(false)
  const [resendingFromLogin, setResendingFromLogin] = useState(false)
  const [resendLoginMsg, setResendLoginMsg] = useState<string | null>(null)

  // ── Register State ──
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)
  const [accountType, setAccountType] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER')

  // Employer-specific register fields
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [companySize, setCompanySize] = useState('11-50')
  const [headquarters, setHeadquarters] = useState('')

  // Seeker-specific register fields
  const [headline, setHeadline] = useState('')
  const [phone, setPhone] = useState('')
  const [locationStr, setLocationStr] = useState('')
  const [yearsExp, setYearsExp] = useState('')

  const [regGeneralError, setRegGeneralError] = useState<string | null>(null)
  const [regFieldErrors, setRegFieldErrors] = useState<Record<string, string>>({})
  const [isRegSubmitting, setIsRegSubmitting] = useState(false)

  // ── Verification Pending State ──
  const [verificationPending, setVerificationPending] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [verificationEmailFailed, setVerificationEmailFailed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  // Navigation handlers
  const flipToRegister = () => {
    setLoginError(null)
    setShowVerifyHint(false)
    setResendLoginMsg(null)
    navigate('/register')
  }

  const flipToLogin = () => {
    setRegGeneralError(null)
    setRegFieldErrors({})
    setVerificationPending(false)
    setResendMsg(null)
    navigate('/login')
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setShowVerifyHint(false)
    setResendLoginMsg(null)
    setIsLoginSubmitting(true)

    try {
      const loggedInUser = await login({ email: loginEmail, password: loginPassword })
      const from = (location.state as any)?.from?.pathname
      if (from) {
        navigate(from, { replace: true })
      } else if (loggedInUser?.is_staff) {
        navigate('/admin/dashboard', { replace: true })
      } else if (loggedInUser?.account_type === 'EMPLOYER') {
        navigate('/employer/dashboard', { replace: true })
      } else {
        navigate('/seeker/dashboard', { replace: true })
      }
    } catch (err: any) {
      const errorMsg = extractApiError(err)
      // Check if the error is about email verification
      if (errorMsg && errorMsg.toLowerCase().includes('verify your email')) {
        setShowVerifyHint(true)
        setLoginError(null)
      } else {
        setLoginError(errorMsg || 'Failed to sign in. Please check your credentials.')
      }
    } finally {
      setIsLoginSubmitting(false)
    }
  }

  // Resend verification from login page
  const handleResendFromLogin = async () => {
    if (!loginEmail) {
      setResendLoginMsg('Please enter your email address above.')
      return
    }
    setResendingFromLogin(true)
    setResendLoginMsg(null)
    try {
      const res = await resendVerificationApi(loginEmail)
      setResendLoginMsg(res.detail)
    } catch (err) {
      setResendLoginMsg(extractApiError(err) || 'Failed to resend. Please try again.')
    } finally {
      setResendingFromLogin(false)
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
      const { emailSent } = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        password_confirm: regConfirmPassword,
        account_type: accountType,
        ...(accountType === 'EMPLOYER'
          ? {
              company_name: companyName,
              website: website,
              company_size: companySize,
              headquarters: headquarters,
            }
          : {
              headline: headline,
              phone: phone,
              location: locationStr,
              years_of_experience: yearsExp ? Number(yearsExp) : null,
            }),
      })
      // Show verification pending screen
      setPendingEmail(regEmail)
      setVerificationEmailFailed(!emailSent)
      setVerificationPending(true)
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

  // Resend verification email
  const handleResendVerification = async () => {
    setResending(true)
    setResendMsg(null)
    try {
      const res = await resendVerificationApi(pendingEmail)
      setResendMsg(res.detail)
      setVerificationEmailFailed(false)
    } catch (err) {
      setResendMsg(extractApiError(err) || 'Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
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
                    setShowVerifyHint(false)
                    setResendLoginMsg(null)
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

            {showVerifyHint && (
              <div className={styles.verifyBanner} role="alert">
                <FiMail size={16} style={{ flexShrink: 0, color: '#D97706' }} />
                <div>
                  <span>Please verify your email address before logging in. Check your inbox for the verification link.</span>
                  <button
                    type="button"
                    className={styles.resendLink}
                    onClick={handleResendFromLogin}
                    disabled={resendingFromLogin}
                    tabIndex={isFlipped ? -1 : 0}
                  >
                    {resendingFromLogin ? 'Sending...' : 'Resend verification email'}
                  </button>
                  {resendLoginMsg && (
                    <span className={styles.resendMsg}>{resendLoginMsg}</span>
                  )}
                </div>
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
          {verificationPending ? (
            /* ── Verification Pending Screen ── */
            <div className={styles.verificationPending}>
              <div className={styles.verifyIconWrap}>
                <FiMail size={40} />
              </div>
              <h2 className={styles.verifyTitle}>Check your email</h2>
              {verificationEmailFailed ? (
                <p className={styles.verifyText}>
                  Your account was created, but we couldn't send the verification email to{' '}
                  <strong>{pendingEmail}</strong> just now. Please use the button below to try again.
                </p>
              ) : (
                <p className={styles.verifyText}>
                  We've sent a verification link to <strong>{pendingEmail}</strong>.
                  Please click the link to verify your account.
                </p>
              )}
              <p className={styles.verifySubtext}>
                The link will expire in 24 hours.
              </p>
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResendVerification}
                disabled={resending}
                tabIndex={!isFlipped ? -1 : 0}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
              {resendMsg && (
                <p className={styles.resendMsg}>{resendMsg}</p>
              )}
              <button
                type="button"
                className={styles.flipLink}
                onClick={flipToLogin}
                style={{ marginTop: '16px' }}
                tabIndex={!isFlipped ? -1 : 0}
              >
                Go to Sign In →
              </button>
            </div>
          ) : (
            /* ── Normal Registration Form ── */
            <>
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

                {/* ── Role-Specific Fields ── */}
                {accountType === 'EMPLOYER' ? (
                  <>
                    <div className={styles.fieldGroup}>
                      <div className={styles.inputWrapper}>
                        <FiBriefcase className={styles.inputIcon} size={16} />
                        <input
                          id="companyName"
                          type="text"
                          required
                          placeholder="Company name *"
                          aria-label="Company name"
                          className={`${styles.input} ${regFieldErrors.company_name ? styles.inputError : ''}`}
                          value={companyName}
                          onChange={(e) => {
                            setCompanyName(e.target.value)
                            setRegFieldErrors((prev) => ({ ...prev, company_name: '' }))
                          }}
                          tabIndex={!isFlipped ? -1 : 0}
                        />
                      </div>
                      {regFieldErrors.company_name && (
                        <span className={styles.fieldErrorText}>{regFieldErrors.company_name}</span>
                      )}
                    </div>

                    <div className={styles.inputRow}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.inputWrapper}>
                          <FiGlobe className={styles.inputIcon} size={16} />
                          <input
                            id="website"
                            type="url"
                            placeholder="Website (https://...)"
                            aria-label="Company website"
                            className={styles.input}
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            tabIndex={!isFlipped ? -1 : 0}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <div className={styles.inputWrapper}>
                          <FiLayers className={styles.inputIcon} size={16} />
                          <select
                            id="companySize"
                            aria-label="Company size"
                            className={styles.select}
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            tabIndex={!isFlipped ? -1 : 0}
                          >
                            <option value="1-10">1–10 employees</option>
                            <option value="11-50">11–50 employees</option>
                            <option value="51-200">51–200 employees</option>
                            <option value="201-500">201–500 employees</option>
                            <option value="500+">500+ employees</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <div className={styles.inputWrapper}>
                        <FiMapPin className={styles.inputIcon} size={16} />
                        <input
                          id="headquarters"
                          type="text"
                          placeholder="Headquarters (e.g. Kochi, Kerala)"
                          aria-label="Headquarters location"
                          className={styles.input}
                          value={headquarters}
                          onChange={(e) => setHeadquarters(e.target.value)}
                          tabIndex={!isFlipped ? -1 : 0}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.fieldGroup}>
                      <div className={styles.inputWrapper}>
                        <FiAward className={styles.inputIcon} size={16} />
                        <input
                          id="headline"
                          type="text"
                          required
                          placeholder="Headline (e.g. Full Stack Developer) *"
                          aria-label="Professional headline"
                          className={`${styles.input} ${regFieldErrors.headline ? styles.inputError : ''}`}
                          value={headline}
                          onChange={(e) => {
                            setHeadline(e.target.value)
                            setRegFieldErrors((prev) => ({ ...prev, headline: '' }))
                          }}
                          tabIndex={!isFlipped ? -1 : 0}
                        />
                      </div>
                      {regFieldErrors.headline && (
                        <span className={styles.fieldErrorText}>{regFieldErrors.headline}</span>
                      )}
                    </div>

                    <div className={styles.inputRow}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.inputWrapper}>
                          <FiPhone className={styles.inputIcon} size={16} />
                          <input
                            id="phone"
                            type="tel"
                            placeholder="Phone number"
                            aria-label="Phone number"
                            className={styles.input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            tabIndex={!isFlipped ? -1 : 0}
                          />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <div className={styles.inputWrapper}>
                          <FiBriefcase className={styles.inputIcon} size={16} />
                          <input
                            id="yearsExp"
                            type="number"
                            min="0"
                            max="50"
                            placeholder="Years exp. (0 for fresher)"
                            aria-label="Years of experience"
                            className={styles.input}
                            value={yearsExp}
                            onChange={(e) => setYearsExp(e.target.value)}
                            tabIndex={!isFlipped ? -1 : 0}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <div className={styles.inputWrapper}>
                        <FiMapPin className={styles.inputIcon} size={16} />
                        <input
                          id="locationStr"
                          type="text"
                          placeholder="Location (e.g. Bangalore, India)"
                          aria-label="Current location"
                          className={styles.input}
                          value={locationStr}
                          onChange={(e) => setLocationStr(e.target.value)}
                          tabIndex={!isFlipped ? -1 : 0}
                        />
                      </div>
                    </div>
                  </>
                )}

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
            </>
          )}
        </div>
      </div>
      <Outlet />
    </div>
  )
}
