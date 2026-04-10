'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, List } from 'lucide-react'

export default function ConsumerTabs() {
  const pathname = usePathname()

  // Match the screenshot design where active tab is solid green and inactive is text
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <Link
        href="/meter-reader/consumers"
        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
          pathname === '/meter-reader/consumers'
            ? 'bg-[#6a994e] text-white' // Specific green from the screenshot
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <List size={18} />
        View Consumers
      </Link>
      <Link
        href="/meter-reader/consumers/new"
        className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
          pathname === '/meter-reader/consumers/new'
            ? 'bg-[#6a994e] text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Plus size={18} />
        Register New Consumer
      </Link>
    </div>
  )
}
