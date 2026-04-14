import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

export default function AdminSettingsPage() {
  return (
    // Added a full-width wrapper to center the content horizontally
    <div className="w-full flex justify-center pt-10 pb-20 px-4">
      
      {/* Matched the max-width to the form's exact width for perfect alignment */}
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your account security</p>
          </div>
        </div>
        
        <div>
          <ChangePasswordForm endpoint="/admin/auth/change-password" />
        </div>
      </div>
      
    </div>
  )
}