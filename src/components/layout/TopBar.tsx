'use client'

import { Search, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  consumer: 'Consumer',
  meter_reader: 'Meter Reader',
  cashier: 'Cashier',
}

export default function TopBar() {
  const { user } = useAuth()
  const roleLabel = user ? (roleLabels[user.role] ?? '') : ''

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
      {/* Search */}
      <div className="relative w-96">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search accounts, consumers, or transactions..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
        />
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Admin User</p>
          <p className="text-xs text-gray-500">{roleLabel}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0">
          <User size={18} />
        </div>
      </div>
    </header>
  )
}
