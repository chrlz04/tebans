'use client'

import { useRoleGuard } from '@/lib/use-role-guard'

export default function AdminDashboard() {
  const { hasAccess, isLoading } = useRoleGuard('admin')

  if (isLoading) return <p>Loading...</p>
  if (!hasAccess) return null // middleware already handles redirect

  return (
    <div>
      <h1>Admin Dashboard</h1>
    </div>
  )
}