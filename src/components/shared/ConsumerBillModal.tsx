'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, X } from 'lucide-react'
import api from '@/lib/api'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import type { Bill } from '@/types'

interface ConsumerBillModalProps {
  isOpen: boolean
  onClose: () => void
  consumerId: string
  consumerName: string
}

export default function ConsumerBillModal({
  isOpen,
  onClose,
  consumerId,
  consumerName,
}: ConsumerBillModalProps) {
  const { data: bills, isLoading } = useQuery<Bill[]>({
    queryKey: ['consumer-bill', consumerId],
    queryFn: async () => {
      const res = await api.get(`/meter-reader/consumers/${consumerId}/bill`)
      return res.data
    },
    enabled: isOpen && !!consumerId,
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Consumer Bill"
      size="lg"
    >
      {isLoading ? (
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-40 bg-gray-100 rounded-lg" />
          <div className="h-40 bg-gray-100 rounded-lg" />
        </div>
      ) : bills && bills.length > 0 ? (
        <div className="flex flex-col gap-8">
          {bills.map((bill) => (
            <div key={bill.billId} className="flex flex-col gap-6">
              
              {/* 1. Header & Address Section */}
              <div className="text-center mt-4">
                {/* Changed to your custom green */}
                <h1 className="text-2xl font-bold text-[#689633]">TEBANS</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Tubod Electricity Billing Alert and Notification System
                </p>
                <p className="text-xs text-gray-400">Tubod, Lanao del Norte</p>
              </div>

              <div className="border border-gray-100 rounded-xl bg-gray-50 p-6 flex flex-col gap-6">
                {/* 2. Consumer Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Consumer Information</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Account Number</span>
                      <p className="font-mono text-gray-900">{bill.billId}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Consumer Name</span>
                      <p className="text-gray-900 font-medium">{consumerName}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <span className="text-xs text-gray-500">Meter Number</span>
                      <p className="font-mono text-gray-400">MTR-001-2024 (Placeholder)</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <span className="text-xs text-gray-500">Service Address</span>
                      <p className="text-gray-400">
                        123 Main Street, Barangay Poblacion, Tubod (Placeholder)
                      </p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <span className="text-xs text-gray-500">Contact Number</span>
                      <p className="font-mono text-gray-400">+63 912 345 6781 (Placeholder)</p>
                    </div>
                  </div>
                </div>

                {/* 3. Labeled Date Boxes (Periods & Due Date) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-xs font-semibold text-blue-700">Billing Period</span>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {bill.billingMonth}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                    <span className="text-xs font-semibold text-red-700">Due Date</span>
                    <p className="text-lg font-bold text-red-900 mt-1">
                      {new Date(bill.dueDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Total Amount Due Green Banner */}
              {/* Changed background to your custom green */}
              <div className="p-6 rounded-xl bg-[#689633] flex items-center justify-between text-white">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold">Total Amount Due</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-white/80">
                      Payment Deadline: {new Date(new Date(bill.dueDate).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <Badge status={bill.paymentStatus} />
                  </div>
                </div>
                <span className="text-4xl font-extrabold">
                  ₱{(bill.amount ?? 0).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-gray-400">
          No billing records found for this consumer.
        </div>
      )}
    </Modal>
  )
}