'use client'

import { useQuery } from '@tanstack/react-query'
import { CreditCard, Users, DollarSign, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import StatCard from '@/components/shared/StatCard'
import type { CashierDashboardStats } from '@/types'

export default function CashierDashboardPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('cashier')

  const { data, isLoading } = useQuery<CashierDashboardStats>({
    queryKey: ['cashier-dashboard'],
    queryFn: async () => {
      const res = await api.get('/cashier/dashboard')
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
          Summary of today's payment activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Collections Today"
          value={
            isLoading
              ? '—'
              : `₱${(data?.totalCollectionsToday ?? 0).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}`
          }
          icon={<DollarSign size={24} />}
          variant="success"
        />
        <StatCard
          label="Transactions Processed"
          value={isLoading ? '—' : (data?.transactionsProcessed ?? 0)}
          icon={<CreditCard size={24} />}
          variant="default"
        />
        <StatCard
          label="Pending Cash Remittance"
          value={
            isLoading
              ? '—'
              : `₱${(data?.pendingCashRemittance ?? 0).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}`
          }
          icon={<Clock size={24} />}
          variant="warning"
        />
        <StatCard
          label="Pending Consumers to Pay"
          value={isLoading ? '—' : (data?.pendingConsumersToPay ?? 0)}
          icon={<Users size={24} />}
          variant="danger"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Transactions
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Today's latest payment activity
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="flex flex-col divide-y divide-gray-100">
            {data.recentTransactions.map((transaction) => (
              <div
                key={transaction.paymentId}
                className="flex items-center justify-between py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.paymentId}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {transaction.consumerId}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <p className="text-sm font-semibold text-gray-900">
                    ₱{(transaction.amountPaid ?? 0).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(transaction.datePaid).toLocaleTimeString('en-PH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400">
            No transactions recorded today.
          </div>
        )}
      </div>
    </div>
  )
}