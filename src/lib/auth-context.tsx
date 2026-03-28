'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import type { AuthResponse } from '@/types'

type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

interface AuthUser {
  userId: string
  role: Role
  token: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (data: AuthResponse) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const roleHomePages: Record<Role, string> = {
  admin: '/admin/dashboard',
  consumer: '/consumer/bills',
  meter_reader: '/meter-reader/consumers',
  cashier: '/cashier/dashboard',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Rehydrate auth state from cookies on page load
    const token = Cookies.get('token')
    const role = Cookies.get('role') as Role | undefined
    const userId = Cookies.get('userId')

    if (token && role && userId) {
      setUser({ token, role, userId })
    }

    setIsLoading(false)
  }, [])

  const login = (data: AuthResponse) => {
    // Store in cookies (expires in 1 day)
    Cookies.set('token', data.token, { expires: 1 })
    Cookies.set('role', data.role, { expires: 1 })
    Cookies.set('userId', data.userId, { expires: 1 })

    setUser({ token: data.token, role: data.role, userId: data.userId })

    // Redirect to role-specific home page
    router.push(roleHomePages[data.role])
  }

  const logout = () => {
    Cookies.remove('token')
    Cookies.remove('role')
    Cookies.remove('userId')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}