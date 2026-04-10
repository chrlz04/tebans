'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SearchBar from '@/components/shared/SearchBar'
import type { Consumer } from '@/types'

const readingSchema = z.object({
  consumerId:        z.string().min(1, 'Please select a consumer'),
  currentReading:    z
    .number({ error: 'Reading must be a number' })
    .min(0, 'Reading cannot be negative'),
  readingDate:       z.string().min(1, 'Reading date is required'),
  dueDate:           z.string().min(1, 'Due date is required'),
  amountWithTaxEvat: z
    .number({ error: 'Amount must be a number' })
    .min(0, 'Amount cannot be negative'),
})

type ReadingFormValues = z.infer<typeof readingSchema>

// ── Inner component that uses useSearchParams ─────────────
function RecordReadingForm() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('meter_reader')
  const router      = useRouter()
  const searchParams = useSearchParams()

  // ── Read URL params ───────────────────────────────────
  const prefilledConsumerId   = searchParams.get('consumerId')   || ''
  const prefilledConsumerName = searchParams.get('consumerName') || ''
  const prefilledMeterSerial  = searchParams.get('meterSerialNo') || ''

  const [search, setSearch]                     = useState('')
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null)
  const [isSuccess, setIsSuccess]               = useState(false)
  const [generatedBillAmount, setGeneratedBillAmount] = useState<number | null>(null)

  const { data: consumers } = useQuery<Consumer[]>({
    queryKey: ['meter-reader-consumers-search', search],
    queryFn: async () => {
      const res = await api.get('/meter-reader/consumers', {
        params: { search },
      })
      return res.data
    },
    enabled: hasAccess && search.length > 1 && !selectedConsumer,
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      consumerId:  prefilledConsumerId,
      readingDate: new Date().toISOString().split('T')[0],
    },
  })

  // ── Auto-select consumer if coming from consumers page ──
  useEffect(() => {
    if (prefilledConsumerId && prefilledConsumerName) {
      setSelectedConsumer({
        consumerId:    prefilledConsumerId,
        firstName:     prefilledConsumerName.split(' ')[0],
        lastName:      prefilledConsumerName.split(' ').slice(1).join(' '),
        meterSerialNo: prefilledMeterSerial,
        address:       '',
        areaName:      '',
        contactNo:     '',
        accountStatus: 'Active',
      })
      setValue('consumerId', prefilledConsumerId)
      setSearch(prefilledConsumerName)
    }
  }, [prefilledConsumerId, prefilledConsumerName, prefilledMeterSerial, setValue])

  const mutation = useMutation({
    mutationFn: async (values: ReadingFormValues) => {
      const res = await api.post('/meter-reader/readings', values)
      return res.data
    },
    onSuccess: (data) => {
      setGeneratedBillAmount(data.billAmount)
      setIsSuccess(true)
      reset()
      setSelectedConsumer(null)
      setSearch('')
    },
  })

    const { data: previousReadingData } = useQuery<{ previousReading: number }>({
        queryKey: ['previous-reading', selectedConsumer?.consumerId],
        queryFn: async () => {
            const res = await api.get(
            `/meter-reader/consumers/${selectedConsumer!.consumerId}/previous-reading`
            )
            return res.data
        },
    enabled: !!selectedConsumer,
})

const previousReading = Number(previousReadingData?.previousReading ?? 0)

  if (authLoading) return null
  if (!hasAccess)  return null

  // ── Success screen ────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto mt-12 flex flex-col items-center gap-6 text-center">
        <div className="bg-primary-50 p-5 rounded-full">
          <CheckCircle size={48} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Bill Generated Successfully
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            The bill has been generated and an SMS notification has been
            sent to the consumer.
          </p>
        </div>
        {generatedBillAmount !== null && (
          <div className="bg-white rounded-xl border border-gray-200 px-8 py-5 w-full">
            <p className="text-sm text-gray-500">Bill Amount</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">
              ₱{generatedBillAmount.toLocaleString('en-PH', {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push('/meter-reader/consumers')}
          >
            Back to Consumers
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsSuccess(false)}
          >
            Record Another Reading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/meter-reader/consumers"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Record Meter Reading
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Input meter reading data to generate a bill
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex flex-col gap-5"
      >

        {/* ── Consumer Selection ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Consumer
          </h2>

          {/* If pre-filled from consumers page — show locked card */}
          {selectedConsumer ? (
            <div className="flex flex-col gap-3">
              <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary-800">
                      {selectedConsumer.firstName} {selectedConsumer.lastName}
                    </p>
                    <p className="text-xs text-primary-600 font-mono mt-0.5">
                      {selectedConsumer.consumerId}
                    </p>
                    {selectedConsumer.meterSerialNo && (
                      <p className="text-xs text-primary-600 mt-0.5">
                        Meter: {selectedConsumer.meterSerialNo}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedConsumer(null)
                      setValue('consumerId', '')
                      setSearch('')
                      router.replace('/meter-reader/readings/new')
                    }}
                    className="text-xs text-primary-600 hover:text-primary-800 underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Search */}
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search consumer by name or account number..."
              />

              {/* Search Results */}
              {consumers && consumers.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {consumers.map((consumer) => (
                    <button
                      key={consumer.consumerId}
                      type="button"
                      onClick={() => {
                        setSelectedConsumer(consumer)
                        setValue('consumerId', consumer.consumerId)
                        setSearch(
                          `${consumer.firstName} ${consumer.lastName}`
                        )
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 transition-colors text-left border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {consumer.firstName} {consumer.lastName}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {consumer.consumerId} — {consumer.areaName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {consumer.meterSerialNo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {errors.consumerId && (
            <p className="text-xs text-red-600">{errors.consumerId.message}</p>
          )}
        </div>

        {/* ── Reading Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900">
            Reading Details
        </h2>

        {/* Previous Reading — read only display */}
        {selectedConsumer && (
            <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
                Previous Reading (kWh)
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-600">
                {previousReading.toFixed(2)}
            </div>
            </div>
        )}

        <div className="grid grid-cols-3 gap-4">
            <Input
            label="Current Reading (kWh)"
            type="number"
            placeholder="Enter current reading"
            error={errors.currentReading?.message}
            required
            {...register('currentReading', { valueAsNumber: true })}
            />
            <Input
            label="Reading Date"
            type="date"
            error={errors.readingDate?.message}
            required
            {...register('readingDate')}
            />
            <Input
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            required
            {...register('dueDate')}
            />
        </div>

        <Input
            label="Amount with Tax / EVAT (₱)"
            type="number"
            placeholder="Enter amount as computed by BOHECO"
            error={errors.amountWithTaxEvat?.message}
            required
            {...register('amountWithTaxEvat', { valueAsNumber: true })}
        />

        <p className="text-xs text-gray-400">
            Enter the amount as computed from the BOHECO billing sheet.
            Previous reading is auto-filled from the last recorded reading.
        </p>
        </div>

        {/* SMS Notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <Zap size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Submitting this form will automatically generate the bill and
            send an SMS notification to the consumer's registered mobile
            number.
          </p>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            Failed to record meter reading. Please try again.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/meter-reader/consumers">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting || mutation.isPending}
          >
            Generate Bill & Send SMS
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Wrapper with Suspense (required for useSearchParams) ──
export default function RecordMeterReadingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading...</div>}>
      <RecordReadingForm />
    </Suspense>
  )
}