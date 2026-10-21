import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '../services/api'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
  type LoginInput,
  type RegisterInput,
} from '../services/authService'
import type { User } from '../types/api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const setSignedIn = useCallback((u: User) => {
    setUser(u)
    setStatus('authenticated')
  }, [])

  const setSignedOut = useCallback(() => {
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  // Restore the session from the HTTP-only cookie on first load
  useEffect(() => {
    let cancelled = false
    fetchCurrentUser()
      .then((u) => {
        if (!cancelled) setSignedIn(u)
      })
      .catch(() => {
        if (!cancelled) setSignedOut()
      })
    return () => {
      cancelled = true
    }
  }, [setSignedIn, setSignedOut])

  useEffect(() => {
    setUnauthorizedHandler(setSignedOut)
    return () => setUnauthorizedHandler(null)
  }, [setSignedOut])

  const login = useCallback(
    async (input: LoginInput) => {
      setSignedIn(await loginRequest(input))
    },
    [setSignedIn],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      setSignedIn(await registerRequest(input))
    },
    [setSignedIn],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setSignedOut()
    }
  }, [setSignedOut])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
