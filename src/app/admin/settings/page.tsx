import Link from 'next/link'
import { MapPin, MessageSquare } from 'lucide-react'

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
        
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <Link
            href="/admin/settings/areas"
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Manage Service Areas</h2>
              <p className="text-sm text-gray-500">Add, edit, or delete Puroks and areas.</p>
            </div>
          </Link>

          <Link
            href="/admin/settings/sms"
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">SMS Configuration</h2>
              <p className="text-sm text-gray-500">Configure your SMS API provider settings.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
