import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input, Button } from '@/components/ui'
import { useRegister } from '@/hooks/queries/useAuthQueries'
import { extractApiError, extractFieldErrors } from '@/api/utils'
import styles from './Register.module.css'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountType, setAccountType] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER')
  
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const registerMutation = useRegister()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setFieldErrors({})
    
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" })
      return
    }
    
    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
        password_confirm: confirmPassword,
        account_type: accountType
      })
      navigate('/login')
    } catch (err: any) {
      const fieldErrs = extractFieldErrors(err)
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs)
      } else {
        setGeneralError(extractApiError(err) || 'Registration failed')
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create your account</h2>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.accountTypeContainer}>
            <span className={styles.accountTypeLabel}>I am a...</span>
            <div className={styles.accountTypeOptions}>
              <div 
                className={`${styles.accountTypeOption} ${accountType === 'SEEKER' ? styles.selected : ''}`}
                onClick={() => setAccountType('SEEKER')}
              >
                <span className={styles.accountTypeTitle}>Job Seeker</span>
                <span className={styles.accountTypeDesc}>Looking for work</span>
              </div>
              <div 
                className={`${styles.accountTypeOption} ${accountType === 'EMPLOYER' ? styles.selected : ''}`}
                onClick={() => setAccountType('EMPLOYER')}
              >
                <span className={styles.accountTypeTitle}>Employer</span>
                <span className={styles.accountTypeDesc}>Hiring talent</span>
              </div>
            </div>
          </div>

          <Input 
            label="Full Name" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <Input 
            label="Email" 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <Input 
            label="Password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <Input 
            label="Confirm Password" 
            type="password" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
          />
          
          <Button variant="primary" type="submit" loading={registerMutation.isPending} disabled={registerMutation.isPending}>
            Create account
          </Button>
          
          {generalError && <div className={styles.error}>{generalError}</div>}
        </form>
        
        <div className={styles.footer}>
          <Link to="/login" className={styles.loginLink}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
