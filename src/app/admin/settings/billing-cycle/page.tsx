'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { ArrowLeft, Save, CalendarClock, Info, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function BillingCycleSettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const { data: cycleData, isLoading } = useQuery({
    queryKey: ['billing-cycle-full'],
    queryFn: async () => {
      // Let's create an endpoint that returns both current and pending settings
      const res = await api.get('/admin/settings/billing-cycle/status')
      return res.data
    }
  })

  const [endDay, setEndDay] = useState(27)

  // Sync state with fetched data
  useEffect(() => {
    if (cycleData && cycleData.pendingEndDay) {
        setEndDay(cycleData.pendingEndDay)
    } else if (cycleData && cycleData.endDay) {
        setEndDay(cycleData.endDay)
    }
  }, [cycleData])

  const mutation = useMutation({
    mutationFn: async (newEndDay: number) => {
      const res = await api.put('/admin/settings/billing-cycle', { endDay: newEndDay })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['billing-cycle-full'] })
      queryClient.invalidateQueries({ queryKey: ['billing-cycle'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setSuccessMsg(data.message || 'Billing cycle update scheduled successfully.')
      setErrorMsg('')
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setSuccessMsg('')
      }, 5000)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Failed to update billing cycle.')
      setSuccessMsg('')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (endDay < 1 || endDay > 28) {
      setErrorMsg('End day must be between 1 and 28.')
      return
    }
    mutation.mutate(endDay)
  }

  const startDay = endDay + 1

  return (
    <div className="flex flex-col gap-6 max-w-2xl pt-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Billing Cycle Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure the standard billing cycle dates.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6" method="POST">
             {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-2">
                  <CalendarClock size={16} className="mt-0.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

            <div>
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 border border-blue-100 flex items-start gap-3">
                 <Info className="shrink-0 mt-0.5" size={18} />
                 <div>
                    <p className="font-medium mb-1">How billing cycle updates work:</p>
                    <p>To preserve data integrity for the current month's reporting and billing progress, changing the billing cycle dates will not affect the currently active cycle. The new dates will automatically take effect on the first day of the <strong>next</strong> billing cycle.</p>
                 </div>
              </div>

              {cycleData?.pendingEndDay && (
                <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                    <CalendarClock size={18} />
                    <span>Scheduled Change Pending</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    A change to end the cycle on the <strong>{cycleData.pendingEndDay}</strong> has been scheduled and will take effect automatically on <strong>{cycleData.effectiveDate}</strong>.
                  </p>

                  {endDay !== cycleData.pendingEndDay && (
                    <div className="mt-3 p-2 bg-amber-100/50 rounded flex items-start gap-2 border border-amber-200/50">
                      <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-800">
                        Warning: Saving a new end day will <strong>overwrite</strong> the currently scheduled pending change.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600 mb-4">
                The current active cycle ends on the <b>{cycleData?.endDay ?? 27}</b>, and starts on the <b>{cycleData?.startDay ?? 28}</b>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                      label="New Cycle End Day / Due Date"
                      type="number"
                      min={1}
                      max={28}
                      value={endDay}
                      onChange={(e) => setEndDay(parseInt(e.target.value) || 1)}
                      onKeyDown={(e) => {
                          if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                            e.preventDefault()
                          }
                      }}
                      required
                      helperText="Must be between 1 and 28."
                  />

                  <Input
                      label="Calculated Start Day"
                      type="number"
                      value={startDay}
                      disabled
                      className="bg-gray-50"
                      helperText="Automatically set based on the End Day."
                  />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end pt-4 border-t border-gray-100 gap-3">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto border border-gray-200"
                onClick={() => router.push('/admin/settings')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2"
                isLoading={mutation.isPending}
                disabled={endDay === cycleData?.pendingEndDay || (!cycleData?.pendingEndDay && endDay === cycleData?.endDay)}
              >
                <Save size={18} />
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
