'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Consumer } from '@/types'

const editConsumerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  address:   z.string().min(1, 'Address is required'),
  contactNo: z.string().min(1, 'Contact number is required'),
  areaName:  z.string().min(1, 'Area name is required'),
})

type EditConsumerValues = z.infer<typeof editConsumerSchema>

interface EditConsumerModalProps {
  isOpen:    boolean
  onClose:   () => void
  consumer:  Consumer
}

export default function EditConsumerModal({
  isOpen,
  onClose,
  consumer,
}: EditConsumerModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditConsumerValues>({
    resolver: zodResolver(editConsumerSchema),
    defaultValues: {
      firstName: consumer.firstName,
      lastName:  consumer.lastName,
      address:   consumer.address,
      contactNo: consumer.contactNo,
      areaName:  consumer.areaName,
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: EditConsumerValues) => {
      await api.put(`/meter-reader/consumers/${consumer.consumerId}`, values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meter-reader-consumers'] })
      onClose()
    },
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Consumer — ${consumer.consumerId}`}
      size="md"
    >
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-4"
      >
        {/* Account No — Read Only */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Account Number
          </label>
          <input
            value={consumer.consumerId}
            disabled
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
          />
        </div>

        {/* Name */}
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

        {/* Address */}
        <Input
          label="Service Address"
          error={errors.address?.message}
          required
          {...register('address')}
        />

        {/* Contact and Area */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contact Number"
            error={errors.contactNo?.message}
            required
            {...register('contactNo')}
          />
          <Input
            label="Area Name"
            error={errors.areaName?.message}
            required
            {...register('areaName')}
          />
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            Failed to update consumer. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
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