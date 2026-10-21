import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/api/client'
import type { User, LoginRequest, RegisterRequest } from '@/api/types'
import { loginApi, registerApi, logoutApi, getMeApi, refreshTokenApi } from '@/api/auth'

export interface RegisterResult {
  email: string
  user?: User
  autoLoggedIn?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (data: LoginRequest) => Promise<User>
  register: (data: RegisterRequest) => Promise<RegisterResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, restore session:
  // 1. If access token is in localStorage, fetch profile directly (no refresh latency/rotation)
  // 2. If access token is expired or missing, attempt refresh using stored refresh token
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const access = getAccessToken()
      const refresh = getRefreshToken()

      if (!access && !refresh) {
        if (isMounted) setIsLoading(false)
        return
      }

      // If we have an access token, try fetching profile directly
      if (access) {
        try {
          const me = await getMeApi()
          if (isMounted) {
            setUser(me)
            setIsLoading(false)
          }
          return
        } catch {
          // Access token may have expired, fall through to refresh
        }
      }

      // If access token was missing or expired, attempt refresh
      if (refresh) {
        try {
          const data = await refreshTokenApi(refresh)
          setTokens(data.access, data.refresh || refresh)
          const me = await getMeApi()
          if (isMounted) {
            setUser(me)
          }
        } catch {
          clearTokens()
          if (isMounted) setUser(null)
        }
      } else {
        clearTokens()
        if (isMounted) setUser(null)
      }

      if (isMounted) setIsLoading(false)
    }

    init()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (data: LoginRequest): Promise<User> => {
    const response = await loginApi(data)
    setTokens(response.access, response.refresh)
    try {
      const me = await getMeApi()
      setUser(me)
      return me
    } catch (profileError) {
      if (response.user) {
        const basicUser: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          account_type: response.user.account_type,
          is_active: true,
          is_staff: Boolean((response.user as any).is_staff),
          is_email_verified: Boolean((response.user as any).is_email_verified),
          date_joined: new Date().toISOString(),
          employer_profile: null,
          seeker_profile: null,
        }
        setUser(basicUser)
        return basicUser
      }
      throw profileError
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest): Promise<RegisterResult> => {
    const response = await registerApi(data)
    if (response.tokens?.access && response.user?.is_email_verified) {
      setTokens(response.tokens.access, response.tokens.refresh)
      try {
        const me = await getMeApi()
        setUser(me)
        return { email: data.email, user: me, autoLoggedIn: true }
      } catch {
        setUser(response.user)
        return { email: data.email, user: response.user, autoLoggedIn: true }
      }
    }
    return { email: data.email, autoLoggedIn: false }
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    try {
      if (refresh) {
        await logoutApi(refresh)
      }
    } catch {
      // Ignore errors on logout
    } finally {
      clearTokens()
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMeApi()
      setUser(me)
    } catch {
      // Ignore
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
