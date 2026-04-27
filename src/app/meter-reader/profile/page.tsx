'use client'

import { useQuery } from '@tanstack/react-query'
import { Lock, MapPin } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

interface MeterReaderProfile {
  userId:       string
  firstName:    string
  lastName:     string
  contactNo:    string
  assignedArea: string
}

function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '—'
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
          Your meter reader account information
        </p>
      </div>

      {/* ── Identity Card ───────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">

        {/* Banner row */}
        <div className="bg-muted/40 border-b border-border px-7 pt-6 pb-0 flex items-end gap-5">

          {/* Avatar */}
          <div className="relative top-3.5 size-[58px] rounded-full bg-teal-50 dark:bg-teal-950 border-2 border-card flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-[19px] font-medium text-teal-600 dark:text-teal-400 leading-none">
              {isLoading ? '·' : initials}
            </span>
          </div>

          {/* Name + role */}
          <div className="pb-4">
            <p className="text-[19px] font-semibold text-foreground tracking-tight leading-tight">
              {fullName || '—'}
            </p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-1">
              Meter Reader
            </p>
          </div>

          {/* Assigned area badge */}
          {!isLoading && profile?.assignedArea && (
            <div className="ml-auto pb-4 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium tracking-wide
                bg-teal-50 border border-teal-200 text-teal-800
                dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300">
                <MapPin size={11} className="text-teal-500 dark:text-teal-400" />
                {profile.assignedArea}
              </span>
            </div>
          )}
        </div>

        {/* Fields grid — 3 fields so last cell left intentionally blank */}
        <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border">
          <Field label="Employee ID (User ID)" value={profile?.userId}   mono isLoading={isLoading} />
          <Field label="Contact Number"        value={profile?.contactNo}     isLoading={isLoading} />
          <Field
            label="Account Status"
            value="Active"
            className="text-green-600 dark:text-green-400"
            isLoading={isLoading}
          />
          {/* Empty cell to complete the 2-col grid row */}
          <div className="px-7 py-5" />
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

        {/* Form area */}
        <div className="px-7 py-6">
          <ChangePasswordForm endpoint="/meter-reader/auth/change-password" />
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