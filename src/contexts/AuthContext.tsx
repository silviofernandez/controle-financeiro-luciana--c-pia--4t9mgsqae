import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
}

interface AuthContextData {
  user: User | null
  isLoading: boolean
  signIn: (email: string, pass: string) => Promise<void>
  signUp: (email: string, pass: string) => Promise<void>
  signOut: () => void
  recoverPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const useAuth = () => useContext(AuthContext)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('@financeiro:user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('@financeiro:user')
      }
    }
    setIsLoading(false)
  }, [])

  const isMock = !SUPABASE_URL || SUPABASE_URL.includes('mock-project')

  const signIn = async (email: string, pass: string) => {
    if (isMock) {
      await new Promise((r) => setTimeout(r, 800))
      if (pass === 'wrong') throw new Error('Credenciais inválidas.')
      const mockUser = { id: crypto.randomUUID(), email }
      setUser(mockUser)
      localStorage.setItem('@financeiro:user', JSON.stringify(mockUser))
      return
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: pass }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error_description || data.msg || 'Erro ao entrar.')
    }

    const data = await res.json()
    const newUser = { id: data.user.id, email: data.user.email }
    setUser(newUser)
    localStorage.setItem('@financeiro:user', JSON.stringify(newUser))
  }

  const signUp = async (email: string, pass: string) => {
    if (isMock) {
      await new Promise((r) => setTimeout(r, 800))
      const mockUser = { id: crypto.randomUUID(), email }
      setUser(mockUser)
      localStorage.setItem('@financeiro:user', JSON.stringify(mockUser))
      return
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password: pass }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error_description || data.msg || 'Erro ao registrar.')
    }

    const data = await res.json()
    // For auto-confirm setups, user might be returned directly
    if (data.user) {
      const newUser = { id: data.user.id, email: data.user.email }
      setUser(newUser)
      localStorage.setItem('@financeiro:user', JSON.stringify(newUser))
    } else {
      toast({ title: 'Aviso', description: 'Verifique seu e-mail para confirmar a conta.' })
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('@financeiro:user')
  }

  const recoverPassword = async (email: string) => {
    if (isMock) {
      await new Promise((r) => setTimeout(r, 800))
      return
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error_description || data.msg || 'Erro ao solicitar recuperação.')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
