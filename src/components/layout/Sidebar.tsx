'use client'

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
  LogOut,
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
  const pathname = usePathname()
  const router = useRouter()
  const items = navItems[role]

  const handleLogout = () => {
    Cookies.remove('token')
    Cookies.remove('role')
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 px-4 py-6">
      {/* Logo / System Name */}
      <div className="mb-8 px-2">
        <h1 className="text-lg font-semibold text-gray-900">TEBANS</h1>
        <p className="text-xs text-gray-500 mt-0.5">{roleLabels[role]}</p>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === item.href
                ? role === 'admin'
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors mt-4"
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  )
}