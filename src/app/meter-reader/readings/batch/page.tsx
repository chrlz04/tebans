'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, SkipForward, Zap, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface BatchConsumer {
  consumerId: string
  firstName: string
  lastName: string
  meterSerialNo: string
  previousReading: number
  latestBillingMonth: string | null
}

const readingSchema = z.object({
  currentReading: z
    .number({ error: 'Reading must be a number' })
    .min(0, 'Reading cannot be negative'),
  readingDate: z.string().min(1, 'Reading date is required'),
  amountWithTaxEvat: z
    .number({ error: 'Amount must be a number' })
    .min(0, 'Amount cannot be negative'),
})

type ReadingFormValues = z.infer<typeof readingSchema>

export default function BatchRecordMeterReadingPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')
  const router = useRouter()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<{ text: string; isWarning: boolean } | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Fetch all active consumers
  const { data: consumers, isLoading: consumersLoading } = useQuery<BatchConsumer[]>({
    queryKey: ['meter-reader-batch-consumers'],
    queryFn: async () => {
      const res = await api.get('/meter-reader/consumers/batch')
      return res.data
    },
    enabled: hasAccess,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      readingDate: new Date().toISOString().split('T')[0],
    },
  })

  const currentConsumer = consumers?.[currentIndex]

  // Check if current consumer already has reading for this month
  useEffect(() => {
    if (!currentConsumer) return

    const currentMonth = new Date().toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
    })

    if (currentConsumer.latestBillingMonth === currentMonth) {
      setAlertMessage(`Consumer ${currentConsumer.consumerId} (${currentConsumer.firstName} ${currentConsumer.lastName}) already has a billing for ${currentMonth}. Skipping to next consumer.`)

      // Auto advance after short delay to let them read the message
      const timer = setTimeout(() => {
        handleNext()
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setAlertMessage(null)
    }
  }, [currentConsumer, currentIndex])

  const mutation = useMutation({
    mutationFn: async (values: ReadingFormValues & { consumerId: string }) => {
      const res = await api.post('/meter-reader/readings', values)
      return res.data
    },
    onSuccess: (data) => {
      if (!currentConsumer) {
        handleNext()
        return
      }

      if (data.smsSent) {
        setSuccessMessage({ text: `Reading saved for ${currentConsumer.firstName} ${currentConsumer.lastName}. SMS sent successfully! Moving to next consumer...`, isWarning: false })
      } else {
        setSuccessMessage({ text: `Reading saved for ${currentConsumer.firstName} ${currentConsumer.lastName}. SMS failed to send or no contact number. Moving to next consumer...`, isWarning: true })
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        handleNext()
      }, 3000)
    },
  })

  const handleNext = () => {
    reset({
      readingDate: new Date().toISOString().split('T')[0],
      currentReading: undefined,
      amountWithTaxEvat: undefined,
    })
    setAlertMessage(null)
    setSuccessMessage(null)

    if (consumers && currentIndex < consumers.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsCompleted(true)
    }
  }

  const onSubmit = (values: ReadingFormValues) => {
    if (!currentConsumer) return
    mutation.mutate({
      ...values,
      consumerId: currentConsumer.consumerId,
    })
  }

  if (authLoading || consumersLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading batch processing...</div>
  }

  if (!hasAccess) return null

  if (!consumers || consumers.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-12 flex flex-col items-center gap-6 text-center">
        <div className="bg-primary-50 p-5 rounded-full">
          <CheckCircle size={48} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">No Active Consumers Found</h2>
          <p className="text-sm text-gray-500 mt-1">There are no active consumers to record readings for.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/meter-reader/consumers')}>
          Back to Consumers
        </Button>
      </div>
    )
  }

  // ── Completion screen ────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="max-w-lg mx-auto mt-12 flex flex-col items-center gap-6 text-center">
        <div className="bg-primary-50 p-5 rounded-full">
          <CheckCircle size={48} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Batch Processing Complete</h2>
          <p className="text-sm text-gray-500 mt-1">You have reached the end of the consumer list.</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/meter-reader/consumers')}>
          Back to Consumers List
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/meter-reader/consumers"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Batch Meter Reading</h1>
            <p className="text-sm text-gray-500 mt-1">
              Record readings consecutively ({currentIndex + 1} of {consumers.length})
            </p>
          </div>
        </div>
        <div className="text-sm font-medium text-gray-500">
          Progress: {Math.round(((currentIndex) / consumers.length) * 100)}%
        </div>
      </div>

      {alertMessage && (
        <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <AlertCircle size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">{alertMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className={`mb-6 flex items-start gap-3 border rounded-lg px-4 py-3 ${successMessage.isWarning ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
          <AlertCircle size={18} className={`${successMessage.isWarning ? 'text-amber-600' : 'text-green-600'} mt-0.5 shrink-0`} />
          <p className={`text-sm ${successMessage.isWarning ? 'text-amber-800' : 'text-green-800'}`}>{successMessage.text}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / consumers.length) * 100}%` }}
        ></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* ── Consumer Info ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">Current Consumer</h2>
          <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-primary-900">
                  {currentConsumer?.firstName} {currentConsumer?.lastName}
                </p>
                <p className="text-sm text-primary-700 font-mono mt-1">
                  Account No: {currentConsumer?.consumerId}
                </p>
                <p className="text-sm text-primary-700 mt-0.5">
                  Meter Serial: <span className="font-mono">{currentConsumer?.meterSerialNo}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reading Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">Reading Details</h2>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Previous Reading (kWh)</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-600">
              {currentConsumer?.previousReading.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current Reading (kWh)"
              type="number"
              inputMode="numeric"
              placeholder="Enter current reading"
              error={errors.currentReading?.message}
              required
              disabled={!!alertMessage}
              {...register('currentReading', { valueAsNumber: true })}
            />
            <Input
              label="Reading Date"
              type="date"
              error={errors.readingDate?.message}
              required
              disabled={!!alertMessage || !!successMessage}
              {...register('readingDate')}
            />
          </div>

          <Input
            label="Amount with Tax / EVAT (₱)"
            type="number"
            placeholder="Enter amount as computed by BOHECO"
            error={errors.amountWithTaxEvat?.message}
            required
            disabled={!!alertMessage || !!successMessage}
            {...register('amountWithTaxEvat', { valueAsNumber: true })}
          />
        </div>

        {/* SMS Notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <Zap size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Submitting this form will automatically generate the bill and send an SMS notification to the consumer's registered mobile number.
          </p>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            Failed to record meter reading. Please try again.
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleNext}
            disabled={mutation.isPending || isSubmitting || !!successMessage}
          >
            <SkipForward size={16} className="mr-2" />
            Skip Consumer
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            isLoading={isSubmitting || mutation.isPending}
            disabled={!!alertMessage || !!successMessage}
          >
            Save & Next
          </Button>
        </div>
      </form>
    </div>
  )
}
