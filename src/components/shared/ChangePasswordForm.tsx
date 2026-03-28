'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import api from '@/lib/api'

// ─── Validation Schema ───────────────────────────────────
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must include at least one symbol'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

// ─── Props ───────────────────────────────────────────────
interface ChangePasswordFormProps {
  endpoint: string // e.g. '/admin/auth/change-password'
}

// ─── Component ───────────────────────────────────────────
export default function ChangePasswordForm({ endpoint }: ChangePasswordFormProps) {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      setServerError('')
      setSuccessMessage('')
      await api.put(endpoint, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setSuccessMessage('Password changed successfully.')
      reset()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setServerError(
        error.response?.data?.message || 'Failed to change password. Try again.'
      )
    }
  }

  // Helper for password fields with show/hide toggle
  const PasswordField = ({
    label,
    fieldName,
    show,
    onToggle,
    error,
  }: {
    label: string
    fieldName: keyof ChangePasswordValues
    show: boolean
    onToggle: () => void
    error?: string
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder={`Enter ${label.toLowerCase()}`}
          className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
            error
              ? 'border-red-400 bg-red-50 text-red-900'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
          {...register(fieldName)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

      <PasswordField
        label="Current Password"
        fieldName="currentPassword"
        show={showCurrent}
        onToggle={() => setShowCurrent(!showCurrent)}
        error={errors.currentPassword?.message}
      />

      <PasswordField
        label="New Password"
        fieldName="newPassword"
        show={showNew}
        onToggle={() => setShowNew(!showNew)}
        error={errors.newPassword?.message}
      />

      <PasswordField
        label="Confirm New Password"
        fieldName="confirmPassword"
        show={showConfirm}
        onToggle={() => setShowConfirm(!showConfirm)}
        error={errors.confirmPassword?.message}
      />

      {/* Password Requirements Note */}
      <p className="text-xs text-gray-500">
        Password must be at least 8 characters and include an uppercase letter, a number, and a symbol.
      </p>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Server Error */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        className="w-fit"
      >
        Update Password
      </Button>
    </form>
  )
}