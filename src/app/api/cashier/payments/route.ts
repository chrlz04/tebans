import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired, validatePaymentMethod } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { query, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { generateSequentialId } from '@/lib/services/billing.service'
import { generateReceiptNumber, recordPayment, updateBillStatus } from '@/lib/services/payment.service'

interface BillRow extends RowDataPacket {
  Bill_ID:        string
  Consumer_ID:    string
  Amount:         number
  Payment_Status: string
}

interface CashierRow extends RowDataPacket {
  Cashier_ID: string
}

export async function POST(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['cashier'])
    if (error) return error

    const { billIds, paymentMethod } = await req.json()

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return err('At least one bill must be selected', 400)
    }


    const reqError = validateRequired({ paymentMethod }, ['paymentMethod'])
    if (reqError) {
      return err(reqError, 400)
    }

    if (!validatePaymentMethod(paymentMethod)) {
      return err('Invalid payment method', 400)
    }

    // Get cashier ID
    const cashier = await queryOne<CashierRow>(
      'SELECT Cashier_ID FROM Cashier WHERE User_ID = ?',
      [payload!.userId]
    )

    if (!cashier) {
      return err('Cashier record not found', 404)
    }

    // Get all selected bills
    const placeholders = billIds.map(() => '?').join(',')
    const bills = await query<BillRow>(
      `SELECT Bill_ID, Consumer_ID, Amount, Payment_Status
       FROM Bill
       WHERE Bill_ID IN (${placeholders})
         AND Payment_Status != 'Paid'`,
      billIds
    )

    if (bills.length === 0) {
      return err('No valid unpaid bills found', 400)
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber()
    const paymentIds: string[] = []

    // Record payment for each bill
    for (const bill of bills) {
      const paymentId = await generateSequentialId('Payment', 'Payment_ID', 'pay')
      paymentIds.push(paymentId)

      await recordPayment({
        paymentId,
        billId:        bill.Bill_ID,
        cashierId:     cashier.Cashier_ID,
        consumerId:    bill.Consumer_ID,
        amountPaid:    bill.Amount,
        paymentMethod,
        receiptNumber,
      })

      // Update bill status
      await updateBillStatus(bill.Bill_ID, bill.Amount)
    }

    const totalAmount = bills.reduce((sum, b) => sum + b.Amount, 0)


    return ok({
      receiptNumber,
      paymentIds,
      totalBills: bills.length,
      totalAmount,
    }, 'Payment recorded successfully')

  } catch (error) {
    logger.error('Process payment error:', error)
    return handleApiError(error)
  }
}