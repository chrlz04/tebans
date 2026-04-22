'use client'

import { useQuery } from '@tanstack/react-query'
import { User, MapPin, Hash, Phone } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'

interface MeterReaderProfile {
  userId:       string
  firstName:    string
  lastName:     string
  contactNo:    string
  assignedArea: string
}

export default function MeterReaderProfilePage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')

  const { data: profile, isLoading } = useQuery<MeterReaderProfile>({
    queryKey: ['meter-reader-profile'],
    queryFn: async () => {
      const res = await api.get('/meter-reader/profile')
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
        <p className="text-sm text-gray-500 mt-1">Your meter reader account information</p>
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
            <p className="text-xs text-gray-500">Meter Reader</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Employee ID (User ID)
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
              Assigned Area
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                {profile?.assignedArea ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
