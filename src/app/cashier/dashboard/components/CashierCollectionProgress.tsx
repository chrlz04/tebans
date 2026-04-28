'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import DueDateBadge from '@/components/ui/DueDateBadge'
import type { CashierCollectionProgress as CashierCollectionProgressType } from '@/types'

interface Props {
  progress?: CashierCollectionProgressType
  previousProgress?: CashierCollectionProgressType
  isLoading: boolean
}

export default function CashierCollectionProgress({ progress, previousProgress, isLoading }: Props) {
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

  const now = new Date()
  const currentMonthYear = now.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'long',
    year: 'numeric',
  })
  const prevDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
  prevDate.setMonth(prevDate.getMonth() - 1)
  const prevMonthLabel = prevDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const displayed = showingCurrent ? progress : previousProgress
  if (!displayed) return null

  const isComplete = displayed.notYetPaidConsumers === 0

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
            <h2 className="text-xl font-semibold text-foreground">My collection progress</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {showingCurrent ? currentMonthYear : prevMonthLabel}
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
          <p className="text-sm text-muted-foreground mb-2">Paid</p>
          <p className="text-4xl font-bold text-[#2d6a4f] dark:text-green-400">{displayed.paidConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">Not yet paid</p>
          <p className="text-4xl font-bold text-[#8c6b23] dark:text-amber-400">{displayed.notYetPaidConsumers}</p>
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
          <span>{displayed.paidConsumers} / {displayed.totalConsumers} consumers paid</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-[#d4e1c1] dark:bg-green-700 h-3 rounded-full transition-all"
            style={{ width: `${displayed.completionRate}%` }}
          />
        </div>
      </div>

      {/* Not Yet Paid List */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 tracking-wider uppercase">
          {showingCurrent ? "Consumers who haven't paid yet" : "Consumers who didn't pay"}
        </h3>

        {isComplete ? (
          <div className="text-center py-8">
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-xl p-6 inline-block">
              <p className="font-semibold text-lg">Great job!</p>
              <p className="text-sm mt-1">
                {showingCurrent
                  ? 'You have collected all payments for this cycle.'
                  : 'All payments were collected for that cycle.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.notYetPaidList.map((consumer) => (
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
                <div className="text-right">
                  <p className="text-base font-bold text-[#8c6b23] dark:text-amber-400 whitespace-nowrap">
                    ₱{Number(consumer.balance).toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <span className="bg-[#fdf0e6] dark:bg-[#5c2d1e] text-[#b83d1c] dark:text-amber-300 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap inline-block mt-1">
                    Unpaid
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
