import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (getToken()) {
        try {
          const { user } = await api.me()
          setUser(user)
        } catch {
          setToken(null)
        }
      }
      setLoading(false)
    })()
  }, [])

  const login = async (creds) => {
    const { token, user } = await api.login(creds)
    setToken(token)
    setUser(user)
    return user
  }
  const adminLogin = async (creds) => {
    const { token, user } = await api.adminLogin(creds)
    setToken(token)
    setUser(user)
    return user
  }
  const register = async (data) => {
    const { token, user } = await api.register(data)
    setToken(token)
    setUser(user)
    return user
  }
  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, setUser, loading, login, adminLogin, register, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
