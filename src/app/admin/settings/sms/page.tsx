import SmsSettingsForm from '@/components/admin/SmsSettingsForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AdminSmsSettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">SMS Configuration</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure your SMS API provider settings
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SmsSettingsForm />
      </div>
    </div>
  )
}
