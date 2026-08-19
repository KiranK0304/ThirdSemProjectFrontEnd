import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input, Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { extractApiError } from '@/api/utils'
import styles from './Login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    
    try {
      await login({ email, password })
      navigate('/jobs')
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Welcome back</h2>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input 
            label="Email" 
            type="email" 
            required 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
          />
          <Input 
            label="Password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
          />

          <div className={styles.errorSlot} aria-live="polite">
            {error && <div className={styles.error} role="alert">{error}</div>}
          </div>
          
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Sign in
          </Button>
        </form>
        
        <div className={styles.footer}>
          <Link to="/register" className={styles.registerLink}>
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  )
}
