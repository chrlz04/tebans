'use client'

import React from 'react'
import DueDateBadge from '@/components/ui/DueDateBadge'
import type { MeterReaderBillingProgress as MRBillingProgressType } from '@/types'

interface Props {
  progress?: MRBillingProgressType
  isLoading: boolean
}

export default function MeterReaderBillingProgress({ progress, isLoading }: Props) {
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

  const isComplete = progress.unbilledConsumers === 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900">My billing progress</h2>
        <DueDateBadge />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#f8f9f6] rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2">My consumers</p>
          <p className="text-4xl font-bold text-gray-900">{progress.totalConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2">Billed</p>
          <p className="text-4xl font-bold text-[#2d6a4f]">{progress.billedConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2">Not yet billed</p>
          <p className="text-4xl font-bold text-[#8c6b23]">{progress.unbilledConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-600 mb-2">Completion</p>
          <p className="text-4xl font-bold text-gray-900">{progress.completionRate}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-8">
        <div className="flex justify-between text-sm text-gray-700">
          <span>Progress</span>
          <span>{progress.billedConsumers} / {progress.totalConsumers} consumers billed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-[#d4e1c1] h-3 rounded-full"
            style={{ width: `${progress.completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Unbilled List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 mb-4 tracking-wider uppercase">Consumers I haven't billed yet</h3>

        {isComplete ? (
          <div className="text-center py-8">
            <div className="bg-green-50 text-green-800 rounded-xl p-6 inline-block">
              <p className="font-semibold text-lg">Great job!</p>
              <p className="text-sm mt-1">You have completed all billing for this cycle.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {progress.unbilledList.map((consumer) => (
              <div key={consumer.consumerId} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{consumer.firstName} {consumer.lastName}</h4>
                  <p className="text-sm text-gray-500 mt-0.5">{consumer.consumerId} · {consumer.address}</p>
                </div>
                <span className="bg-[#fdf0e6] text-[#b83d1c] text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
                  No bill
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
