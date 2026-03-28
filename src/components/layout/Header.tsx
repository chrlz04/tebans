'use client'

import { Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  userName?: string
}

export default function Header({ title, userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-4">
        <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={20} />
        </button>
        {userName && (
          <span className="text-sm text-gray-700 font-medium">{userName}</span>
        )}
      </div>
    </header>
  )
}