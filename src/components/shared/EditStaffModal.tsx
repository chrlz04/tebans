'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { User, UserRole } from '@/types'

const editStaffSchema = z.object({
  firstName:   z.string().min(1, 'First name is required'),
  lastName:    z.string().min(1, 'Last name is required'),
  contactNo:   z.string().min(1, 'Contact number is required'),
  userType:    z.enum(['admin', 'meter_reader', 'cashier']),
})

type EditStaffValues = z.infer<typeof editStaffSchema>

interface EditStaffModalProps {
  isOpen:   boolean
  onClose:  () => void
  staff:    User
}

export default function EditStaffModal({
  isOpen,
  onClose,
  staff,
}: EditStaffModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditStaffValues>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      firstName: staff.firstName,
      lastName:  staff.lastName,
      contactNo: staff.contactNo,
      userType:  staff.userType as UserRole,
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: EditStaffValues) => {
      await api.put(`/admin/staff/${staff.userId}`, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] })
      onClose()
    },
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Staff — ${staff.userId}`}
      size="md"
    >
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        <Input
          label="Contact Number"
          error={errors.contactNo?.message}
          required
          {...register('contactNo')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            User Type <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('userType')}
          >
            <option value="admin">Admin</option>
            <option value="meter_reader">Meter Reader</option>
            <option value="cashier">Cashier</option>
          </select>
          {errors.userType && (
            <p className="text-xs text-red-600">{errors.userType.message}</p>
          )}
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            Failed to update staff account. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || mutation.isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}