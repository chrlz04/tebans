'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DueDateBadge from '@/components/ui/DueDateBadge'
import type { MeterReaderBillingProgress as MRBillingProgressType } from '@/types'

interface Props {
  progress?: MRBillingProgressType
  previousProgress?: MRBillingProgressType
  isLoading: boolean
  currentPeriodLabel?: string
  previousPeriodLabel?: string
}

export default function MeterReaderBillingProgress({ progress, previousProgress, isLoading, currentPeriodLabel, previousPeriodLabel }: Props) {
  const [showingCurrent, setShowingCurrent] = useState(true)

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!progress) return null

  const displayed = showingCurrent ? progress : previousProgress
  if (!displayed) return null

  const periodLabel = showingCurrent ? currentPeriodLabel : previousPeriodLabel

  const isComplete = displayed.unbilledConsumers === 0

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          {previousProgress && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowingCurrent(false)}
                disabled={!showingCurrent}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous cycle"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setShowingCurrent(true)}
                disabled={showingCurrent}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Current cycle"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-foreground">My billing progress</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {periodLabel}
              {!showingCurrent && (
                <span className="ml-2 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Previous cycle
                </span>
              )}
            </p>
          </div>
        </div>
        {showingCurrent && <DueDateBadge />}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">My consumers</p>
          <p className="text-4xl font-bold text-foreground">{displayed.totalConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">Billed</p>
          <p className="text-4xl font-bold text-[#2d6a4f] dark:text-green-400">{displayed.billedConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">Not yet billed</p>
          <p className="text-4xl font-bold text-[#8c6b23] dark:text-amber-400">{displayed.unbilledConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">Completion</p>
          <p className="text-4xl font-bold text-foreground">{displayed.completionRate}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-8">
        <div className="flex justify-between text-sm text-foreground">
          <span>Progress</span>
          <span>{displayed.billedConsumers} / {displayed.totalConsumers} consumers billed</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-[#d4e1c1] dark:bg-green-700 h-3 rounded-full transition-all"
            style={{ width: `${displayed.completionRate}%` }}
          />
        </div>
      </div>

      {/* Unbilled List */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 tracking-wider uppercase">
          {showingCurrent ? "Consumers I haven't billed yet" : "Consumers I didn't bill"}
        </h3>

        {isComplete ? (
          <div className="text-center py-8">
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-xl p-6 inline-block">
              <p className="font-semibold text-lg">Great job!</p>
              <p className="text-sm mt-1">
                {showingCurrent
                  ? 'You have completed all billing for this cycle.'
                  : 'You completed all billing for that cycle.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.unbilledList.map((consumer) => (
              <div
                key={consumer.consumerId}
                className="flex justify-between items-center py-3 border-b border-border/50 last:border-0"
              >
                <div>
                  <h4 className="text-base font-semibold text-foreground">
                    {consumer.firstName} {consumer.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {consumer.consumerId} · {consumer.address}
                  </p>
                </div>
                <span className="bg-[#fdf0e6] dark:bg-[#5c2d1e] text-[#b83d1c] dark:text-amber-300 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap">
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
