import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query, execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { v4 as uuidv4 } from 'uuid'

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

    if (!['Cash', 'Check', 'Online'].includes(paymentMethod)) {
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
    const receiptNumber = `RCP-${Date.now()}`
    const paymentIds: string[] = []

    // Record payment for each bill
    for (const bill of bills) {
      const paymentId = uuidv4()
      paymentIds.push(paymentId)

      await execute(
        `INSERT INTO Payment (
          Payment_ID,
          Bill_ID,
          Cashier_ID,
          Consumer_ID,
          Amount_Paid,
          Payment_Method,
          Receipt_Number
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId,
          bill.Bill_ID,
          cashier.Cashier_ID,
          bill.Consumer_ID,
          bill.Amount,
          paymentMethod,
          receiptNumber,
        ]
      )

      // Update bill status to Paid
      await execute(
        `UPDATE Bill
         SET Payment_Status = 'Paid'
         WHERE Bill_ID = ?`,
        [bill.Bill_ID]
      )
    }

    return ok({
      receiptNumber,
      paymentIds,
      totalBills: bills.length,
      totalAmount: bills.reduce((sum, b) => sum + b.Amount, 0),
    }, 'Payment recorded successfully')

  } catch (error) {
    console.error('Process payment error:', error)
    return err('Internal server error', 500)
  }
}