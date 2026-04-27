import { NextRequest } from 'next/server'
import { requireRole, ok } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BillHistoryRow extends RowDataPacket {
  Bill_ID:         string
  Amount:          number
  Due_Date:        string
  Payment_Status:  string
  Billing_Month:   string
  Previous_Reading: number
  Current_Reading:  number
  Date_Recorded:   string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['consumer'])
    if (error) return error

    const history = await query<BillHistoryRow>(
    `SELECT
      b.Bill_ID,
      b.Amount,
      b.Due_Date,
      b.Payment_Status,
      b.Billing_Month,
      mr.Previous_Reading,
      mr.Current_Reading,
      mr.Date_Recorded
      FROM Bill b
      JOIN MeterReading mr ON mr.MeterReading_ID = b.MeterReading_ID
      JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
      WHERE c.User_ID = ?
      ORDER BY b.Due_Date DESC`,
      [payload!.userId]
    )

    return ok(history.map((b) => ({
      billId:          b.Bill_ID,
      amount:          b.Amount,
      dueDate:         b.Due_Date,
      paymentStatus:   b.Payment_Status,
      billingMonth:    b.Billing_Month,
      previousReading: b.Previous_Reading,
      currentReading:  b.Current_Reading,
      dateRecorded:    b.Date_Recorded,
    })))

  } catch (error) {
    logger.error('Get billing history error:', error)
    return handleApiError(error)
  }
}