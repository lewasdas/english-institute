import { createContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabase.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (session) => {
    if (!session) {
      setUser(null)
      setRole(null)
      setBalance(0)
      setLoading(false)
      return
    }

    try {
      const { data } = await axios.get('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      setUser({ ...session.user, full_name: data.full_name, avatar_url: data.avatar_url })
      setRole(data.role)
      setBalance(data.balance ?? 0)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setUser(session.user)
      setRole(null)
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchProfile(session)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setBalance(0)
  }

  return (
    <AuthContext.Provider value={{ user, role, balance, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
