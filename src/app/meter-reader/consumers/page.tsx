'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, Edit, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation' 
import Link from 'next/link'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import DataTable from '@/components/shared/DataTable'
import SearchBar from '@/components/shared/SearchBar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ConsumerBillModal from '@/components/shared/ConsumerBillModal'
import EditConsumerModal from '@/components/shared/EditConsumerModal'
import ConsumerTabs from '../components/ConsumerTabs'
import type { Consumer } from '@/types'
import type { Column } from '@/components/shared/DataTable'

export default function MeterReaderConsumersPage() {
  const router = useRouter()
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')
  const [search, setSearch] = useState('')
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null)
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: consumers, isLoading } = useQuery<Consumer[]>({
    queryKey: ['meter-reader-consumers'],
    queryFn: async () => {
      const res = await api.get('/meter-reader/consumers')
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  const filteredConsumers = consumers?.filter((consumer) => {
    const s = search.toLowerCase()
    return (
      consumer.firstName.toLowerCase().includes(s) ||
      consumer.lastName.toLowerCase().includes(s) ||
      consumer.consumerId.toLowerCase().includes(s) ||
      (consumer.areaName || '').toLowerCase().includes(s)
    )
  })

  const columns: Column<Consumer>[] = [
  {
    key: 'consumerId',
    label: 'Account No.',
    render: (row) => (
      <span className="font-mono text-xs">{row.consumerId}</span>
    ),
  },
  {
    key: 'firstName',
    label: 'Full Name',
    render: (row) => `${row.firstName} ${row.lastName}`,
  },
  {
    key: 'areaName',
    label: 'Area',
  },
  {
    key: 'meterSerialNo',
    label: 'Meter Serial No.',
    render: (row) => (
      <span className="font-mono text-xs">{row.meterSerialNo}</span>
    ),
  },
  {
    key: 'accountStatus',
    label: 'Status',
    render: (row) => <Badge status={row.accountStatus} />,
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (row) => (
      <div className="flex items-center gap-2">
        {/* ── NEW: Record Reading button ── */}
        <button
          onClick={() =>
            router.push(
              `/meter-reader/readings/new?consumerId=${row.consumerId}` +
              `&consumerName=${encodeURIComponent(`${row.firstName} ${row.lastName}`)}` +
              `&meterSerialNo=${encodeURIComponent(row.meterSerialNo)}`
            )
          }
          className="p-1.5 text-muted-foreground hover:text-primary-600 transition-colors"
          title="Record Reading"
        >
          <Zap size={16} />
        </button>

        {/* View Bill */}
        <button
          onClick={() => {
            setSelectedConsumer(row)
            setIsBillModalOpen(true)
          }}
          className="p-1.5 text-muted-foreground hover:text-primary-600 transition-colors"
          title="View Bill"
        >
          <Eye size={16} />
        </button>

        {/* Edit */}
        <button
          onClick={() => {
            setSelectedConsumer(row)
            setIsEditModalOpen(true)
          }}
          className="p-1.5 text-muted-foreground hover:text-primary-600 transition-colors"
          title="Edit Consumer"
        >
          <Edit size={16} />
        </button>
      </div>
    ),
  },
]

  return (
    <div className="flex flex-col gap-6">

      <ConsumerTabs />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">View Consumers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and search assigned consumer accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/meter-reader/readings/batch">
            <Button variant="secondary" size="sm">
              <Zap size={16} className="mr-2" />
              Batch Input
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or account number..."
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredConsumers ?? []}
          isLoading={isLoading}
          emptyMessage="No consumers found."
          keyExtractor={(row) => row.consumerId}
          totalCount={consumers?.length ?? 0}
          itemName="consumers"
        />
      </div>

      {/* Consumer Bill Modal */}
      {selectedConsumer && (
        <ConsumerBillModal
          isOpen={isBillModalOpen}
          onClose={() => {
            setIsBillModalOpen(false)
            setSelectedConsumer(null)
          }}
          consumerId={selectedConsumer.consumerId}
          consumerName={`${selectedConsumer.firstName} ${selectedConsumer.lastName}`}
        />
      )}

      {/* Edit Consumer Modal */}
      {selectedConsumer && (
        <EditConsumerModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedConsumer(null)
          }}
          consumer={selectedConsumer}
        />
      )}
    </div>
  )
}