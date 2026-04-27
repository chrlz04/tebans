'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect } from 'react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ConsumerTabs from '../../components/ConsumerTabs'
import { getProvinces, getMunicipalities, getBarangays } from '@/lib/psgc'
import type { Area } from '@/types/area'

const consumerSchema = z.object({
  firstName:        z.string().min(1, 'First name is required'),
  lastName:         z.string().min(1, 'Last name is required'),
  street:           z.string().optional(),
  provinceCode:     z.string().min(1, 'Province is required'),
  municipalityCode: z.string().min(1, 'Municipality is required'),
  barangayCode:     z.string().min(1, 'Barangay is required'),
  meterSerialNo:    z.string().min(1, 'Meter serial number is required'),
  areaId:           z.string().min(1, 'Area is required'),
  contactNo:        z.string().min(1, 'Contact number is required'),
})

type ConsumerFormValues = z.infer<typeof consumerSchema>

export default function RegisterConsumerPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConsumerFormValues>({
    resolver: zodResolver(consumerSchema),
    defaultValues: {
      provinceCode: '071200000',     // Bohol
      municipalityCode: '071214000', // Clarin
      barangayCode: '071214023',     // Tubod
    }
  })

  const selectedProvinceCode     = watch('provinceCode')
  const selectedMunicipalityCode = watch('municipalityCode')

  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data
    },
    enabled: hasAccess,
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

  const mutation = useMutation({
    mutationFn: async (values: ConsumerFormValues) => {
      const province     = provinces?.find(p => p.code === values.provinceCode)?.name
      const municipality = municipalities?.find(m => m.code === values.municipalityCode)?.name
      const barangay     = barangays?.find(b => b.code === values.barangayCode)?.name

      const addressParts = [values.street, barangay, municipality, province].filter(Boolean)
      const address      = addressParts.join(', ')

      const payload = {
        firstName:     values.firstName,
        lastName:      values.lastName,
        address,
        province,
        municipality,
        barangay,
        meterSerialNo: values.meterSerialNo,
        areaId:        values.areaId,
        contactNo:     values.contactNo,
      }

      await api.post('/meter-reader/consumers', payload)
    },
    onSuccess: () => {
      router.push('/meter-reader/consumers')
    },
  })

  if (authLoading) return null
  if (!hasAccess)  return null

  return (
    <div className="flex flex-col gap-6">

      <ConsumerTabs />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Register New Consumer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new consumer account in the system
        </p>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl w-full mx-auto">  
        <div className="bg-card rounded-xl border border-border p-6">
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-5"
          >
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium text-foreground border-b pb-2">Service Address</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Province */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
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

            {/* Meter and Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Meter Serial No."
                placeholder="Enter meter serial number"
                error={errors.meterSerialNo?.message}
                required
                {...register('meterSerialNo')}
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">
                  Area Name <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
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

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Link href="/meter-reader/consumers" className="w-full sm:w-auto">
                <Button type="button" variant="secondary" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                isLoading={isSubmitting || mutation.isPending}
              >
                Register Consumer
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  )
}