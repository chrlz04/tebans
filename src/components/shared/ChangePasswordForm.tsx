'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
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

  // Helper for password fields with show/hide toggle and lock icon
  const PasswordField = ({
    label,
    fieldName,
    placeholder,
    show,
    onToggle,
    error,
  }: {
    label: string
    fieldName: keyof ChangePasswordValues
    placeholder: string
    show: boolean
    onToggle: () => void
    error?: string
  }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-foreground">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Lock size={16} />
        </div>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className={`w-full min-h-[44px] pl-10 pr-10 py-2.5 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#749D47] focus:border-transparent ${
            error
              ? 'border-red-400 bg-red-50 text-red-900'
              : 'border-border bg-background text-foreground placeholder:text-muted-foreground'
          }`}
          {...register(fieldName)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-muted-foreground focus:outline-none"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )

  return (
    <div className="w-full max-w-[440px] bg-background border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="bg-[#FAFCF8] p-6 border-b border-border flex items-center gap-4">
        <div className="w-12 h-12 bg-[#749D47] rounded-xl flex items-center justify-center text-white shrink-0">
          <ShieldCheck size={24} strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Account Security</h2>
          <p className="text-sm text-muted-foreground">Update your password</p>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-5">
        
        <PasswordField
          label="Current Password"
          fieldName="currentPassword"
          placeholder="Enter current password"
          show={showCurrent}
          onToggle={() => setShowCurrent(!showCurrent)}
          error={errors.currentPassword?.message}
        />

        <PasswordField
          label="New Password"
          fieldName="newPassword"
          placeholder="Enter new password"
          show={showNew}
          onToggle={() => setShowNew(!showNew)}
          error={errors.newPassword?.message}
        />

        <PasswordField
          label="Confirm Password"
          fieldName="confirmPassword"
          placeholder="Re-enter new password"
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
          error={errors.confirmPassword?.message}
        />

        {/* Password Requirements Note */}
        <p className="text-sm text-muted-foreground leading-relaxed mt-1">
          Password must be at least 8 characters and include uppercase letters, numbers, and symbols for maximum security.
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

        {/* Using your Button component, but overriding classes to match the design */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full sm:w-auto bg-[#749D47] hover:bg-[#62873B] text-white flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors mt-2"
        >
          <ShieldCheck size={18} />
          Update Password
        </Button>
      </form>
    </div>
  )
}