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
      <div className="bg-card rounded-xl border border-border p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!progress) return null

  const currentMonthYear = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' })

  return (
    <div className="bg-card rounded-xl border border-border p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Billing cycle progress</h2>
          <p className="text-sm text-muted-foreground mt-1">{currentMonthYear} — all routes</p>
        </div>
        <DueDateBadge />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#f8f9f6] rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Total consumers</p>
          <p className="text-4xl font-bold text-foreground">{progress.totalConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Billed</p>
          <p className="text-4xl font-bold text-[#2d6a4f]">{progress.billedConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Not yet billed</p>
          <p className="text-4xl font-bold text-[#8c6b23]">{progress.unbilledConsumers}</p>
        </div>
        <div className="bg-[#f8f9f6] rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Overall</p>
          <p className="text-4xl font-bold text-foreground">{progress.overallCompletion}%</p>
        </div>
      </div>

      {/* Breakdown per Meter Reader */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-5 tracking-widest uppercase">Per Meter Reader Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {progress.meterReaderBreakdown.map((mr) => {
            const isComplete = mr.unbilledConsumers === 0
            const percentage = mr.totalConsumers > 0 ? Math.round((mr.billedConsumers / mr.totalConsumers) * 100) : 0

            return (
              <div key={mr.meterReaderId} className="border border-border rounded-xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar firstName={mr.firstName} lastName={mr.lastName} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">{mr.firstName} {mr.lastName}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{mr.assignedAreaName}</p>
                    </div>
                  </div>
                  {isComplete ? (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      Complete
                    </span>
                  ) : (
                    <span className="bg-[#fdf0e6] text-[#b83d1c] text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      {mr.unbilledConsumers} unbilled
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>{mr.billedConsumers} / {mr.totalConsumers} billed</span>
                    <span className="font-medium text-foreground">{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-[#d4e1c1] h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {progress.meterReaderBreakdown.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-6 col-span-2">
              No active meter readers found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}