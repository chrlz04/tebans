'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Zap,
  AlertTriangle, MessageSquare,
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
    { label: 'Dashboard', href: '/meter-reader/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Consumers', href: '/meter-reader/consumers', icon: <Users size={18} /> },
    { label: 'Disconnections', href: '/meter-reader/disconnections', icon: <AlertTriangle size={18} /> },
    { label: 'Send SMS', href: '/meter-reader/sms', icon: <MessageSquare size={18} /> },
  ],
  cashier: [
    { label: 'Dashboard', href: '/cashier/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Process Payment', href: '/cashier/payments/new', icon: <CreditCard size={18} /> },
    { label: 'Collection Reports', href: '/cashier/collections', icon: <FileText size={18} /> },
  ],
}

const roleLabels: Record<Role, string> = {
  admin: 'Administrator',
  consumer: 'Consumer',
  meter_reader: 'Meter Reader',
  cashier: 'Cashier',
}

interface SidebarProps {
  role: Role
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export default function Sidebar({ role, isMobileOpen, onCloseMobile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const items = navItems[role]

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileOpen) {
      onCloseMobile()
    }
  }, [pathname])

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isMobileOpen, onCloseMobile])

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 py-6 transition-all duration-300 md:relative md:translate-x-0",
          isCollapsed ? "w-[var(--sidebar-width-collapsed)] px-3" : "w-[var(--sidebar-width)] px-4",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Branding / Logo */}
        <div className={clsx(
          "flex items-center mb-6",
          isCollapsed ? "justify-center" : "justify-start px-2 gap-3"
        )}>
          <Link
            href={items[0]?.href || '/'}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Zap size={16} />
            </div>
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-gray-900 leading-none tracking-tight">
                TEBANS
              </h1>
            )}
          </Link>
        </div>

        {/* Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-7 bg-white border border-gray-200 rounded-full p-1 text-gray-500 hover:text-gray-900 shadow-sm z-10"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1 mt-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={isCollapsed ? item.label : undefined}
            className={clsx(
              'flex items-center rounded-lg text-sm transition-colors',
              isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5',
              pathname === item.href
                ? 'bg-primary-50 text-primary-700 font-medium'
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
    </>
  )
}