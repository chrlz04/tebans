'use client'

import { useQuery } from '@tanstack/react-query'
import { User, MapPin, Phone, Hash } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'
import Badge from '@/components/ui/Badge'
import type { Consumer } from '@/types'

export default function ConsumerProfilePage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('consumer')

  const { data: profile, isLoading } = useQuery<Consumer>({
    queryKey: ['consumer-profile'],
    queryFn: async () => {
      const res = await api.get('/consumer/profile')
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your personal account information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Personal Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-50 p-3 rounded-full">
              <User size={24} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Personal Information
              </h2>
              <p className="text-xs text-gray-500">Read-only account details</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-gray-50 rounded-lg border border-gray-200">
                  <User size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800">
                    {profile
                      ? `${profile.firstName} ${profile.lastName}`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Account Number
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-gray-50 rounded-lg border border-gray-200">
                  <Hash size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 font-mono">
                    {profile?.consumerId ?? '—'}
                  </span>
                </div>
              </div>

              {/* Service Address */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Service Address
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-gray-50 rounded-lg border border-gray-200">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800">
                    {profile?.address ?? '—'}
                  </span>
                </div>
              </div>

              {/* Contact Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Contact Number
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-gray-50 rounded-lg border border-gray-200">
                  <Phone size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800">
                    {profile?.contactNo ?? '—'}
                  </span>
                </div>
              </div>

              {/* Account Status */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Account Status
                </label>
                <div className="flex items-center px-3 py-2.5 min-h-[44px] bg-gray-50 rounded-lg border border-gray-200">
                  {profile?.accountStatus ? (
                    <Badge status={profile.accountStatus} />
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              {/* Meter Serial No */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Meter Serial No.
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 min-h-[44px] bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-800 font-mono">
                    {profile?.meterSerialNo ?? '—'}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Security Settings Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">
              Security Settings
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Update your account password
            </p>
          </div>
          <ChangePasswordForm endpoint="/consumer/auth/change-password" />
        </div>

      </div>
    </div>
  )
}