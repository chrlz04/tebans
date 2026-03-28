'use client'

import { useQuery } from '@tanstack/react-query'
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
      title={`Bills — ${consumerName}`}
      size="lg"
    >
      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : bills && bills.length > 0 ? (
        <div className="flex flex-col gap-3">
          {bills.map((bill) => (
            <div
              key={bill.billId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-900">
                  {bill.billingMonth}
                </span>
                <span className="text-xs text-gray-500">
                  Due:{' '}
                  {new Date(bill.dueDate).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="font-mono text-xs text-gray-400">
                  {bill.billId}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-lg font-bold text-gray-900">
                  ₱{(bill.amount ?? 0).toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <Badge status={bill.paymentStatus} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-gray-400">
          No billing records found for this consumer.
        </div>
      )}
    </Modal>
  )
}