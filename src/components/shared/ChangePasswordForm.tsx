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
  endpoint: string
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
      <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Lock size={14} />
        </div>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className={`w-full min-h-[40px] pl-9 pr-10 py-2 text-[13px] rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#749D47]/50 focus:border-[#749D47] ${
            error
              ? 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 placeholder:text-red-300'
              : 'border-border bg-background text-foreground placeholder:text-muted-foreground/60'
          }`}
          {...register(fieldName)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )

  return (
    // Flat form — no card wrapper; the parent AdminProfilePage card provides the container
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

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
      <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
        At least 8 characters — include uppercase letters, numbers, and symbols.
      </p>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-[12px] px-3.5 py-2.5 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Server Error */}
      {serverError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-[12px] px-3.5 py-2.5 rounded-lg">
          {serverError}
        </div>
      )}

  {/* Submit — left-aligned, auto width */}
  <div className="pt-1 flex">
    <Button
      type="submit"
      isLoading={isSubmitting}
      className="!w-auto bg-[#749D47] hover:bg-[#62873B] text-white inline-flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium transition-colors"
    >
      <ShieldCheck size={15} />
      Update Password
    </Button>
  </div>

    </form>
  )
}