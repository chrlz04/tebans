import Link from 'next/link'
import { MapPin, MessageSquare, Calendar, ChevronRight } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl pt-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your system settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Link
          href="/admin/settings/areas"
          className="group flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary-300 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-lg shrink-0">
              <MapPin size={22} />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Manage Service Areas</h2>
              <p className="text-sm text-gray-500 mt-0.5">Add, edit, or delete Puroks and areas.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200" />
        </Link>

        <Link
          href="/admin/settings/sms"
          className="group flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary-300 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 text-gray-600 rounded-lg shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-200">
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">SMS Configuration</h2>
              <p className="text-sm text-gray-500 mt-0.5">Configure your SMS API provider settings.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200" />
        </Link>

        <Link
          href="/admin/settings/billing-cycle"
          className="group flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary-300 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 text-gray-600 rounded-lg shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-200">
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Billing Cycle</h2>
              <p className="text-sm text-gray-500 mt-0.5">Configure the system-wide billing cycle due date.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all duration-200" />
        </Link>
      </div>
    </div>
  )
}
