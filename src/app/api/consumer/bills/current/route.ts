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
        b.Bill_ID,
        b.Amount,
        b.Due_Date,
        b.Payment_Status
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       WHERE c.User_ID = ?
         AND b.Payment_Status != 'Paid'
       ORDER BY b.Due_Date ASC
       LIMIT 1`,
      [payload!.userId]
    )

    // Check if consumer has a pending disconnection request
    const disconnection = await queryOne<DisconnectionRow>(
      `SELECT COUNT(*) as count
       FROM DisconnectionRequest dr
       JOIN Consumer c ON c.Consumer_ID = dr.Consumer_ID
       WHERE c.User_ID = ?
         AND dr.Request_Status = 'Pending'`,
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