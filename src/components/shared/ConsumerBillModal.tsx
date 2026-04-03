'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import type { AccountStatus } from '@/types'

interface ConsumerInfo {
  consumerId:    string
  firstName:     string
  lastName:      string
  address:       string
  meterSerialNo: string
  contactNo:     string
  accountStatus: AccountStatus
}

interface BillDetail {
  billId:          string
  amount:          number
  dueDate:         string
  paymentStatus:   'Paid' | 'Unpaid' | 'Partial'
  billingMonth:    string
  previousReading: number
  currentReading:  number
  consumption:     number
}

interface BillResponse {
  consumer: ConsumerInfo
  bills:    BillDetail[]
}

interface ConsumerBillModalProps {
  isOpen:       boolean
  onClose:      () => void
  consumerId:   string
  consumerName: string
}

export default function ConsumerBillModal({
  isOpen,
  onClose,
  consumerId,
  consumerName,
}: ConsumerBillModalProps) {
  const [selectedBill, setSelectedBill] = useState<BillDetail | null>(null)

  const { data, isLoading } = useQuery<BillResponse>({
    queryKey: ['consumer-bill', consumerId],
    queryFn: async () => {
      const res = await api.get(
        `/meter-reader/consumers/${consumerId}/bill`
      )
      return res.data ?? { consumer: null, bills: [] }
    },
    enabled: isOpen && !!consumerId,
  })

  const bills    = data?.bills    ?? []
  const consumer = data?.consumer ?? null

  function handleClose() {
    setSelectedBill(null)
    onClose()
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
    })

  const fmtDateLong = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

  const peso = (n: number) =>
    (n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })

  // ── Detail view ──────────────────────────────────────────
  if (selectedBill && consumer) {
    const paymentDeadline = fmtDateLong(selectedBill.dueDate)

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Bill Details"
        size="lg"
      >
        <div className="flex flex-col gap-4">

          {/* Back button */}
          <button
            onClick={() => setSelectedBill(null)}
            className="flex items-center gap-1.5 text-xs text-primary-600
              hover:opacity-75 transition-opacity w-fit"
          >
            <ArrowLeft size={12} />
            Back to all bills
          </button>

          {/* Header */}
          <div className="text-center py-1">
            <p className="text-base font-bold text-primary-600 leading-tight">
              TEBANS
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Tubod Electricity Billing Alert and Notification System
              · Tubod, Clarin, Bohol
            </p>
          </div>

          {/* Consumer info */}
          <div className="border border-gray-100 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Consumer Information
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
              <div>
                <span className="text-gray-400">Account #</span>
                <p className="font-mono text-gray-800 mt-0.5">
                  {consumer.consumerId}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Consumer</span>
                <p className="font-medium text-gray-800 mt-0.5">
                  {consumer.firstName} {consumer.lastName}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Meter #</span>
                <p className="font-mono text-gray-800 mt-0.5">
                  {consumer.meterSerialNo}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Contact</span>
                <p className="font-mono text-gray-800 mt-0.5">
                  {consumer.contactNo}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Service Address</span>
                <p className="text-gray-800 mt-0.5">{consumer.address}</p>
              </div>
              <div>
                <span className="text-gray-400">Account Status</span>
                <div className="mt-1">
                  <Badge status={consumer.accountStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* Period & due date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-600">
                Billing Period
              </span>
              <p className="text-sm font-bold text-blue-900 mt-0.5">
                {selectedBill.billingMonth}
              </p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
              <span className="text-[11px] font-semibold text-red-600">
                Due Date
              </span>
              <p className="text-sm font-bold text-red-900 mt-0.5">
                {fmtDate(selectedBill.dueDate)}
              </p>
            </div>
          </div>

          {/* Meter Reading */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Meter Reading
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-gray-50 rounded-lg px-3 py-3 border border-gray-200">
                <p className="text-[11px] text-gray-400 mb-1">Previous</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedBill.previousReading.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400">kWh</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg px-3 py-3 border border-gray-200">
                <p className="text-[11px] text-gray-400 mb-1">Current</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedBill.currentReading.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400">kWh</p>
              </div>
              <div className="text-center bg-gray-50 rounded-lg px-3 py-3 border border-gray-200">
                <p className="text-[11px] text-gray-400 mb-1">Consumption</p>
                <p className="text-lg font-bold text-primary-600">
                  {selectedBill.consumption.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400">kWh</p>
              </div>
            </div>
          </div>

          {/* Amount banner */}
          <div className="px-5 py-4 rounded-xl bg-primary-500 flex items-center
            justify-between text-white">
            <div>
              <p className="text-xs font-semibold opacity-90">Total Amount Due</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[11px] opacity-70">
                  Deadline: {paymentDeadline}
                </p>
                <Badge status={selectedBill.paymentStatus} />
              </div>
            </div>
            <span className="text-2xl font-extrabold">
              ₱{peso(selectedBill.amount)}
            </span>
          </div>

        </div>
      </Modal>
    )
  }

  // ── List view ─────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Consumer Bills"
      size="lg"
    >
      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>

      ) : bills.length > 0 ? (
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 mb-4">
            {consumerName} · {bills.length} record{bills.length !== 1 ? 's' : ''}
          </p>
          <div className="divide-y divide-gray-100 border border-gray-100
            rounded-xl overflow-hidden">
            {bills.map((bill) => (
              <button
                key={bill.billId}
                onClick={() => setSelectedBill(bill)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left
                  hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {bill.billingMonth}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Due {fmtDate(bill.dueDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    ₱{peso(bill.amount)}
                  </p>
                  <div className="mt-0.5">
                    <Badge status={bill.paymentStatus} />
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-300 group-hover:text-gray-500
                    transition-colors shrink-0"
                />
              </button>
            ))}
          </div>
        </div>

      ) : (
        <div className="py-16 text-center text-sm text-gray-400">
          No billing records found for this consumer.
        </div>
      )}
    </Modal>
  )
}