'use client'

import { useQuery } from '@tanstack/react-query'
import { User, MapPin, Hash, Phone } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

interface CashierProfile {
  userId:       string
  firstName:    string
  lastName:     string
  contactNo:    string
  cashierId:    string
  assignedArea: string
}

export default function CashierProfilePage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('cashier')

  const { data: profile, isLoading } = useQuery<CashierProfile>({
    queryKey: ['cashier-profile'],
    queryFn: async () => {
      const res = await api.get('/cashier/profile')
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
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Your cashier account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-primary-50 p-3 rounded-full">
            <User size={22} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isLoading ? '—' : `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`}
            </p>
            <p className="text-xs text-muted-foreground">Cashier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cashier ID
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg border border-border">
              <Hash size={14} className="text-muted-foreground" />
              <span className="text-sm font-mono text-foreground">
                {profile?.cashierId ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              User ID
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg border border-border">
              <Hash size={14} className="text-muted-foreground" />
              <span className="text-sm font-mono text-foreground">
                {profile?.userId ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Contact Number
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg border border-border">
              <Phone size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground">
                {profile?.contactNo ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assigned Area
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-lg border border-border">
              <MapPin size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground">
                {profile?.assignedArea ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">
          Change Password
        </h2>
        <ChangePasswordForm endpoint="/cashier/auth/change-password" />
      </div>
    </div>
  )
}
