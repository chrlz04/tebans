'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DataTable from '@/components/shared/DataTable'
import { useState } from 'react'

interface AdminDisconnection {
  disconnectionId: string
  consumerId: string
  consumerName: string
  consumerAddress: string
  amountDue: number
  meterReaderName: string
  reasonForDisconnection: string
  scheduledDate: string
  requestStatus: 'Pending' | 'Executed' | 'Cancelled'
  dateRequested: string
}

export default function AdminDisconnectionsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('admin')
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: disconnections, isLoading } = useQuery<AdminDisconnection[]>({
    queryKey: ['admin-disconnections'],
    queryFn: async () => {
      const res = await api.get('/admin/disconnections')
      return res.data
    },
    enabled: hasAccess,
  })

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/disconnections/${id}/execute`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disconnections'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
    },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Failed to mark as executed.')
    },
  })

  if (authLoading) return null
  if (!hasAccess) return null

  const filteredData = disconnections?.filter(
    (d) =>
      d.consumerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.consumerId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    {
      key: 'consumer',
      label: 'Consumer',
      render: (row: AdminDisconnection) => (
        <div>
          <p className="font-medium text-foreground">
            {row.consumerName}
          </p>
          <p className="text-xs text-muted-foreground font-mono">{row.consumerId}</p>
        </div>
      ),
    },
    {
      key: 'amountDue',
      label: 'Amount Due',
      render: (row: AdminDisconnection) => (
        <span className="font-semibold text-red-600">
          ₱{row.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'scheduledDate',
      label: 'Scheduled Date',
      render: (row: AdminDisconnection) => (
        <span className="text-sm">
          {new Date(row.scheduledDate).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'requestedBy',
      label: 'Requested By',
      render: (row: AdminDisconnection) => (
        <span className="text-sm">
          {row.meterReaderName}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: AdminDisconnection) => <Badge status={row.requestStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: AdminDisconnection) => (
        <div className="flex items-center gap-2">
          {row.requestStatus === 'Pending' && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={executeMutation.isPending && executeMutation.variables === row.disconnectionId}
              onClick={() => {
                if (window.confirm('Are you sure you want to mark this disconnection as Executed?')) {
                  executeMutation.mutate(row.disconnectionId)
                }
              }}
              className="text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300"
            >
              <CheckCircle size={14} className="mr-1.5" />
              Mark Executed
            </Button>
          )}
        </div>
      ),
    },
  ]

  const pendingCount = disconnections?.filter(d => d.requestStatus === 'Pending').length || 0
  const executedCount = disconnections?.filter(d => d.requestStatus === 'Executed').length || 0

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Disconnections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and manage disconnection requests submitted by meter readers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {isLoading ? '...' : pendingCount}
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Executed Disconnections</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {isLoading ? '...' : executedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle size={18} className="text-muted-foreground" />
            Disconnection List
          </h2>
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="p-0">
          <DataTable
            columns={columns}
            data={filteredData || []}
            isLoading={isLoading}
            emptyMessage="No disconnections found"
            keyExtractor={(item) => item.disconnectionId}
          />
        </div>
      </div>
    </div>
  )
}
