import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { authApi, clearSession, etudiantApi, getRefreshToken, persistSession } from '@/api'
import type { AuthResponse, LoginPayload, RegisterPayload, Student } from '@/types/domain'

export interface AuthContextType {
  user: Student | null
  loading: boolean
  login: (credentials: LoginPayload) => Promise<AuthResponse>
  register: (payload: RegisterPayload) => Promise<AuthResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: Student | null) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await etudiantApi.me()
      setUser(data)
    } catch (error) {
      clearSession()
      setUser(null)
      throw error
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      if (!getRefreshToken()) {
        setLoading(false)
        return
      }

      try {
        await refreshUser()
      } catch (error) {
        // Session cleared in refreshUser.
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [refreshUser])

  const login = useCallback(async (credentials: LoginPayload) => {
    const { data } = await authApi.login(credentials)
    persistSession(data)
    setUser(data.etudiant)
    return data
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await authApi.register(payload)
    persistSession(data)
    setUser(data.etudiant)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout(getRefreshToken())
    } catch (error) {
      // We clear the local session even if the backend call fails.
    } finally {
      clearSession()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [loading, login, logout, refreshUser, register, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
