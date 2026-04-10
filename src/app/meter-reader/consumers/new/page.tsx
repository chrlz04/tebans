'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ConsumerTabs from '../../components/ConsumerTabs'

const consumerSchema = z.object({
  firstName:     z.string().min(1, 'First name is required'),
  lastName:      z.string().min(1, 'Last name is required'),
  address:       z.string().min(1, 'Address is required'),
  meterSerialNo: z.string().min(1, 'Meter serial number is required'),
  areaName:      z.string().min(1, 'Area name is required'),
  contactNo:     z.string().min(1, 'Contact number is required'),
})

type ConsumerFormValues = z.infer<typeof consumerSchema>

export default function RegisterConsumerPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConsumerFormValues>({
    resolver: zodResolver(consumerSchema),
  })

  const mutation = useMutation({
    mutationFn: async (values: ConsumerFormValues) => {
      await api.post('/meter-reader/consumers', values)
    },
    onSuccess: () => {
      router.push('/meter-reader/consumers')
    },
  })

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="max-w-2xl">

      <ConsumerTabs />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Register New Consumer
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a new consumer account in the system
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-5"
        >
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Enter first name"
              error={errors.firstName?.message}
              required
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="Enter last name"
              error={errors.lastName?.message}
              required
              {...register('lastName')}
            />
          </div>

          {/* Address */}
          <Input
            label="Service Address"
            placeholder="Enter complete address"
            error={errors.address?.message}
            required
            {...register('address')}
          />

          {/* Meter and Area */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Meter Serial No."
              placeholder="Enter meter serial number"
              error={errors.meterSerialNo?.message}
              required
              {...register('meterSerialNo')}
            />
            <Input
              label="Area Name"
              placeholder="e.g. Tubod, Clarin"
              error={errors.areaName?.message}
              required
              {...register('areaName')}
            />
          </div>

          {/* Contact */}
          <Input
            label="Contact Number"
            placeholder="e.g. 09xxxxxxxxx"
            error={errors.contactNo?.message}
            required
            {...register('contactNo')}
          />

          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              Failed to register consumer. Please try again.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/meter-reader/consumers">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || mutation.isPending}
            >
              Register Consumer
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}