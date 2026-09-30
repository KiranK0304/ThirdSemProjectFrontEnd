import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { verifyEmailApi, resendVerificationApi } from '@/api/auth'
import { FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import { LoadingSpinner } from '@/components/ui'
import styles from './Auth.module.css'

type VerifyState = 'loading' | 'success' | 'already_verified' | 'error'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerifyState>('loading')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token provided. Please check your email link.')
      return
    }

    const verify = async () => {
      try {
        const res = await verifyEmailApi(token)
        if (res.detail.toLowerCase().includes('already verified')) {
          setState('already_verified')
          setMessage(res.detail)
        } else {
          setState('success')
          setMessage(res.detail)
        }
      } catch (err: any) {
        setState('error')
        const detail = err?.response?.data?.detail
        setMessage(detail || 'Verification failed. The link may be expired or invalid.')
      }
    }

    verify()
  }, [token])

  const handleResend = async () => {
    setResending(true)
    setResendMsg(null)
    try {
      // We don't know the email here, so prompt user to go to login
      setResendMsg('Please go to the login page and use "Resend verification email" there.')
    } catch {
      setResendMsg('Failed to resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className={styles.verifyPage}>
        <LoadingSpinner size="lg" />
        <p className={styles.verifyPageText} style={{ marginTop: 20 }}>Verifying your email...</p>
      </div>
    )
  }

  if (state === 'success' || state === 'already_verified') {
    return (
      <div className={styles.verifyPage}>
        <div className={`${styles.verifyPageIcon} ${styles.verifyPageIconSuccess}`}>
          <FiCheckCircle size={36} />
        </div>
        <h1 className={styles.verifyPageTitle}>
          {state === 'success' ? 'Email Verified!' : 'Already Verified'}
        </h1>
        <p className={styles.verifyPageText}>{message}</p>
        <button
          className={styles.verifyPageBtn}
          onClick={() => navigate('/login', { replace: true })}
        >
          <span>Go to Sign In</span>
          <FiArrowRight size={16} />
        </button>
      </div>
    )
  }

  // Error state
  return (
    <div className={styles.verifyPage}>
      <div className={`${styles.verifyPageIcon} ${styles.verifyPageIconError}`}>
        <FiAlertCircle size={36} />
      </div>
      <h1 className={styles.verifyPageTitle}>Verification Failed</h1>
      <p className={styles.verifyPageText}>{message}</p>
      <button
        className={styles.verifyPageBtn}
        onClick={() => navigate('/login', { replace: true })}
      >
        <span>Go to Sign In</span>
        <FiArrowRight size={16} />
      </button>
    </div>
  )
}
