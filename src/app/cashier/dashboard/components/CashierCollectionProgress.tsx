'use client'

import React from 'react'
import DueDateBadge from '@/components/ui/DueDateBadge'
import type { CashierCollectionProgress as CashierCollectionProgressType } from '@/types'

interface Props {
  progress?: CashierCollectionProgressType
  isLoading: boolean
}

export default function CashierCollectionProgress({ progress, isLoading }: Props) {
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

  const isComplete = progress.notYetPaidConsumers === 0

  return (
    <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <h2 className="text-xl font-semibold text-foreground">My collection progress</h2>
        <DueDateBadge />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">My consumers</p>
          <p className="text-4xl font-bold text-foreground">{progress.totalConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">Paid</p>
          <p className="text-4xl font-bold text-[#2d6a4f] dark:text-green-400">{progress.paidConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">Not yet paid</p>
          <p className="text-4xl font-bold text-[#8c6b23] dark:text-amber-400">{progress.notYetPaidConsumers}</p>
        </div>
        <div className="bg-muted rounded-xl p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-2">Completion</p>
          <p className="text-4xl font-bold text-foreground">{progress.completionRate}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2 border-b border-border/50 pb-8">
        <div className="flex justify-between text-sm text-foreground">
          <span>Progress</span>
          <span>{progress.paidConsumers} / {progress.totalConsumers} consumers paid</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-[#d4e1c1] dark:bg-green-700 h-3 rounded-full transition-all"
            style={{ width: `${progress.completionRate}%` }}
          />
        </div>
      </div>

      {/* Not Yet Paid List */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 tracking-wider uppercase">
          Consumers who haven't paid yet
        </h3>

        {isComplete ? (
          <div className="text-center py-8">
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-xl p-6 inline-block">
              <p className="font-semibold text-lg">Great job!</p>
              <p className="text-sm mt-1">You have collected all payments for this cycle.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {progress.notYetPaidList.map((consumer) => (
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