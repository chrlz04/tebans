'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import type { AuthResponse } from '@/types'

type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

interface AuthUser {
  userId: string
  role: Role
  token: string
  name: string
  mustChangePassword?: boolean
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
  meter_reader: '/meter-reader/dashboard',
  cashier: '/cashier/dashboard',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    // Rehydrate auth state from cookies on page load
    const role = Cookies.get('role') as Role | undefined
    const userId = Cookies.get('userId')
    const name = Cookies.get('name')
    const mustChangePassword = Cookies.get('mustChangePassword') === 'true'

    // Only hydrate if we have metadata - token is HttpOnly now
    if (role && userId && name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser({ token: '', role, userId, name, mustChangePassword })
    }

    setIsLoading(false)
  }, [])

  const login = (data: AuthResponse) => {
    // Note: token is no longer stored by client, it's HTTPOnly
    Cookies.set('role', data.role, { expires: 1 })
    Cookies.set('userId', data.userId, { expires: 1 })
    Cookies.set('name', data.name, { expires: 1 })

    if (data.mustChangePassword) {
      Cookies.set('mustChangePassword', 'true', { expires: 1 })
    } else {
      Cookies.remove('mustChangePassword')
    }

    // token field is now empty on the client side
    setUser({
      token: '',
      role: data.role,
      userId: data.userId,
      name: data.name,
      mustChangePassword: data.mustChangePassword
    })

    // Redirect to role-specific home page or change password
    if (data.mustChangePassword) {
      router.push('/change-password')
    } else {
      router.push(roleHomePages[data.role])
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    Cookies.remove('role')
    Cookies.remove('userId')
    Cookies.remove('name')
    Cookies.remove('mustChangePassword')
    setUser(null)
    queryClient.clear()
    window.location.replace('/login')
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