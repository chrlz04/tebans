'use client'

import { useState } from 'react'
import { User, LogOut, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  consumer: 'Consumer',
  meter_reader: 'Meter Reader',
  cashier: 'Cashier',
}

interface TopBarProps {
  onToggleMobileSidebar: () => void
}

export default function TopBar({ onToggleMobileSidebar }: TopBarProps) {
  const { user } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()

  const roleLabel = user ? (roleLabels[user.role] ?? '') : ''

  const handleLogout = () => {
    // Logic carried over from Sidebar
    Cookies.remove('token')
    Cookies.remove('role')
    setIsDropdownOpen(false)
    router.push('/login')
  }

  return (
    <header className="flex items-center justify-between md:justify-end px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shrink-0 h-16">
      
      {/* Sidebar Toggle & Branding */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={onToggleMobileSidebar}
          className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white shrink-0 hover:bg-primary-600 transition-colors focus:outline-none"
        >
          <Zap size={16} />
        </button>
        <h1 className="text-sm font-bold text-gray-900 leading-none">TEBANS</h1>
      </div>

      {/* User Info Container */}
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 sm:gap-3 p-1 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'System User'}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0">
            <User size={18} />
          </div>
        </button>

        {/* Logout Popup/Dropdown */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}