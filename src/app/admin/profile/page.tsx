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

  const fullName = isLoading
    ? '—'
    : `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
  const initials = getInitials(profile?.firstName, profile?.lastName)

  return (
    <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto">

      {/* ── Page Header ─────────────────────────────────── */}
      <div>
        <h1 className="text-[15px] font-medium text-foreground">Profile</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Your administrator account information
        </p>
      </div>

      {/* ── Identity Card ───────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">

        {/* Banner row */}
        <div className="bg-muted/40 border-b border-border px-7 pt-6 pb-0 flex items-end gap-5">

          {/* Avatar — small circle design preserved */}
          <div className="relative top-3.5 size-[58px] rounded-full bg-blue-50 dark:bg-blue-950 border-2 border-card flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-[19px] font-medium text-blue-600 dark:text-blue-400 leading-none">
              {isLoading ? '·' : initials}
            </span>
          </div>

          {/* Name + role */}
          <div className="pb-4">
            <p className="text-[19px] font-semibold text-foreground tracking-tight leading-tight">
              {fullName || '—'}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">
              Administrator
            </p>
          </div>

          {/* Clearance badge */}
          {!isLoading && profile?.clearanceLevel != null && (
            <div className="ml-auto pb-4 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium tracking-wide
                bg-green-50 border border-green-200 text-green-800
                dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                <span className="size-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                Clearance Level {profile.clearanceLevel}
              </span>
            </div>
          )}
        </div>

        {/* Fields grid — 2 cols, generous cell padding */}
        <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border">
          <Field label="Admin ID"       value={profile?.adminId}   mono isLoading={isLoading} />
          <Field label="User ID"        value={profile?.userId}    mono isLoading={isLoading} />
          <Field label="Contact Number" value={profile?.contactNo}      isLoading={isLoading} />
          <Field
            label="Account Status"
            value="Active"
            className="text-green-600 dark:text-green-400"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ── Change Password Card ─────────────────────────── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">

        {/* Card header */}
        <div className="px-7 py-4 border-b border-border flex items-center gap-3">
          <div className="size-8 rounded-md bg-muted border border-border flex items-center justify-center flex-shrink-0">
            <Lock size={14} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-[14px] font-medium text-foreground leading-tight">Change Password</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Update your account credentials</p>
          </div>
        </div>

        {/* Form area — constrained to a readable width */}
        <div className="px-7 py-6">
          <ChangePasswordForm endpoint="/admin/auth/change-password" />
        </div>
      </div>

    </div>
  )
}

/* ── Field cell ──────────────────────────────────────────── */
interface FieldProps {
  label:      string
  value?:     string
  mono?:      boolean
  className?: string
  isLoading:  boolean
}

function Field({ label, value, mono, className, isLoading }: FieldProps) {
  return (
    <div className="px-7 py-5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className={`text-[14px] text-foreground leading-snug ${mono ? 'font-mono' : ''} ${className ?? ''}`}>
        {isLoading ? <span className="text-muted-foreground">—</span> : (value || '—')}
      </p>
    </div>
  )
}