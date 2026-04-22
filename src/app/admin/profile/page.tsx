'use client'

import { useQuery } from '@tanstack/react-query'
import { User, Shield, Hash, Phone } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

interface AdminProfile {
  userId:         string
  firstName:      string
  lastName:       string
  contactNo:      string
  adminId:        string
  clearanceLevel: number
}

export default function AdminProfilePage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('admin')

  const { data: profile, isLoading } = useQuery<AdminProfile>({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const res = await api.get('/admin/profile')
      return res.data
    },
    enabled: hasAccess,
  })

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your administrator account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-primary-50 p-3 rounded-full">
            <User size={22} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isLoading ? '—' : `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`}
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Admin ID
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <Hash size={14} className="text-gray-400" />
              <span className="text-sm font-mono text-gray-700">
                {profile?.adminId ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              User ID
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <Hash size={14} className="text-gray-400" />
              <span className="text-sm font-mono text-gray-700">
                {profile?.userId ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Contact Number
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <Phone size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                {profile?.contactNo ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Clearance Level
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <Shield size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                Level {profile?.clearanceLevel ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Change Password
        </h2>
        <ChangePasswordForm endpoint="/admin/auth/change-password" />
      </div>
    </div>
  )
}
