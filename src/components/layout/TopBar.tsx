'use client'

import { useState } from 'react'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  consumer: 'Consumer',
  meter_reader: 'Meter Reader',
  cashier: 'Cashier',
}

export default function TopBar() {
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
    <header className="flex items-center justify-end px-6 py-3 bg-white border-b border-gray-200 shrink-0">
      
      {/* User Info Container */}
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
        >
          <div className="text-right">
            {/* Added a fallback to use user.name if available in your auth context */}
            <p className="text-sm font-medium text-gray-900">{user?.name || 'System User'}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0">
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