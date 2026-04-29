'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DueDateBadge from '@/components/ui/DueDateBadge'
import Avatar from '@/components/ui/Avatar'
import type { AdminPaymentProgress } from '@/types'

interface Props {
  progress?: AdminPaymentProgress
  previousProgress?: AdminPaymentProgress
  isLoading: boolean
  currentPeriodLabel?: string
  previousPeriodLabel?: string
}

export default function PaymentCollectionProgress({ progress, previousProgress, isLoading, currentPeriodLabel, previousPeriodLabel }: Props) {
  const [showingCurrent, setShowingCurrent] = useState(true)

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!progress) return null

  const displayed = showingCurrent ? progress : previousProgress
  const periodLabel = showingCurrent ? currentPeriodLabel : previousPeriodLabel

  if (!displayed) return null

  return (
    <div className="bg-card rounded-xl border border-border p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            <h2 className="text-xl font-semibold text-foreground">Payment collection progress</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {periodLabel} - all routes
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-muted rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Total consumers</p>
          <p className="text-4xl font-bold text-foreground">{displayed.totalConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Paid</p>
          <p className="text-4xl font-bold text-[#2d6a4f] dark:text-green-400">{displayed.paidConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Not yet paid</p>
          <p className="text-4xl font-bold text-[#8c6b23] dark:text-amber-400">{displayed.notYetPaidConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-5 flex flex-col items-center justify-center gap-1">
          <p className="text-sm text-muted-foreground text-center">Overall</p>
          <p className="text-4xl font-bold text-foreground">{displayed.overallCompletion}%</p>
        </div>
      </div>

      {/* Breakdown per Cashier */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-5 tracking-widest uppercase">
          Per Cashier Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {displayed.cashierBreakdown.map((cashier) => {
            const isComplete = cashier.notYetPaidConsumers === 0
            const percentage =
              cashier.totalConsumers > 0
                ? Math.round((cashier.paidConsumers / cashier.totalConsumers) * 100)
                : 0

            return (
              <div key={cashier.cashierId} className="border border-border rounded-xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar firstName={cashier.firstName} lastName={cashier.lastName} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {cashier.firstName} {cashier.lastName}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{cashier.assignedAreaName}</p>
                    </div>
                  </div>
                  {isComplete ? (
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      Complete
                    </span>
                  ) : (
                    <span className="bg-[#fdf0e6] dark:bg-[#5c2d1e] text-[#b83d1c] dark:text-amber-300 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      {cashier.notYetPaidConsumers} unpaid
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>
                      {cashier.paidConsumers} / {cashier.totalConsumers} paid
                    </span>
                    <span className="font-medium text-foreground">{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-[#d4e1c1] dark:bg-green-700 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
          {displayed.cashierBreakdown.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-6 col-span-2">
              {showingCurrent ? 'No active cashiers found.' : 'No data for previous cycle.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
