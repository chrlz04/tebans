'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import DataTable from '@/components/shared/DataTable'
import Badge from '@/components/ui/Badge'
import type { Bill } from '@/types'
import type { Column } from '@/components/shared/DataTable'

interface CurrentBill {
  amountDue: number
  dueDate: string
  nearDisconnection: boolean
}

export default function MyBillPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('consumer')

  // ── Fetch Current Bill ──
  const { data: currentBill, isLoading: currentLoading } = useQuery<CurrentBill>({
    queryKey: ['consumer-current-bill'],
    queryFn: async () => {
      const res = await api.get('/consumer/bills/current')
      return res.data
    },
    enabled: hasAccess,
  })

  // ── Fetch Billing History ──
  const { data: history, isLoading: historyLoading } = useQuery<Bill[]>({
    queryKey: ['consumer-billing-history'],
    queryFn: async () => {
      const res = await api.get('/consumer/bills/history')
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  const columns: Column<Bill>[] = [
    {
      key: 'billingMonth',
      label: 'Billing Month',
    },
    {
      key: 'meterReadingId',
      label: 'Previous Reading',
      render: () => '—',
    },
    {
      key: 'meterReadingId',
      label: 'Current Reading',
      render: () => '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) =>
        `₱${(row.amount ?? 0).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
        })}`,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) =>
        new Date(row.dueDate).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      render: (row) => <Badge status={row.paymentStatus} />,
    },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Bill</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your current balance and billing history
        </p>
      </div>

      {/* Current Balance Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Current Balance</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">
              {currentLoading
                ? '—'
                : `₱${(currentBill?.amountDue ?? 0).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })}`}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Due on{' '}
              <span className="font-medium text-gray-700">
                {currentLoading
                  ? '—'
                  : currentBill?.dueDate
                  ? new Date(currentBill.dueDate).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </span>
            </p>
          </div>

          {/* Near Disconnection Warning */}
          {currentBill?.nearDisconnection && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
              <AlertTriangle size={16} />
              <span className="font-medium">Near Disconnection</span>
            </div>
          )}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Billing History
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete record of your electricity bills
          </p>
        </div>
        <DataTable
          columns={columns}
          data={history ?? []}
          isLoading={historyLoading}
          emptyMessage="No billing records found."
          keyExtractor={(row) => row.billId}
        />
      </div>
    </div>
  )
}