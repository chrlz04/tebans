'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Send } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import type { OverdueAccount } from '@/types'

export default function DisconnectionsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')
  const queryClient = useQueryClient()
  const [selectedConsumer, setSelectedConsumer] = useState<OverdueAccount | null>(null)
  const [smsMessage, setSmsMessage] = useState('')
  const [smsSent, setSmsSent] = useState(false)

  const { data: overdueAccounts, isLoading } = useQuery<OverdueAccount[]>({
    queryKey: ['overdue-accounts'],
    queryFn: async () => {
      const res = await api.get('/meter-reader/disconnections/overdue')
      return res.data
    },
    enabled: hasAccess,
  })

  const disconnectMutation = useMutation({
    mutationFn: async ({
      consumerId,
      message,
    }: {
      consumerId: string
      message: string
    }) => {
      await api.post('/meter-reader/disconnections', {
        consumerId,
        smsMessage: message,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdue-accounts'] })
      setSmsSent(true)
      setTimeout(() => {
        setSmsSent(false)
        setSelectedConsumer(null)
        setSmsMessage('')
      }, 3000)
    },
  })

  const handleSelectConsumer = (consumer: OverdueAccount) => {
    setSelectedConsumer(consumer)
    setSmsSent(false)
    setSmsMessage(
      `Dear ${consumer.firstName} ${consumer.lastName}, your electricity service is scheduled for disconnection on ${new Date(consumer.scheduledDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} due to unpaid balance of ₱${consumer.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}. Please settle your account immediately. - Tubod Electric Cooperative`
    )
  }

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Disconnections</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage overdue accounts and send disconnection notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lists Column */}
        <div className="flex flex-col gap-6">

          {/* Overdue Accounts List */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-base font-semibold text-foreground">
              Overdue Accounts
            </h2>
          </div>

            {isLoading ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-lg" />
                ))}
              </div>
            ) : overdueAccounts && overdueAccounts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {overdueAccounts.map((account) => (
                  <button
                    key={account.consumerId}
                    type="button"
                    onClick={() => handleSelectConsumer(account)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedConsumer?.consumerId === account.consumerId
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-border hover:border-gray-300 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {account.firstName} {account.lastName}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {account.consumerId}
                        </p>
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {account.monthsOverdue} month{account.monthsOverdue > 1 ? 's' : ''} overdue
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-foreground">
                          ₱{account.amountDue.toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <Badge status={account.requestStatus} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Scheduled:{' '}
                      {new Date(account.scheduledDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No overdue accounts found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Consumer Summary & SMS Action Panel */}
        <div className="flex flex-col gap-6 sticky top-6 h-fit">

          {/* Consumer Summary Card */}
          {selectedConsumer && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="bg-[#688E3E] px-6 py-4">
                <h2 className="text-lg font-semibold text-white">
                  Consumer Summary
                </h2>
              </div>

              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <span className="text-sm text-foreground">Status:</span>
                  <Badge status={selectedConsumer.requestStatus} />
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="text-base font-semibold text-foreground font-mono mt-0.5">{selectedConsumer.consumerId}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Consumer Name</p>
                    <p className="text-base font-medium text-foreground mt-0.5">{selectedConsumer.firstName} {selectedConsumer.lastName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Service Address</p>
                    <p className="text-sm text-foreground mt-0.5">{selectedConsumer.address}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Mobile Number</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{selectedConsumer.contactNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Scheduled Date</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {new Date(selectedConsumer.scheduledDate).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Months Overdue</p>
                      <p className="text-sm font-medium text-red-600 mt-0.5">
                        {selectedConsumer.monthsOverdue} month{selectedConsumer.monthsOverdue > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount Due</p>
                      <p className="text-sm font-bold text-red-600 mt-0.5">
                        ₱{selectedConsumer.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* SMS Action Panel */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Send size={18} className="text-primary-500" />
              <h2 className="text-base font-semibold text-foreground">
                Automated SMS Action
              </h2>
            </div>

            {!selectedConsumer ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Select an overdue account on the left to view summary and send a disconnection notification.
              </div>
            ) : (
              <div className="flex flex-col gap-4">

                {/* SMS Message */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">
                    SMS Message
                  </label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 text-sm text-foreground rounded-lg border border-gray-300 bg-card focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {smsMessage.length} characters
                  </p>
                </div>

                {/* Success Message */}
                {smsSent && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                    SMS sent and disconnection request submitted successfully.
                  </div>
                )}

                {disconnectMutation.isError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    Failed to send SMS. Please try again.
                  </div>
                )}

                <Button
                  variant="primary"
                  isLoading={disconnectMutation.isPending}
                  onClick={() =>
                    disconnectMutation.mutate({
                      consumerId: selectedConsumer.consumerId,
                      message: smsMessage,
                    })
                  }
                  className="w-full"
                >
                  <Send size={16} className="mr-2" />
                  Send SMS Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}