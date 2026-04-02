import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BillRow extends RowDataPacket {
  Bill_ID:        string
  Amount:         number
  Due_Date:       string
  Payment_Status: string
  Billing_Month:  string
}

// ── GET /api/meter-reader/consumers/[consumerId]/bill ─────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ consumerId: string }> }
) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const { consumerId } = await params

    const bills = await query<BillRow>(
      `SELECT
        Bill_ID,
        Amount,
        Due_Date,
        Payment_Status,
        Billing_Month
       FROM Bill
       WHERE Consumer_ID = ?
       ORDER BY Due_Date DESC`,
      [consumerId]
    )

    return ok(bills.map((b) => ({
      billId:        b.Bill_ID,
      amount:        b.Amount,
      dueDate:       b.Due_Date,
      paymentStatus: b.Payment_Status,
      billingMonth:  b.Billing_Month,
    })))

  } catch (error) {
    console.error('Get consumer bill error:', error)
    return err('Internal server error', 500)
  }
}