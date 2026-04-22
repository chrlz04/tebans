'use client'

import { useRoleGuard } from '@/lib/use-role-guard'

export default function MeterReaderSettingsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="max-w-2xl flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          System settings
        </p>
      </div>
    </div>
  )
}
