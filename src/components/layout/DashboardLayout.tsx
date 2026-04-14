'use client'

import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

interface DashboardLayoutProps {
  role: Role
  children: React.ReactNode
}

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileSidebarOpen])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role={role}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}