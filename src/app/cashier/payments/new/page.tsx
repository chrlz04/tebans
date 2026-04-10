'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Square, CreditCard } from 'lucide-react'
import api from '@/lib/api'
import { useRoleGuard } from '@/lib/use-role-guard'
import SearchBar from '@/components/shared/SearchBar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Bill } from '@/types'

interface UnpaidBill extends Bill {
  consumerName: string
  billingPeriod: string
}

export default function ProcessPaymentPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard('cashier')
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'Cash'>('Cash')
  const [isSuccess, setIsSuccess] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    receiptNumber: string
    totalAmount: number
    consumerNames: string[]
  } | null>(null)

  const { data: unpaidBills, isLoading } = useQuery<UnpaidBill[]>({
    queryKey: ['cashier-unpaid-bills', search],
    queryFn: async () => {
      const res = await api.get('/cashier/bills/unpaid', {
        params: { search },
      })
      return res.data
    },
    enabled: hasAccess,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/cashier/payments', {
        billIds: selectedBillIds,
        paymentMethod,
      })
      return res.data
    },
    onSuccess: (data) => {
      const selectedBills = unpaidBills?.filter((b) =>
        selectedBillIds.includes(b.billId)
      )
      setReceiptData({
        receiptNumber: data.receiptNumber,
        totalAmount: selectedBills?.reduce((sum, b) => sum + (b.amount ?? 0), 0) ?? 0,
        consumerNames: selectedBills?.map((b) => b.consumerName) ?? [],
      })
      setIsSuccess(true)
      setSelectedBillIds([])
      queryClient.invalidateQueries({ queryKey: ['cashier-unpaid-bills'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-dashboard'] })
    },
  })

  const toggleBill = (billId: string) => {
    setSelectedBillIds((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId]
    )
  }

  const toggleAll = () => {
    if (!unpaidBills) return
    if (selectedBillIds.length === unpaidBills.length) {
      setSelectedBillIds([])
    } else {
      setSelectedBillIds(unpaidBills.map((b) => b.billId))
    }
  }

  const selectedBills = unpaidBills?.filter((b) =>
    selectedBillIds.includes(b.billId)
  )

  const totalSelected = selectedBills?.reduce(
    (sum, b) => sum + (b.amount ?? 0),
    0
  ) ?? 0

  if (authLoading) return null
  if (!hasAccess) return null

  if (isSuccess && receiptData) {
    return (
      <div className="max-w-lg mx-auto mt-12 flex flex-col items-center gap-6 text-center">
        <div className="bg-primary-50 p-5 rounded-full">
          <CreditCard size={48} className="text-primary-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Payment Recorded Successfully
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            The payment has been recorded and the billing status has been updated.
          </p>
        </div>

        {/* Receipt Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 w-full text-left">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Receipt Summary
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Receipt No.</span>
              <span className="font-mono font-medium text-gray-900">
                {receiptData.receiptNumber}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Consumers</span>
              <span className="text-gray-900 text-right">
                {receiptData.consumerNames.join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="text-gray-900">{paymentMethod}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="font-bold text-lg text-primary-600">
                ₱{receiptData.totalAmount.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsSuccess(false)}
          >
            Process Another Payment
          </Button>
          <Button
            variant="primary"
            onClick={() => window.print()}
          >
            Print Receipt
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Process Payment
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select consumer bills to record a payment transaction
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bills List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">

          {/* Search */}
          <div className="mb-4">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by bill number or consumer name..."
            />
          </div>

          {/* Select All */}
          {unpaidBills && unpaidBills.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
            >
              {selectedBillIds.length === unpaidBills.length ? (
                <CheckSquare size={16} className="text-primary-500" />
              ) : (
                <Square size={16} />
              )}
              Select All ({unpaidBills.length})
            </button>
          )}

          {/* Bills */}
          {isLoading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : unpaidBills && unpaidBills.length > 0 ? (
            <div className="flex flex-col gap-2">
              {unpaidBills.map((bill) => {
                const isSelected = selectedBillIds.includes(bill.billId)
                return (
                  <button
                    key={bill.billId}
                    type="button"
                    onClick={() => toggleBill(bill.billId)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="text-primary-500 shrink-0" />
                    ) : (
                      <Square size={18} className="text-gray-400 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {bill.consumerName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {bill.billingPeriod}
                      </p>
                      <p className="text-xs font-mono text-gray-400">
                        {bill.billId}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-gray-900">
                        ₱{(bill.amount ?? 0).toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <Badge status={bill.paymentStatus} />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">
              No unpaid bills found.
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit sticky top-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Payment Summary
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Selected Invoices</span>
              <span className="font-medium text-gray-900">
                {selectedBillIds.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-bold text-gray-900">
                ₱{totalSelected.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as 'Cash')
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Cash">Cash</option>
              </select>
            </div>

            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                Failed to record payment. Please try again.
              </div>
            )}

            <Button
              variant="primary"
              className="w-full mt-2"
              disabled={selectedBillIds.length === 0}
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Record Payment Transaction
            </Button>

            {selectedBillIds.length === 0 && (
              <p className="text-xs text-gray-400 text-center">
                Select at least one bill to proceed
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}