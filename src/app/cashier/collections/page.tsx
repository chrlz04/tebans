'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import DataTable from '@/components/shared/DataTable'
import DateRangePicker from '@/components/shared/DateRangePicker'
import StatCard from '@/components/shared/StatCard'
import Button from '@/components/ui/Button'
import type { Column } from '@/components/shared/DataTable'

interface CollectionRecord {
  paymentId:     string
  consumerName:  string
  amountPaid:    number
  datePaid:      string
  paymentMethod: string
  receiptNumber: string
}

export default function CollectionReportsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('cashier')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: collections, isLoading } = useQuery<CollectionRecord[]>({
    queryKey: ['cashier-collections', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/cashier/collections', {
        params: { startDate, endDate },
      })
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  const totalCollections =
    collections?.reduce((sum, c) => sum + (c.amountPaid ?? 0), 0) ?? 0
  const totalRecords = collections?.length ?? 0

  // ── CSV Export ──
  const handleExport = () => {
    if (!collections || collections.length === 0) return

    const headers = [
      'Receipt No.',
      'Consumer Name',
      'Amount Paid',
      'Date Paid',
      'Payment Method',
    ]

    const rows = collections.map((c) => [
      c.receiptNumber,
      c.consumerName,
      c.amountPaid.toFixed(2),
      new Date(c.datePaid).toLocaleDateString('en-PH'),
      c.paymentMethod,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `collections-${startDate || 'all'}-${endDate || 'all'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Collection Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and export payment collection records
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-white rounded-xl border border-primary-500 border-l-[6px] p-6 flex flex-col shadow-sm">
          <span className="text-sm text-gray-500 font-medium">Total Collections</span>
          <span className="text-3xl font-bold text-gray-900 mt-1 whitespace-nowrap">
            {isLoading
              ? '—'
              : `₱${totalCollections.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}`}
          </span>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-primary-500 border-l-[6px] p-6 flex flex-col sm:items-end shadow-sm">
          <span className="text-sm text-gray-500 font-medium">Total Records</span>
          <span className="text-3xl font-bold text-gray-900 mt-1">
            {isLoading ? '—' : totalRecords}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-2">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Collection Records</h2>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading records...</div>
        ) : !collections || collections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
            No collection records found.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {collections.map((record) => (
              <div
                key={record.paymentId}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-xs text-gray-500 block">Transaction ID</span>
                      <span className="font-bold text-gray-900">{record.receiptNumber}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Date & Time</span>
                      <span className="text-gray-900">
                        {new Date(record.datePaid).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} &bull; {new Date(record.datePaid).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Consumer Name</span>
                      <span className="font-bold text-gray-900">{record.consumerName}</span>
                    </div>
                  </div>
                  <div className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full self-start">
                    Paid
                  </div>
                </div>

                <hr className="border-t border-gray-100 my-3" />

                <div>
                  <span className="text-xs text-gray-500 block">Amount Paid</span>
                  <span className="text-2xl font-bold text-primary-500 mt-1 block whitespace-nowrap">
                    ₱{record.amountPaid?.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}