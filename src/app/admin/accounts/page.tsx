'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, UserPlus, ToggleRight, ToggleLeft } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import DataTable from '@/components/shared/DataTable'
import SearchBar from '@/components/shared/SearchBar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EditStaffModal from '@/components/shared/EditStaffModal'
import type { User, Consumer, AccountStatus } from '@/types'
import type { Column } from '@/components/shared/DataTable'

export default function ManageAccountsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('admin')
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'staff' | 'consumer'>('staff')
  const [search, setSearch] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // ── Fetch Staff ──
  const { data: staffData, isLoading: staffLoading } = useQuery<User[]>({
    queryKey: ['admin-staff', search],
    queryFn: async () => {
      const res = await api.get('/admin/staff', { params: { search } })
      return res.data
    },
    enabled: hasAccess && activeTab === 'staff',
  })

  // ── Fetch Consumers ──
  const { data: consumerData, isLoading: consumerLoading } = useQuery<Consumer[]>({
    queryKey: ['admin-consumers', search],
    queryFn: async () => {
      const res = await api.get('/admin/consumers', { params: { search } })
      return res.data
    },
    enabled: hasAccess && activeTab === 'consumer',
  })

  // ── Toggle Account Status ──
  const toggleStatus = useMutation({
    mutationFn: async ({
      id,
      currentStatus,
      type,
    }: {
      id: string
      currentStatus: AccountStatus
      type: 'staff' | 'consumer'
    }) => {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
      const endpoint =
        type === 'staff'
          ? `/admin/staff/${id}/status`
          : `/admin/consumers/${id}/status`
      await api.patch(endpoint, { status: newStatus })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] })
      queryClient.invalidateQueries({ queryKey: ['admin-consumers'] })
    },
  })

  if (authLoading) return null
  if (!hasAccess) return null

  // ── Staff Table Columns ──
  const staffColumns: Column<User>[] = [
    { key: 'userId', label: 'ID', className: 'w-32' },
    {
      key: 'firstName',
      label: 'Full Name',
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    { key: 'userType', label: 'Role' },
    {
      key: 'accountStatus',
      label: 'Status',
      render: (row) => <Badge status={row.accountStatus} />,
    },
    {
      key: 'registrationDate',
      label: 'Date Created',
      render: (row) =>
        new Date(row.registrationDate).toLocaleDateString('en-PH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedStaff(row)
              setIsEditModalOpen(true)
            }}
            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() =>
              toggleStatus.mutate({
                id: row.userId,
                currentStatus: row.accountStatus,
                type: 'staff',
              })
            }
            title={row.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
            className={`p-1.5 rounded-lg border-2 transition-colors ${
              row.accountStatus === 'Active'
                ? 'border-green-600 bg-green-50 text-green-600 hover:bg-green-100'
                : 'border-red-500 bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            {row.accountStatus === 'Active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      ),
    },
  ]

  // ── Consumer Table Columns ──
  const consumerColumns: Column<Consumer>[] = [
    { key: 'consumerId', label: 'ID', className: 'w-32' },
    {
      key: 'firstName',
      label: 'Full Name',
      render: (row) => `${row.firstName} ${row.lastName}`,
    },
    { key: 'areaName', label: 'Area' },
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
          <button
            onClick={() =>
              toggleStatus.mutate({
                id: row.consumerId,
                currentStatus: row.accountStatus,
                type: 'consumer',
              })
            }
            title={row.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
            className={`p-1.5 rounded-lg border-2 transition-colors ${
              row.accountStatus === 'Active'
                ? 'border-green-600 bg-green-50 text-green-600 hover:bg-green-100'
                : 'border-red-500 bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            {row.accountStatus === 'Active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      ),
    },
  ]

  const activeStaff = staffData?.filter((s) => s.accountStatus === 'Active').length ?? 0
  const inactiveStaff = staffData?.filter((s) => s.accountStatus === 'Inactive').length ?? 0
  const activeConsumers = consumerData?.filter((c) => c.accountStatus === 'Active').length ?? 0
  const inactiveConsumers = consumerData?.filter((c) => c.accountStatus === 'Inactive').length ?? 0

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Manage Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage staff and consumer accounts
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl border border-gray-200">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {(['staff', 'consumer'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setSearch('')
              }}
              className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'staff' ? 'Staff Accounts' : 'Consumer Accounts'}
            </button>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-4">

          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === 'staff'
                ? 'Search by name, ID, or role...'
                : 'Search by name, ID, or area...'
            }
            className="max-w-sm"
          />

          {/* Table */}
          {activeTab === 'staff' ? (
            <>
              <DataTable
                columns={staffColumns}
                data={staffData ?? []}
                isLoading={staffLoading}
                emptyMessage="No staff accounts found."
                keyExtractor={(row) => row.userId}
              />
              <div className="flex gap-4 text-xs text-gray-500 pt-2">
                <span>Active: <strong className="text-green-600">{activeStaff}</strong></span>
                <span>Inactive: <strong className="text-red-600">{inactiveStaff}</strong></span>
              </div>
            </>
          ) : (
            <>
              <DataTable
                columns={consumerColumns}
                data={consumerData ?? []}
                isLoading={consumerLoading}
                emptyMessage="No consumer accounts found."
                keyExtractor={(row) => row.consumerId}
              />
              <div className="flex gap-4 text-xs text-gray-500 pt-2">
                <span>Active: <strong className="text-green-600">{activeConsumers}</strong></span>
                <span>Inactive: <strong className="text-red-600">{inactiveConsumers}</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Staff Modal */}
      {selectedStaff && (
        <EditStaffModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedStaff(null)
          }}
          staff={selectedStaff}
        />
      )}
    </div>
  )
}