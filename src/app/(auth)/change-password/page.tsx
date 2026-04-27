'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock } from 'lucide-react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Button from '@/components/ui/Button'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
  const router = useRouter()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      setServerError('')
      await api.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      Cookies.remove('mustChangePassword')

      const role = Cookies.get('role')
      const roleHomePages: Record<string, string> = {
        admin: '/admin/dashboard',
        consumer: '/consumer/bills',
        meter_reader: '/meter-reader/dashboard',
        cashier: '/cashier/dashboard',
      }

      router.push(roleHomePages[role as string] || '/')
    } catch (err: any) {
      setServerError(
        err.response?.data?.message || 'An error occurred while changing your password.'
      )
    }
  }

  return (
    <div className="min-h-screen flex bg-background items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg border border-border p-8">

        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="bg-muted p-4 rounded-full flex items-center justify-center">
            <Lock size={32} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Change Password Required</h2>
            <p className="text-sm text-muted-foreground mt-2">
              For security reasons, you must change your password before continuing.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#749D47]/50 focus:border-[#749D47] transition-colors ${
                  errors.currentPassword ? 'border-red-400' : 'border-border'
                }`}
                {...register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#749D47]/50 focus:border-[#749D47] transition-colors ${
                  errors.newPassword ? 'border-red-400' : 'border-border'
                }`}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#749D47]/50 focus:border-[#749D47] transition-colors ${
                  errors.confirmPassword ? 'border-red-400' : 'border-border'
                }`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2"
          >
            Update Password
          </Button>

        </form>
      </div>
    </div>
  )
}