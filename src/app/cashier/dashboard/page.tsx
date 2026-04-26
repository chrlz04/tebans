'use client'

import { useQuery } from '@tanstack/react-query'
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import type { CashierDashboardStats } from '@/types'
import CashierCollectionProgress from './components/CashierCollectionProgress'

function CashierStatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 bg-card rounded-2xl border border-[#81A858] border-l-[12px] p-4 shadow-sm h-full">
      <div className="bg-[#81A858] text-white p-3 rounded-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-foreground whitespace-nowrap">{value}</p>
      </div>
    </div>
  )
}

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
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Summary of today's payment activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-12xl">
        <CashierStatCard
          label="Total Collections Today"
          value={
            isLoading
              ? '—'
              : `₱${Number(data?.totalCollectionsToday ?? 0).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}`
          }
          icon={<DollarSign size={24} />}
        />
        <CashierStatCard
          label="Transactions Processed"
          value={isLoading ? '—' : (data?.transactionsProcessed ?? 0)}
          icon={<CreditCard size={24} />}
        />
        <CashierStatCard
          label="Pending Cash Remittance"
          value={
            isLoading
              ? '—'
              : `₱${Number(data?.pendingCashRemittance ?? 0).toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}`
          }
          icon={<TrendingUp size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Progress */}
        <div className="lg:col-span-2">
          <CashierCollectionProgress progress={data?.collectionProgress} isLoading={isLoading} />
        </div>

      {/* Recent Transactions */}
      <div className="lg:col-span-1">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">
            Recent Transactions (Today)
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-2xl border border-border" />
            ))}
          </div>
        ) : data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.recentTransactions.map((transaction) => (
              <div
                key={transaction.paymentId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-card rounded-2xl border border-border shadow-sm gap-2"
              >
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(transaction.datePaid).toLocaleTimeString('en-PH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-base text-foreground">
                    {transaction.consumerName}
                  </p>
                </div>
                <div className="flex items-center sm:justify-end">
                  <p className="text-lg font-bold text-[#81A858] whitespace-nowrap">
                    ₱{Number(transaction.amountPaid ?? 0).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No transactions recorded today.
          </div>
        )}
      </div>
      </div>
    </div>
  )
}