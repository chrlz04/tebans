'use client'

import { Search, X } from 'lucide-react'
import clsx from 'clsx'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: SearchBarProps) {
  return (
    <div className={clsx('relative', className)}>
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" 
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full pl-10 pr-10 py-2 min-h-[44px] text-sm rounded-lg bg-white outline-none transition-all",
          "border border-gray-300 text-gray-800 placeholder:text-gray-400",
          "shadow-sm ring-1 ring-black/5",
          "focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20"
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}