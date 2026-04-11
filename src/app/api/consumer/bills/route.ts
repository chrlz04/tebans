import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { query, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BillRow extends RowDataPacket {
  Bill_ID:        string
  Amount:         number
  Due_Date:       string
  Payment_Status: string
  Billing_Month:  string
  MeterReading_ID: string
}

interface CurrentBillRow extends RowDataPacket {
  Bill_ID:        string
  Amount:         number
  Due_Date:       string
  Payment_Status: string
}

// ── GET /api/consumer/bills ───────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['consumer'])
    if (error) return error

    const bills = await query<BillRow>(
      `SELECT
        b.Bill_ID,
        b.Amount,
        b.Due_Date,
        b.Payment_Status,
        b.Billing_Month,
        b.MeterReading_ID
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       WHERE c.User_ID = ?
       ORDER BY b.Due_Date DESC`,
      [payload!.userId]
    )

    return ok(bills.map((b) => ({
      billId:         b.Bill_ID,
      amount:         b.Amount,
      dueDate:        b.Due_Date,
      paymentStatus:  b.Payment_Status,
      billingMonth:   b.Billing_Month,
      meterReadingId: b.MeterReading_ID,
    })))

  } catch (error) {
    logger.error('Get consumer bills error:', error)
    return handleApiError(error)
  }
}