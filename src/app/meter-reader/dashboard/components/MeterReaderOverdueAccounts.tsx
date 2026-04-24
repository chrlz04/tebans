'use client'

import React from 'react'
import type { OverdueAccount } from '@/types'

// Helper to get initials
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

interface Props {
  accounts?: OverdueAccount[]
  isLoading: boolean
}

export default function MeterReaderOverdueAccounts({ accounts, isLoading }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Overdue Accounts
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Accounts requiring disconnection notices
        </p>
      </div>
      <div className="flex flex-col flex-1">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading overdue accounts...</div>
        ) : !accounts || accounts.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">No overdue accounts found.</div>
        ) : (
          <div className="flex flex-col flex-1 overflow-y-auto pr-2 -mr-2" style={{ maxHeight: '400px' }}>
            {accounts.map((account, index) => (
              <div
                key={account.consumerId}
                className={`flex flex-row items-center justify-between py-3 ${
                  index !== 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                {/* Left Side */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 text-red-700 flex items-center justify-center text-xs font-semibold">
                    {getInitials(account.firstName, account.lastName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.firstName} {account.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {account.consumerId} &middot; {account.monthsOverdue} mo{account.monthsOverdue !== 1 ? 's' : ''} overdue
                    </p>
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                  <span className="text-sm font-semibold text-gray-900">
                    ₱{Number(account.amountDue).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
