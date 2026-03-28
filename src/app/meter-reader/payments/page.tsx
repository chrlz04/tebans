'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import DataTable from '@/components/shared/DataTable'
import DateRangePicker from '@/components/shared/DateRangePicker'
import Badge from '@/components/ui/Badge'
import type { Column } from '@/components/shared/DataTable'

interface PaymentCollection {
  paymentId:     string
  consumerId:    string
  consumerName:  string
  billingMonth:  string
  amountDue:     number
  amountPaid:    number
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial'
}

export default function MeterReaderPaymentsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: payments, isLoading } = useQuery<PaymentCollection[]>({
    queryKey: ['meter-reader-payments', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/meter-reader/payments', {
        params: { startDate, endDate },
      })
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  const columns: Column<PaymentCollection>[] = [
    {
      key: 'consumerId',
      label: 'Account No.',
      render: (row) => (
        <span className="font-mono text-xs">{row.consumerId}</span>
      ),
    },
    {
      key: 'consumerName',
      label: 'Full Name',
    },
    {
      key: 'billingMonth',
      label: 'Billing Month',
    },
    {
      key: 'amountDue',
      label: 'Amount Due',
      render: (row) =>
        `₱${(row.amountDue ?? 0).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
        })}`,
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
      key: 'paymentStatus',
      label: 'Status',
      render: (row) => <Badge status={row.paymentStatus} />,
    },
  ]

  const paidCount = payments?.filter((p) => p.paymentStatus === 'Paid').length ?? 0
  const unpaidCount = payments?.filter((p) => p.paymentStatus !== 'Paid').length ?? 0

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Payment Collection
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track consumer payment records in your assigned area
        </p>
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
          data={payments ?? []}
          isLoading={isLoading}
          emptyMessage="No payment records found."
          keyExtractor={(row) => row.paymentId}
        />

        {/* Summary */}
        {!isLoading && payments && payments.length > 0 && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Paid:{' '}
              <strong className="text-green-600">{paidCount}</strong>
            </span>
            <span>
              Unsettled:{' '}
              <strong className="text-red-600">{unpaidCount}</strong>
            </span>
            <span>
              Total Records:{' '}
              <strong className="text-gray-700">{payments.length}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}