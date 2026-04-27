'use client'

import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
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

function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—'
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

  if (authLoading || !hasAccess) return null

  const fullName = isLoading ? '—' : `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
  const initials = getInitials(profile?.firstName, profile?.lastName)

  return (
    <div className="max-w-2xl flex flex-col gap-5">

      {/* Page Header */}
      <div>
        <h1 className="text-[15px] font-medium text-foreground">Profile</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Your administrator account information
        </p>
      </div>

      {/* Identity Card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">

        {/* Banner */}
        <div className="bg-muted/40 border-b border-border px-5 pt-5 pb-0 flex items-end gap-4">
          {/* Avatar */}
          <div className="relative top-3 size-16 rounded-full bg-blue-50 dark:bg-blue-950 border-2 border-card flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-[18px] font-medium text-blue-600 dark:text-blue-400 leading-none">
              {isLoading ? '·' : initials}
            </span>
          </div>

          {/* Name + role */}
          <div className="pb-3">
            <p className="text-[17px] font-medium text-foreground tracking-tight leading-tight">
              {fullName || '—'}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Administrator
            </p>
          </div>

          {/* Clearance badge */}
          <div className="ml-auto pb-3.5 flex-shrink-0">
            {!isLoading && profile?.clearanceLevel != null && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide
                bg-green-50 border border-green-200 text-green-800
                dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                <span className="size-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                Clearance Level {profile.clearanceLevel}
              </span>
            )}
          </div>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border">
          <Field label="Admin ID" value={profile?.adminId} mono isLoading={isLoading} />
          <Field label="User ID"  value={profile?.userId}  mono isLoading={isLoading} />
          <Field label="Contact Number" value={profile?.contactNo} isLoading={isLoading} />
          <Field
            label="Account Status"
            value="Active"
            className="text-green-700 dark:text-green-400"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
          <div className="size-7 rounded-md bg-muted border border-border flex items-center justify-center flex-shrink-0">
            <Lock size={13} className="text-muted-foreground" />
          </div>
          <h2 className="text-[14px] font-medium text-foreground">Change Password</h2>
        </div>
        <div className="p-5">
          <ChangePasswordForm endpoint="/admin/auth/change-password" />
        </div>
      </div>
    </div>
  )
}

/* ── Field cell ──────────────────────────────────────────── */
interface FieldProps {
  label:     string
  value?:    string
  mono?:     boolean
  className?: string
  isLoading: boolean
}

function Field({ label, value, mono, className, isLoading }: FieldProps) {
  return (
    <div className="px-5 py-3.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className={`text-[13px] text-foreground leading-snug ${mono ? 'font-mono' : ''} ${className ?? ''}`}>
        {isLoading ? <span className="text-muted-foreground">—</span> : (value || '—')}
      </p>
    </div>
  )
}