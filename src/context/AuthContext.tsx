import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, setTokens, clearTokens, getRefreshToken } from '@/api/client'
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

  // On mount, attempt silent refresh if we have a stored refresh token
  useEffect(() => {
    const init = async () => {
      const refresh = getRefreshToken()
      if (!refresh) {
        setIsLoading(false)
        return
      }
      try {
        const { access } = await refreshTokenApi(refresh)
        setTokens(access, refresh)
        const me = await getMeApi()
        setUser(me)
      } catch {
        clearTokens()
      } finally {
        setIsLoading(false)
      }
    }
    init()
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
