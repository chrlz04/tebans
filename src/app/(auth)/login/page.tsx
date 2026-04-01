'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import type { AuthResponse } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// ─── Validation Schema ───────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ─── Component ───────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
  try {
    setServerError('')
    const res = await api.post('/auth/login', values)
    login(res.data)
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } }
    setServerError(
      error.response?.data?.message || 'Invalid username or password.'
    )
  }
}

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel — Branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary-500 px-12 py-10 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Zap size={24} className="text-white" />
          </div>
          <span className="text-xl font-semibold">TEBANS</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Tubod Electricity Billing Alert and Notification System
          </h1>
          <p className="mt-4 text-primary-100 text-lg">
            Manage billing, payments, and notifications for Tubod Electric Cooperative consumers.
          </p>
        </div>

        <div className="flex gap-6 text-sm text-primary-100">
          <span>Tubod Electric Cooperative</span>
          <span>Clarin, Bohol</span>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-primary-500 p-1.5 rounded-lg">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">TEBANS</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            {/* Username */}
            <Input
              label="Username"
              placeholder="Enter your username"
              error={errors.username?.message}
              required
              {...register('username')}
            />

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10 ${
                    errors.password
                      ? 'border-red-400 bg-red-50 text-red-900'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-1"
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-8">
            © 2026 Tubod Electric Cooperative. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}