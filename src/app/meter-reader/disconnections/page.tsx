'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Send } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface OverdueAccount {
  consumerId:          string
  firstName:           string
  lastName:            string
  monthsOverdue:       number
  amountDue:           number
  scheduledDate:       string
  contactNo:           string
  requestStatus:       'Pending' | 'Executed' | 'Cancelled'
  isInactive?:         boolean
}

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

  const { data: inactiveAccounts, isLoading: inactiveLoading } = useQuery<OverdueAccount[]>({
    queryKey: ['inactive-accounts'],
    queryFn: async () => {
      const res = await api.get('/meter-reader/disconnections/inactive')
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
      queryClient.invalidateQueries({ queryKey: ['inactive-accounts'] })
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
    if (consumer.isInactive) {
      setSmsMessage(
        `Dear ${consumer.firstName} ${consumer.lastName}, your electricity service is scheduled for disconnection on ${new Date(consumer.scheduledDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} because there has been no billing history recorded for your account for a month. Please contact our office if this is an error. - Tubod Electric Cooperative`
      )
    } else {
      setSmsMessage(
        `Dear ${consumer.firstName} ${consumer.lastName}, your electricity service is scheduled for disconnection on ${new Date(consumer.scheduledDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} due to unpaid balance of ₱${consumer.amountDue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}. Please settle your account immediately. - Tubod Electric Cooperative`
      )
    }
  }

  if (authLoading) return null
  if (!hasAccess) return null

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Disconnections</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage overdue accounts and send disconnection notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lists Column */}
        <div className="flex flex-col gap-6">

          {/* Overdue Accounts List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Overdue Accounts
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg" />
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
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {account.firstName} {account.lastName}
                      </p>
                      <p className="text-xs font-mono text-gray-500 mt-0.5">
                        {account.consumerId}
                      </p>
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {account.monthsOverdue} month{account.monthsOverdue > 1 ? 's' : ''} overdue
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-gray-900">
                        ₱{account.amountDue.toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <Badge status={account.requestStatus} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
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
              <div className="py-10 text-center text-sm text-gray-400">
                No overdue accounts found.
              </div>
            )}
          </div>

          {/* Inactive Accounts List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-yellow-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Inactive Accounts (No Billing History)
              </h2>
            </div>

            {inactiveLoading ? (
              <div className="flex flex-col gap-3 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : inactiveAccounts && inactiveAccounts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {inactiveAccounts.map((account) => (
                  <button
                    key={account.consumerId}
                    type="button"
                    onClick={() => handleSelectConsumer(account)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedConsumer?.consumerId === account.consumerId
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {account.firstName} {account.lastName}
                        </p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">
                          {account.consumerId}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1 font-medium">
                          No billing history for 1 month
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-gray-900">
                          ₱0.00
                        </span>
                        <Badge status={account.requestStatus} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
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
              <div className="py-10 text-center text-sm text-gray-400">
                No inactive accounts found.
              </div>
            )}
          </div>

        </div>

        {/* SMS Action Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <Send size={18} className="text-primary-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Automated SMS Action
            </h2>
          </div>

          {!selectedConsumer ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Select an overdue account on the left to send a disconnection
              notification.
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* Selected Consumer Info */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">Sending to</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {selectedConsumer.firstName} {selectedConsumer.lastName}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {selectedConsumer.contactNo}
                </p>
              </div>

              {/* SMS Message */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  SMS Message
                </label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="text-xs text-gray-400 text-right">
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
  )
}