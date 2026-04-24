'use client'

import React from 'react'
import DueDateBadge from '@/components/ui/DueDateBadge'
import Avatar from '@/components/ui/Avatar'
import type { AdminBillingProgress } from '@/types'

interface Props {
  progress?: AdminBillingProgress
  isLoading: boolean
}

export default function BillingCycleProgress({ progress, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!progress) return null

  const currentMonthYear = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Billing cycle progress</h2>
          <p className="text-sm text-gray-500 mt-1">{currentMonthYear} — all routes</p>
        </div>
        <DueDateBadge />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#f8f9f6] rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-1">Total consumers</p>
          <p className="text-3xl font-bold text-gray-900">{progress.totalConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-1">Billed</p>
          <p className="text-3xl font-bold text-[#2d6a4f]">{progress.billedConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-1">Not yet billed</p>
          <p className="text-3xl font-bold text-[#8c6b23]">{progress.unbilledConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-4 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-1">Overall</p>
          <p className="text-3xl font-bold text-gray-900">{progress.overallCompletion}%</p>
        </div>
      </div>

      {/* Breakdown per Meter Reader */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4 tracking-wider uppercase">Per Meter Reader Breakdown</h3>
        <div className="flex flex-col gap-4">
          {progress.meterReaderBreakdown.map((mr) => {
            const isComplete = mr.unbilledConsumers === 0
            const percentage = mr.totalConsumers > 0 ? Math.round((mr.billedConsumers / mr.totalConsumers) * 100) : 0

            return (
              <div key={mr.meterReaderId} className="border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar firstName={mr.firstName} lastName={mr.lastName} />
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{mr.firstName} {mr.lastName}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{mr.assignedAreaName}</p>
                    </div>
                  </div>
                  {isComplete ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      Complete
                    </span>
                  ) : (
                    <span className="bg-[#fdf0e6] text-[#b83d1c] text-xs font-medium px-2.5 py-1 rounded-full">
                      {mr.unbilledConsumers} unbilled
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span>{mr.billedConsumers} / {mr.totalConsumers} billed</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#d4e1c1] h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )
          })}
          {progress.meterReaderBreakdown.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-4">
              No active meter readers found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
