'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import StatCard from '@/components/shared/StatCard'
import Badge from '@/components/ui/Badge'
import BillingCycleProgress from './components/BillingCycleProgress'
import PaymentCollectionProgress from './components/PaymentCollectionProgress'
import type { AdminDashboardStats, User } from '@/types'

// Helper to get initials
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

// Helper to format date "Apr 10"
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Helper to capitalize role
const capitalize = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ')
}

export default function AdminDashboardPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('admin')

  const { data, isLoading } = useQuery<AdminDashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard')
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of the system's current state
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Active Consumers"
          value={isLoading ? '—' : (data?.totalActiveConsumers ?? 0).toLocaleString()}
          icon={<Users size={24} />}
          subtitle={`Updated currently`}
          variant="success"
        />
        <StatCard
          label="Pending Disconnections"
          value={isLoading ? '—' : (data?.pendingDisconnections ?? 0).toLocaleString()}
          icon={<AlertTriangle size={24} />}
          subtitle="Requires immediate action"
          variant="danger"
        />
      </div>

      {/* Bottom Row: Progress Cards + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Cards — stacked vertically, spanning 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <BillingCycleProgress progress={data?.billingProgress} isLoading={isLoading} />
          <PaymentCollectionProgress progress={data?.paymentProgress} isLoading={isLoading} />
        </div>

        {/* Recent Registrations */}
        <div className="bg-card rounded-xl border border-border p-6 lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Recent Account Registrations
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Latest accounts added to the system
            </p>
          </div>
          <div className="flex flex-col">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading registrations...</div>
            ) : !data?.recentRegistrations || data.recentRegistrations.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No recent registrations found.</div>
            ) : (
              data.recentRegistrations.map((user, index) => (
                <div
                  key={user.userId}
                  className={`flex flex-row items-center justify-between py-3 ${
                    index !== 0 ? 'border-t border-border/50' : ''
                  }`}
                >
                  {/* Left Side */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {user.userId} &middot; {capitalize(user.userType)}
                      </p>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                    <Badge status={user.accountStatus} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(user.registrationDate)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}