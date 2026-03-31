'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Zap,
  AlertTriangle,
  User,
  Settings,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

type Role = 'admin' | 'consumer' | 'meter_reader' | 'cashier'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Manage Accounts', href: '/admin/accounts', icon: <Users size={18} /> },
    { label: 'Create Staff', href: '/admin/staff/new', icon: <UserPlus size={18} /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
  ],
  consumer: [
    { label: 'My Bill', href: '/consumer/bills', icon: <FileText size={18} /> },
    { label: 'Payment History', href: '/consumer/payments', icon: <CreditCard size={18} /> },
    { label: 'Profile', href: '/consumer/profile', icon: <User size={18} /> },
  ],
  meter_reader: [
    { label: 'Consumers', href: '/meter-reader/consumers', icon: <Users size={18} /> },
    { label: 'Record Reading', href: '/meter-reader/readings/new', icon: <Zap size={18} /> },
    { label: 'Disconnections', href: '/meter-reader/disconnections', icon: <AlertTriangle size={18} /> },
    { label: 'Payment Collection', href: '/meter-reader/payments', icon: <CreditCard size={18} /> },
    { label: 'Settings', href: '/meter-reader/settings', icon: <Settings size={18} /> },
  ],
  cashier: [
    { label: 'Dashboard', href: '/cashier/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Process Payment', href: '/cashier/payments/new', icon: <CreditCard size={18} /> },
    { label: 'Collection Reports', href: '/cashier/collections', icon: <FileText size={18} /> },
    { label: 'Settings', href: '/cashier/settings', icon: <Settings size={18} /> },
  ],
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  consumer: 'Consumer',
  meter_reader: 'Meter Reader',
  cashier: 'Cashier',
}

export default function Sidebar({ role }: { role: Role }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const items = navItems[role]

  return (
    <aside 
      className={clsx(
        "flex flex-col min-h-screen bg-white border-r border-gray-200 py-6 transition-all duration-300 relative",
        isCollapsed ? "w-20 px-3" : "w-64 px-4"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 bg-white border border-gray-200 rounded-full p-1 text-gray-500 hover:text-gray-900 shadow-sm z-10"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo / System Name */}
      <div className={clsx("mb-8 flex items-center", isCollapsed ? "justify-center" : "px-2 gap-3")}>
        <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white shrink-0">
          <Zap size={18} />
        </div>
        {!isCollapsed && (
          <div className="whitespace-nowrap overflow-hidden">
            <h1 className="text-base font-semibold text-gray-900 leading-tight">TEBANS</h1>
            <p className="text-xs text-gray-500">{role === 'admin' ? 'Admin Portal' : roleLabels[role]}</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={clsx(
              'flex items-center rounded-lg text-sm transition-colors',
              isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5',
              pathname === item.href
                ? role === 'admin'
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <div className="shrink-0">{item.icon}</div>
            {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <p className="text-xs text-gray-400 px-2 mt-4 whitespace-nowrap overflow-hidden">
          © 2026 TEBANS System
        </p>
      )}
    </aside>
  )
}