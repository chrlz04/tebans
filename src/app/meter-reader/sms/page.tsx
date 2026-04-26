'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Bell, Search, Filter, Send, AlertTriangle, MessageSquare } from 'lucide-react'
import Button from '@/components/ui/Button'
import DataTable, { Column } from '@/components/shared/DataTable'
import Badge from '@/components/ui/Badge'
import SearchBar from '@/components/shared/SearchBar'

interface ConsumerSmsData {
  consumerId: string
  consumerName: string
  contactNo: string
  amount: number
  dueDate: string
  billingMonth: string
  meterReadingId: string
  previousReading: number
  currentReading: number
  smsStatus: 'Sent' | 'Unsent' | 'Sending...' | 'Failed'
}

interface SmsResponse {
  billingMonth: string
  consumers: ConsumerSmsData[]
}

type FilterStatus = 'Unsent only' | 'Sent' | 'All'

export default function SendSmsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Unsent only')
  const [localConsumers, setLocalConsumers] = useState<ConsumerSmsData[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data: smsData, isLoading, refetch } = useQuery<SmsResponse>({
    queryKey: ['meter-reader', 'sms'],
    queryFn: async () => {
      const res = await fetch('/api/meter-reader/sms')
      if (!res.ok) {
        throw new Error('Failed to fetch SMS data')
      }
      return res.json()
    },
  })

  // Sync state when data is fetched
  useEffect(() => {
    if (smsData?.consumers) {
      setLocalConsumers(smsData.consumers)
    }
  }, [smsData])

  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text })
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current)
    alertTimeoutRef.current = setTimeout(() => setAlertMsg(null), 3000)
  }

  // Derived filtered data
  const filteredData = useMemo(() => {
    return localConsumers.filter(c => {
      if (filterStatus === 'Unsent only') return c.smsStatus === 'Unsent' || c.smsStatus === 'Failed'
      if (filterStatus === 'Sent') return c.smsStatus === 'Sent'
      return true
    })
  }, [localConsumers, filterStatus])

  // Count summary
  const unsentCount = localConsumers.filter(c => c.smsStatus === 'Unsent' || c.smsStatus === 'Failed').length
  const sentCount = localConsumers.filter(c => c.smsStatus === 'Sent').length

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible (filtered) unsent/failed rows
      const selectableIds = filteredData
        .filter(c => c.smsStatus !== 'Sent')
        .map(c => c.consumerId)
      setSelectedIds(new Set(selectableIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectRow = (consumerId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(consumerId)) {
        next.delete(consumerId)
      } else {
        next.add(consumerId)
      }
      return next
    })
  }

  const handleSendSms = async () => {
    if (selectedIds.size === 0) return

    setIsSendingSms(true)
    setAlertMsg(null)

    // Prepare payload
    const tasks = Array.from(selectedIds).map(id => {
      const c = localConsumers.find(x => x.consumerId === id)
      return {
        consumerId: c!.consumerId,
        consumerName: c!.consumerName,
        to: c!.contactNo,
        amountWithTaxEvat: c!.amount,
        dueDate: c!.dueDate,
        billingMonth: c!.billingMonth,
        meterReadingId: c!.meterReadingId,
        previousReading: c!.previousReading,
        currentReading: c!.currentReading,
      }
    })

    try {
      const response = await fetch('/api/meter-reader/readings/bulk/sms/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsTasks: tasks })
      })

      if (!response.ok) {
        throw new Error('Failed to start SMS stream')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No readable stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))

              setLocalConsumers(prev => prev.map(c => {
                if (c.consumerId === data.consumerId) {
                  return { ...c, smsStatus: data.status }
                }
                return c
              }))

              // Automatically deselect if sent
              if (data.status === 'Sent') {
                setSelectedIds(prev => {
                  const next = new Set(prev)
                  next.delete(data.consumerId)
                  return next
                })
              }
            } catch (e) {
              console.error('SSE parse error:', e)
            }
          }
        }
      }

      showAlert('success', 'SMS processing complete')
      // Refetch after completion to ensure sync with DB
      refetch()
    } catch (err: any) {
      console.error(err)
      showAlert('error', err.message || 'Error processing SMS')
    } finally {
      setIsSendingSms(false)
    }
  }

  const selectableVisibleCount = filteredData.filter(c => c.smsStatus !== 'Sent').length
  const allSelectableVisibleChecked = selectableVisibleCount > 0 && selectedIds.size === selectableVisibleCount

  const columns: Column<ConsumerSmsData>[] = [
    {
      key: 'checkbox',
      label: '',
      className: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.consumerId)}
          onChange={() => handleSelectRow(row.consumerId)}
          disabled={isSendingSms || row.smsStatus === 'Sent'}
          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-600 disabled:opacity-50"
        />
      ),
    },
    {
      key: 'consumerId',
      label: 'Account No.',
      render: (row) => <span className="font-mono text-xs">{row.consumerId}</span>,
    },
    {
      key: 'consumerName',
      label: 'Name',
      render: (row) => <span className="font-medium text-gray-900">{row.consumerName}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => `₱${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'smsStatus',
      label: 'SMS Status',
      render: (row) => {
        let badgeColor = 'bg-gray-100 text-gray-800'
        if (row.smsStatus === 'Unsent') badgeColor = 'bg-yellow-100 text-yellow-800'
        if (row.smsStatus === 'Sent') badgeColor = 'bg-gray-100 text-gray-600'
        if (row.smsStatus === 'Sending...') badgeColor = 'bg-blue-100 text-blue-800'
        if (row.smsStatus === 'Failed') badgeColor = 'bg-red-100 text-red-800'

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeColor}`}>
            {row.smsStatus}
          </span>
        )
      },
    },
  ]

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary-100 p-3 rounded-lg">
          <MessageSquare className="text-primary-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send SMS Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select consumers to notify &mdash; {smsData?.billingMonth ? `${smsData.billingMonth} billing cycle` : 'Loading...'}
          </p>
        </div>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          alertMsg.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {alertMsg.type === 'success' ? (
            <MessageSquare className="text-green-600 mt-0.5 shrink-0" size={18} />
          ) : (
            <AlertTriangle className="text-red-600 mt-0.5 shrink-0" size={18} />
          )}
          <p className={`text-sm ${alertMsg.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {alertMsg.text}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelectableVisibleChecked}
                onChange={handleSelectAll}
                disabled={isSendingSms || selectableVisibleCount === 0}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-600 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All
              </span>
            </label>
            <span className="text-xs text-gray-500">
              ({selectedIds.size} of {selectableVisibleCount} unsent selected)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                disabled={isSendingSms}
              >
                <option value="Unsent only">Unsent only</option>
                <option value="Sent">Sent</option>
                <option value="All">All</option>
              </select>
            </div>

            <Button
              variant="primary"
              onClick={handleSendSms}
              isLoading={isSendingSms}
              disabled={selectedIds.size === 0 || isSendingSms}
            >
              {!isSendingSms && <Send size={16} className="mr-2" />}
              {isSendingSms ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </div>

        {/* Table Area */}
        <div className="min-h-[400px]">
          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            keyExtractor={(row) => row.consumerId}
            emptyMessage="No consumers found matching your criteria."
            itemName="consumers"
            totalCount={localConsumers.length}
            summary={
              <span>{unsentCount} unsent &middot; {sentCount} already sent</span>
            }
          />
        </div>
      </div>
    </div>
  )
}
