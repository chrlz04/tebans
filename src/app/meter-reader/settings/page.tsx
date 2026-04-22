'use client'

import { useRoleGuard } from '@/lib/use-role-guard'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

export default function MeterReaderSettingsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Settings & Security
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account security
        </p>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Change Password
        </h2>
        <ChangePasswordForm endpoint="/meter-reader/auth/change-password" />
      </div>
    </div>
  )
}
