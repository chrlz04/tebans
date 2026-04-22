import SmsSettingsForm from '@/components/admin/SmsSettingsForm'

export default function AdminSettingsPage() {
  return (
    <div className="w-full flex justify-center pt-10 pb-20 px-4">
      <div className="w-full max-w-[440px] space-y-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your system settings</p>
          </div>
        </div>
        
        <div>
          <SmsSettingsForm />
        </div>
      </div>
    </div>
  )
}
