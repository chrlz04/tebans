'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import DataTable from '@/components/shared/DataTable'
import SearchBar from '@/components/shared/SearchBar'
import type { Payment } from '@/types'
import type { Column } from '@/components/shared/DataTable'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function PaymentHistoryPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('consumer')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState<string>(String(currentYear))

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['consumer-payments', search, year],
    queryFn: async () => {
      const res = await api.get('/consumer/payments', {
        params: { search, year },
      })
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  const columns: Column<Payment>[] = [
    {
      key: 'datePaid',
      label: 'Date Paid',
      render: (row) =>
        new Date(row.datePaid).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      key: 'receiptNumber',
      label: 'Receipt No.',
      render: (row) => (
        <span className="font-mono text-xs">{row.receiptNumber}</span>
      ),
    },
    {
      key: 'billId',
      label: 'Bill Reference',
      render: (row) => (
        <span className="font-mono text-xs">{row.billId}</span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
    },
    {
      key: 'amountPaid',
      label: 'Amount Paid',
      render: (row) =>
        `₱${(row.amountPaid ?? 0).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
        })}`,
    },
  ]

  const totalPaid = payments?.reduce((sum, p) => sum + (p.amountPaid ?? 0), 0) ?? 0

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Payment History</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete record of your payment transactions
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by receipt number..."
            className="flex-1 max-w-sm"
          />
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={payments ?? []}
          isLoading={isLoading}
          emptyMessage="No payment records found."
          keyExtractor={(row) => row.paymentId}
        />

        {/* Summary */}
        {!isLoading && payments && payments.length > 0 && (
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Total Paid:{' '}
              <span className="font-semibold text-gray-900">
                ₱{totalPaid.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}