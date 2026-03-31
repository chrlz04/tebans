import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

export default function AdminSettingsPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account security</p>
      </div>
      <div>
        <ChangePasswordForm endpoint="/admin/auth/change-password" />
      </div>
    </div>
  )
}