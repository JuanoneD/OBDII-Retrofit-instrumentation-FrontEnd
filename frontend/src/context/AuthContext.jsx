import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { logoutUser } from '../services/authService.js'

const TOKEN_STORAGE_KEY = 'obdii.authToken'
const AuthContext = createContext(null)

function readStoredToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken)

  const authenticate = useCallback((nextToken) => {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken)
    setToken(nextToken)
  }, [])

  const clearSession = useCallback(() => {
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken('')
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token) {
        await logoutUser(token)
      }
    } finally {
      clearSession()
    }
  }, [clearSession, token])

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      authenticate,
      clearSession,
      logout,
    }),
    [authenticate, clearSession, logout, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }

  return context
}
