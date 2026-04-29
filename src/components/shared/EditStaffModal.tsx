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
import { useQuery } from '@tanstack/react-query'
import type { Area } from '@/types/area'

const editStaffSchema = z.object({
  firstName:   z.string().min(1, 'First name is required'),
  lastName:    z.string().min(1, 'Last name is required'),
  contactNo:   z.string().regex(/^09\d{9}$/, 'Must be a valid 11-digit mobile number starting with 09'),
  userType:    z.enum(['admin', 'meter_reader', 'cashier']),
  assignedAreaId: z.string().optional().or(z.literal('')),
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

  // Queries
  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['admin-areas'],
    queryFn: async () => {
      const res = await api.get('/admin/areas')
      return res.data
    },
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditStaffValues>({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      firstName: staff.firstName,
      lastName:  staff.lastName,
      contactNo: staff.contactNo,
      userType:  staff.userType as UserRole,
      assignedAreaId: staff.assignedAreaId || '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: EditStaffValues) => {
      await api.put(`/admin/staff/${staff.userId}`, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] })
      setTimeout(onClose, 1500)
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
          type="text"
          inputMode="numeric"
          error={errors.contactNo?.message}
          required
          {...register('contactNo')}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
            setValue('contactNo', val, { shouldValidate: true });
            e.target.value = val;
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Staff Role <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
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

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Service Area
            </label>
            <select
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('assignedAreaId')}
              disabled={staff.userType === 'admin' || areasLoading}
            >
              <option value="">Select Area</option>
              {areas?.map((area) => (
                <option key={area.areaId} value={area.areaId}>
                  {area.name}
                </option>
              ))}
            </select>
            {errors.assignedAreaId && (
              <p className="text-xs text-red-600">{errors.assignedAreaId.message}</p>
            )}
          </div>
        </div>

        {mutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
            Staff account updated successfully.
          </div>
        )}
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