'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Consumer } from '@/types'
import { getProvinces, getMunicipalities, getBarangays } from '@/lib/psgc'
import type { Area } from '@/types/area'

const editConsumerSchema = z.object({
  firstName:     z.string().min(1, 'First name is required'),
  lastName:      z.string().min(1, 'Last name is required'),
  street:        z.string().optional(),
  provinceCode:  z.string().min(1, 'Province is required'),
  municipalityCode: z.string().min(1, 'Municipality is required'),
  barangayCode:  z.string().min(1, 'Barangay is required'),
  contactNo:     z.string().min(1, 'Contact number is required'),
  areaId:        z.string().min(1, 'Area name is required'),
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

  const [initialProvinceCode, setInitialProvinceCode] = useState('')
  const [initialMunicipalityCode, setInitialMunicipalityCode] = useState('')
  const [initialBarangayCode, setInitialBarangayCode] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditConsumerValues>({
    resolver: zodResolver(editConsumerSchema),
    defaultValues: {
      firstName: consumer.firstName,
      lastName:  consumer.lastName,
      contactNo: consumer.contactNo,
      areaId:  consumer.areaId,
      street: '', // Will update
      provinceCode: '', // Will update
      municipalityCode: '', // Will update
      barangayCode: '', // Will update
    },
  })

  const selectedProvinceCode = watch('provinceCode')
  const selectedMunicipalityCode = watch('municipalityCode')

  // Queries
  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data
    },
  })

  const { data: provinces, isLoading: provincesLoading } = useQuery({
    queryKey: ['provinces'],
    queryFn: getProvinces,
  })

  const { data: municipalities, isLoading: municipalitiesLoading } = useQuery({
    queryKey: ['municipalities', selectedProvinceCode],
    queryFn: () => getMunicipalities(selectedProvinceCode),
    enabled: !!selectedProvinceCode,
  })

  const { data: barangays, isLoading: barangaysLoading } = useQuery({
    queryKey: ['barangays', selectedMunicipalityCode],
    queryFn: () => getBarangays(selectedMunicipalityCode),
    enabled: !!selectedMunicipalityCode,
  })

  // Reverse mapping from string names to codes
  useEffect(() => {
    if (provinces && consumer.province && isOpen) {
      const p = provinces.find((x) => x.name === consumer.province)
      if (p) {
        setInitialProvinceCode(p.code)
        reset(formValues => ({ ...formValues, provinceCode: p.code }))
      }
    }
  }, [provinces, consumer.province, isOpen, reset])

  useEffect(() => {
    if (municipalities && consumer.municipality && selectedProvinceCode === initialProvinceCode && isOpen) {
      const m = municipalities.find((x) => x.name === consumer.municipality)
      if (m) {
        setInitialMunicipalityCode(m.code)
        reset(formValues => ({ ...formValues, municipalityCode: m.code }))
      }
    }
  }, [municipalities, consumer.municipality, selectedProvinceCode, initialProvinceCode, isOpen, reset])

  useEffect(() => {
    if (barangays && consumer.barangay && selectedMunicipalityCode === initialMunicipalityCode && isOpen) {
      const b = barangays.find((x) => x.name === consumer.barangay)
      if (b) {
        setInitialBarangayCode(b.code)
        reset(formValues => ({ ...formValues, barangayCode: b.code }))

        // Try to extract street from address
        let street = consumer.address
        if (consumer.province) street = street.replace(consumer.province, '')
        if (consumer.municipality) street = street.replace(consumer.municipality, '')
        if (consumer.barangay) street = street.replace(consumer.barangay, '')
        street = street.replace(/,\s*/g, ' ').trim()

        reset(formValues => ({ ...formValues, street: street }))
      }
    }
  }, [barangays, consumer.barangay, consumer.address, selectedMunicipalityCode, initialMunicipalityCode, consumer.province, consumer.municipality, isOpen, reset])

  const mutation = useMutation({
    mutationFn: async (values: EditConsumerValues) => {
      const province = provinces?.find(p => p.code === values.provinceCode)?.name
      const municipality = municipalities?.find(m => m.code === values.municipalityCode)?.name
      const barangay = barangays?.find(b => b.code === values.barangayCode)?.name

      const addressParts = [values.street, barangay, municipality, province].filter(Boolean)
      const address = addressParts.join(', ')

      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        address,
        province,
        municipality,
        barangay,
        areaId: values.areaId,
        contactNo: values.contactNo,
      }

      await api.put(`/meter-reader/consumers/${consumer.consumerId}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meter-reader-consumers'] })
      setTimeout(onClose, 1500)
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
          <label className="text-sm font-medium text-foreground">
            Account Number
          </label>
          <input
            value={consumer.consumerId}
            disabled
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-muted-foreground font-mono cursor-not-allowed"
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
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-medium text-foreground border-b pb-2">Service Address</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Province */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Province <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('provinceCode')}
                disabled={provincesLoading}
              >
                <option value="">Select Province</option>
                {provinces?.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
              {errors.provinceCode && <p className="text-xs text-red-600">{errors.provinceCode.message}</p>}
            </div>

            {/* Municipality */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Municipality <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('municipalityCode')}
                disabled={!selectedProvinceCode || municipalitiesLoading}
              >
                <option value="">Select Municipality</option>
                {municipalities?.map((m) => (
                  <option key={m.code} value={m.code}>{m.name}</option>
                ))}
              </select>
              {errors.municipalityCode && <p className="text-xs text-red-600">{errors.municipalityCode.message}</p>}
            </div>

            {/* Barangay */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Barangay <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('barangayCode')}
                disabled={!selectedMunicipalityCode || barangaysLoading}
              >
                <option value="">Select Barangay</option>
                {barangays?.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
              {errors.barangayCode && <p className="text-xs text-red-600">{errors.barangayCode.message}</p>}
            </div>
          </div>

          <Input
            label="Street / House No."
            placeholder="e.g. 123 Rizal St. or Lot 4 Blk 2"
            error={errors.street?.message}
            {...register('street')}
          />
        </div>

        {/* Contact and Area */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contact Number"
            error={errors.contactNo?.message}
            required
            {...register('contactNo')}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">
              Area Name <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('areaId')}
              disabled={areasLoading}
            >
              <option value="">Select Area</option>
              {areas?.map((area) => (
                <option key={area.areaId} value={area.areaId}>
                  {area.name}
                </option>
              ))}
            </select>
            {errors.areaId && (
              <p className="text-xs text-red-600">{errors.areaId.message}</p>
            )}
          </div>
        </div>

        {mutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
            Consumer account updated successfully.
          </div>
        )}
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
