'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function BillingCycleSettingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const { data: cycle, isLoading } = useQuery({
    queryKey: ['billing-cycle'],
    queryFn: async () => {
      const res = await api.get('/settings/billing-cycle')
      return res.data
    }
  })

  const [endDay, setEndDay] = useState(27)

  // Wait for data to set initial state
  if (!isLoading && cycle && endDay === 27 && cycle.endDay !== 27) {
      setEndDay(cycle.endDay)
  }

  const mutation = useMutation({
    mutationFn: async (newEndDay: number) => {
      const res = await api.put('/admin/settings/billing-cycle', { endDay: newEndDay })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-cycle'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setSuccessMsg('Billing cycle updated successfully.')
      setErrorMsg('')
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
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
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
                  {successMsg}
                </div>
              )}

            <div>
              <p className="text-sm text-gray-600 mb-4">
                The billing cycle sets the timeframe used to calculate active bills, generate dashboards metrics, and determine due dates.
                The system currently uses an end date of the <b>{endDay}</b>, which means the cycle starts on the <b>{startDay}</b>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                      label="Cycle End Day / Due Date"
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
