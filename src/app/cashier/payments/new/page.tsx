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
    receiptNumbers: string[]
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
        receiptNumbers: data.receiptNumbers,
        totalAmount: selectedBills?.reduce((sum, b) => sum + Number(b.amount ?? 0), 0) ?? 0,
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
    (sum, b) => sum + Number(b.amount ?? 0),
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
          <h2 className="text-xl font-semibold text-foreground">
            Payment Recorded Successfully
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            The payment has been recorded and the billing status has been updated.
          </p>
        </div>

        {/* Receipt Summary */}
        <div className="bg-card rounded-xl border border-border p-6 w-full text-left">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Receipt Summary
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {receiptData.receiptNumbers.length === 1 ? 'Receipt No.' : 'Receipt Nos.'}
              </span>
              <span className="font-mono font-medium text-foreground text-right">
                {receiptData.receiptNumbers.join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Consumers</span>
              <span className="text-foreground text-right">
                {receiptData.consumerNames.join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="text-foreground">{paymentMethod}</span>
            </div>
            <div className="border-t border-border/50 pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Total Amount</span>
              <span className="font-bold text-lg text-primary-600">
                ₱{receiptData.totalAmount.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setIsSuccess(false)}
          >
            Process Another Payment
          </Button>
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => window.print()}
          >
            Print Receipt
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 relative">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Process Payment
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select consumer bills to record a payment transaction
        </p>
      </div>

      <div className="flex flex-col gap-6 flex-1 pb-48">

        {/* Bills List */}
        <div className="flex flex-col gap-4">

          {/* Search */}
          <div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search Bill or Name..."
            />
          </div>

          {/* Select All */}
          {unpaidBills && unpaidBills.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-1 transition-colors w-fit"
            >
              {selectedBillIds.length === unpaidBills.length ? (
                <div className="w-5 h-5 rounded border bg-primary-500 border-primary-500 flex items-center justify-center">
                  <CheckSquare size={14} className="text-white" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded border border-gray-300" />
              )}
              Select All ({unpaidBills.length})
            </button>
          )}

          {/* Bills */}
          {isLoading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl" />
              ))}
            </div>
          ) : unpaidBills && unpaidBills.length > 0 ? (
            <div className="flex flex-col gap-4">
              {unpaidBills.map((bill) => {
                const isSelected = selectedBillIds.includes(bill.billId)
                return (
                  <button
                    key={bill.billId}
                    type="button"
                    onClick={() => toggleBill(bill.billId)}
                    className={`w-full flex items-start gap-4 p-5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-primary-500 shadow-sm'
                        : 'border-border hover:border-gray-300'
                    }`}
                  >
                    <div className="pt-1 shrink-0">
                      {isSelected ? (
                         <div className="w-5 h-5 rounded border bg-primary-500 border-primary-500 flex items-center justify-center">
                          <CheckSquare size={14} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-gray-300" />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Consumer Name</p>
                        <p className="text-base font-semibold text-foreground">
                          {bill.consumerName}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Billing Period</p>
                        <p className="text-sm text-foreground">
                          {bill.billingPeriod}
                        </p>
                      </div>

                      <div className="border-t border-border/50 pt-3 mt-1">
                         <p className="text-xs text-muted-foreground mb-0.5">Total Amount Due</p>
                         <p className="text-xl font-bold text-foreground">
                          ₱{Number(bill.amount ?? 0).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No unpaid bills found.
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-width)] px-4 sm:px-6 py-4 sm:py-6 bg-card border-t border-border z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">

            <div className="flex flex-col">
               <p className="text-sm text-muted-foreground">Total Selected Amount</p>
               <p className="text-3xl font-bold text-foreground">
                  ₱{totalSelected.toLocaleString('en-PH', {
                    minimumFractionDigits: 2,
                  })}
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                 {selectedBillIds.length} invoices selected
               </p>
            </div>

            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                Failed to record payment. Please try again.
              </div>
            )}

            <Button
              variant="primary"
              className="w-full py-3 text-lg font-medium"
              disabled={selectedBillIds.length === 0}
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Record Payment Transaction
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}