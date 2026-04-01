import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface CurrentBillRow extends RowDataPacket {
  Bill_ID:        string
  Amount:         number
  Due_Date:       string
  Payment_Status: string
}

interface DisconnectionRow extends RowDataPacket {
  count: number
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['consumer'])
    if (error) return error

    // Get latest unpaid bill
    const currentBill = await queryOne<CurrentBillRow>(
      `SELECT
        Bill_ID,
        Amount,
        Due_Date,
        Payment_Status
       FROM Bill
       WHERE Consumer_ID = ?
         AND Payment_Status != 'Paid'
       ORDER BY Due_Date ASC
       LIMIT 1`,
      [payload!.userId]
    )

    // Check if consumer has a pending disconnection request
    const disconnection = await queryOne<DisconnectionRow>(
      `SELECT COUNT(*) as count
       FROM DisconnectionRequest
       WHERE Consumer_ID = ?
         AND Request_Status = 'Pending'`,
      [payload!.userId]
    )

    return ok({
      amountDue:        currentBill?.Amount ?? 0,
      dueDate:          currentBill?.Due_Date ?? null,
      nearDisconnection: (disconnection?.count ?? 0) > 0,
    })

  } catch (error) {
    console.error('Get current bill error:', error)
    return err('Internal server error', 500)
  }
}