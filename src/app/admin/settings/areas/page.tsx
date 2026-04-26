'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import DataTable from '@/components/shared/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import type { Area } from '@/types/area'
import type { Column } from '@/components/shared/DataTable'

export default function AdminAreasSettingsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('admin')
  const queryClient = useQueryClient()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [deletingArea, setDeletingArea] = useState<Area | null>(null)

  const [nameInput, setNameInput] = useState('')
  const [errorText, setErrorText] = useState('')

  const [depError, setDepError] = useState('')

  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['admin-areas'],
    queryFn: async () => {
      const res = await api.get('/admin/areas')
      return res.data
    },
    enabled: hasAccess,
  })

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/admin/areas', { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-areas'] })
      setIsCreateModalOpen(false)
      setNameInput('')
      setErrorText('')
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.message || 'Failed to create area')
    }
  })

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({ areaId, name }: { areaId: string, name: string }) => {
      await api.put(`/admin/areas/${areaId}`, { name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-areas'] })
      setEditingArea(null)
      setNameInput('')
      setErrorText('')
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.message || 'Failed to rename area')
    }
  })

  // Check Dependencies Mutation (before delete)
  const checkDependenciesMutation = useMutation({
    mutationFn: async (areaId: string) => {
      const res = await api.get(`/admin/areas/${areaId}/dependencies`)
      return res.data
    },
    onSuccess: (data: { consumerCount: number, staffCount: number }) => {
      if (data.consumerCount > 0 || data.staffCount > 0) {
         setDepError(`Warning: Deleting this area will remove the assigned area from ${data.consumerCount} consumer(s) and ${data.staffCount} staff member(s). Are you sure you want to proceed?`)
      } else {
         setDepError('Are you sure you want to delete this area? This action cannot be undone.')
      }
    },
    onError: () => {
      setDepError('Could not verify dependencies. Are you sure you want to delete this area?')
    }
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (areaId: string) => {
      await api.delete(`/admin/areas/${areaId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-areas'] })
      setDeletingArea(null)
      setDepError('')
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.message || 'Failed to delete area')
    }
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) {
      setErrorText('Name is required')
      return
    }
    createMutation.mutate(nameInput.trim())
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim() || !editingArea) {
      setErrorText('Name is required')
      return
    }
    editMutation.mutate({ areaId: editingArea.areaId, name: nameInput.trim() })
  }

  const handleDeleteClick = (area: Area) => {
    setDeletingArea(area)
    checkDependenciesMutation.mutate(area.areaId)
  }

  if (authLoading) return null
  if (!hasAccess) return null

  const columns: Column<Area>[] = [
    { key: 'name', label: 'Area Name' },
    {
      key: 'actions',
      label: 'Actions',
      className: 'w-32',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingArea(row)
              setNameInput(row.name)
              setErrorText('')
            }}
            className="p-1.5 text-muted-foreground hover:text-primary-600 transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="p-2 text-muted-foreground hover:text-muted-foreground transition-colors rounded-lg hover:bg-muted"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Manage Areas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure available service areas (Puroks)
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setIsCreateModalOpen(true)
            setNameInput('')
            setErrorText('')
          }}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Area</span>
        </Button>
      </div>

      {/* Main Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <DataTable
          columns={columns}
          data={areas ?? []}
          isLoading={areasLoading}
          emptyMessage="No areas found. Add your first service area."
          keyExtractor={(row) => row.areaId}
          totalCount={areas?.length ?? 0}
          itemName="areas"
        />
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Area"
        size="sm"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <Input
            label="Area Name"
            placeholder="e.g. Purok 1"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            error={errorText}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingArea}
        onClose={() => setEditingArea(null)}
        title="Edit Area"
        size="sm"
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <Input
            label="Area Name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            error={errorText}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditingArea(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={editMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingArea}
        onClose={() => setDeletingArea(null)}
        title="Delete Area"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {checkDependenciesMutation.isPending ? (
            <div className="text-sm text-muted-foreground">Checking dependencies...</div>
          ) : (
            <>
              <div className="flex gap-3 text-red-600 bg-red-50 p-4 rounded-lg border border-red-100">
                <AlertTriangle size={24} className="shrink-0" />
                <p className="text-sm">{depError}</p>
              </div>
              {errorText && <p className="text-sm text-red-600">{errorText}</p>}
            </>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingArea(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => deletingArea && deleteMutation.mutate(deletingArea.areaId)}
              isLoading={deleteMutation.isPending}
              disabled={checkDependenciesMutation.isPending}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
