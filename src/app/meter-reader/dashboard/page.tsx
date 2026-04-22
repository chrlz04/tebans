'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, AlertTriangle, DollarSign } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import type { MeterReaderDashboardStats } from '@/types'

function MeterReaderStatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl border border-[#81A858] border-l-[12px] p-4 shadow-sm h-full">
      <div className="bg-[#81A858] text-white p-3 rounded-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 whitespace-nowrap">{value}</p>
      </div>
    </div>
  )
}

export default function MeterReaderDashboardPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')

  const { data, isLoading } = useQuery<MeterReaderDashboardStats>({
    queryKey: ['meter-reader-dashboard'],
    queryFn: async () => {
      const res = await api.get('/meter-reader/dashboard')
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Summary of consumers and activity in your assigned area
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl">
        <MeterReaderStatCard
          label="Total Consumers"
          value={isLoading ? '—' : (data?.totalConsumers ?? 0)}
          icon={<Users size={24} />}
        />
        <MeterReaderStatCard
          label="Payment Collections"
          value={
            isLoading
              ? '—'
              : `₱${Number(data?.paymentCollections ?? 0).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}`
          }
          icon={<DollarSign size={24} />}
        />
        <MeterReaderStatCard
          label="Inactive Accounts"
          value={isLoading ? '—' : (data?.inactiveAccounts ?? 0)}
          icon={<AlertTriangle size={24} />}
        />
      </div>

    </div>
  )
}
