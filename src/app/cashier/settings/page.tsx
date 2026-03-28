import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

export default function CashierSettingsPage() {
  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Settings & Security
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account security
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          Change Password
        </h2>
        <ChangePasswordForm endpoint="/cashier/auth/change-password" />
      </div>
    </div>
  )
}