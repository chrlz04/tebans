'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useQuery } from '@tanstack/react-query'
import type { Area } from '@/types/area'

const staffSchema = z
  .object({
    firstName:   z.string().min(1, 'First name is required'),
    lastName:    z.string().min(1, 'Last name is required'),
    contactNo:   z.string().regex(/^09\d{9}$/, 'Must be a valid 11-digit mobile number starting with 09'),
    username:    z.string().min(1, 'Username is required'),
    userType:    z.enum(['meter_reader', 'cashier']),
    assignedAreaId: z.string().optional(),
    password:    z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one symbol'),
    confirmPassword: z.string().min(1, 'Please confirm the password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type StaffFormValues = z.infer<typeof staffSchema>

export default function StaffRegistrationPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('admin')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { userType: 'meter_reader', password: 'P@ssw0rd', confirmPassword: 'P@ssw0rd' },
  })

  const firstName = watch('firstName')
  useEffect(() => {
    if (firstName) {
      setValue('username', firstName.toLowerCase().replace(/\s+/g, ''), { shouldValidate: true })
    }
  }, [firstName, setValue])

  // Queries
  const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
    queryKey: ['admin-areas'],
    queryFn: async () => {
      const res = await api.get('/admin/areas')
      return res.data
    },
    enabled: hasAccess,
  })

  const mutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      await api.post('/admin/staff', values)
    },
    onSuccess: () => {
      router.push('/admin/accounts')
    },
  })

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="max-w-2xl">

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/accounts"
          className="p-2 text-muted-foreground hover:text-muted-foreground transition-colors rounded-lg hover:bg-muted"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Register Staff Member
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new Meter Reader or Cashier account
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-5"
        >
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Contact and Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Number"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 09xxxxxxxxx"
              error={errors.contactNo?.message}
              required
              {...register('contactNo')}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                setValue('contactNo', val, { shouldValidate: true });
                e.target.value = val;
              }}
            />
            <Input
              label="Username"
              placeholder="Enter username"
              error={errors.username?.message}
              required
              {...register('username')}
            />
          </div>

          {/* Role and Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                Staff Role <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('userType')}
              >
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('assignedAreaId')}
                disabled={areasLoading}
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

          {/* Divider */}
          <hr className="border-border" />

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Password"
              type="password"
              placeholder="Enter password"
              error={errors.password?.message}
              required
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm password"
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword')}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters and include an uppercase letter, a number, and a symbol.
          </p>

          {/* Error */}
          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              Failed to register staff member. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/accounts">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || mutation.isPending}
            >
              Register Staff Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}