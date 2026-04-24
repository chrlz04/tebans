'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import StatCard from '@/components/shared/StatCard'
import DataTable from '@/components/shared/DataTable'
import Badge from '@/components/ui/Badge'
import BillingCycleProgress from './components/BillingCycleProgress'
import type { AdminDashboardStats, User } from '@/types'
import type { Column } from '@/components/shared/DataTable'

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

  const columns: Column<User>[] = [
    {
      key: 'userId',
      label: 'Account ID',
      className: 'w-40',
    },
    {
      key: 'firstName',
      label: 'Full Name',
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'userType',
      label: 'Role',
    },
    {
      key: 'accountStatus',
      label: 'Status',
      render: (row) => <Badge status={row.accountStatus} />,
    },
     {
      key: 'registrationDate', // Matches the property name in your User type
      label: 'Date Registered',
      render: (row) => (
        // Access the correct property name here too
        <span>{new Date(row.registrationDate).toLocaleDateString()}</span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
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
          subtitle={`${data} from last month`}
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Cycle Progress */}
        <div className="lg:col-span-2">
          <BillingCycleProgress progress={data?.billingProgress} isLoading={isLoading} />
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Recent Account Registrations
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Latest accounts added to the system
            </p>
          </div>
          <DataTable
            columns={columns}
            data={data?.recentRegistrations ?? []}
            isLoading={isLoading}
            emptyMessage="No recent registrations found."
            keyExtractor={(row) => row.userId}
            totalCount={data?.recentRegistrations?.length ?? 0}
            itemName="registrations"
          />
        </div>
      </div>
    </div>
  )
}