import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '@/api/client'
import type { User, LoginRequest, RegisterRequest } from '@/api/types'
import { loginApi, registerApi, logoutApi, getMeApi, refreshTokenApi } from '@/api/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
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

  const login = useCallback(async (data: LoginRequest) => {
    const response = await loginApi(data)
    setTokens(response.access, response.refresh)
    const me = await getMeApi()
    setUser(me)
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    await registerApi(data)
    // After registration, auto-login
    const loginResp = await loginApi({ email: data.email, password: data.password })
    setTokens(loginResp.access, loginResp.refresh)
    const me = await getMeApi()
    setUser(me)
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
