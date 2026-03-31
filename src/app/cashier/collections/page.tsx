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

  const columns: Column<CollectionRecord>[] = [
    {
      key: 'receiptNumber',
      label: 'Receipt No.',
      render: (row) => (
        <span className="font-mono text-xs">{row.receiptNumber}</span>
      ),
    },
    {
      key: 'consumerName',
      label: 'Consumer Name',
    },
    {
      key: 'amountPaid',
      label: 'Amount Paid',
      render: (row) =>
        `₱${(row.amountPaid ?? 0).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
        })}`,
    },
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
      key: 'paymentMethod',
      label: 'Payment Method',
    },
  ]

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Collections"
          value={
            isLoading
              ? '—'
              : `₱${totalCollections.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}`
          }
          variant="success"
        />
        <StatCard
          label="Total Records"
          value={isLoading ? '—' : totalRecords}
          variant="default"
        />
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">

        {/* Filters */}
        <div className="mb-5">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={collections ?? []}
          isLoading={isLoading}
          emptyMessage="No collection records found."
          keyExtractor={(row) => row.paymentId}
        />
      </div>
    </div>
  )
}