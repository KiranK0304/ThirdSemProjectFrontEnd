import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoadingSpinner } from '@/components/ui'

interface RequireAuthProps {
  role?: 'EMPLOYER' | 'SEEKER'
  children: React.ReactNode
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.account_type !== role) {
    // Wrong role — redirect to the correct dashboard
    const redirect = user.account_type === 'EMPLOYER' ? '/employer/dashboard' : '/seeker/dashboard'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}

/** Redirect authenticated users away from login/register */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    const redirect = user.account_type === 'EMPLOYER' ? '/employer/dashboard' : '/seeker/dashboard'
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}
