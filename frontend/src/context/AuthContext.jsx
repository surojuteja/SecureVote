import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [voter, setVoter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('sv_token'))

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/auth/me')
      if (res.data.success) {
        setUser(res.data.data)
        if (res.data.data.voter) {
          setVoter(res.data.data.voter)
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      localStorage.removeItem('sv_token')
      setToken(null)
      setUser(null)
      setVoter(null)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = (accessToken, userData, voterData = null) => {
    localStorage.setItem('sv_token', accessToken)
    setToken(accessToken)
    setUser(userData)
    if (voterData) setVoter(voterData)
  }

  const logout = () => {
    localStorage.removeItem('sv_token')
    setToken(null)
    setUser(null)
    setVoter(null)
  }

  const isAdmin = user?.role === 'ADMIN'
  const isVoter = user?.role === 'VOTER'

  return (
    <AuthContext.Provider value={{
      user, voter, token, loading,
      login, logout, isAdmin, isVoter, fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
