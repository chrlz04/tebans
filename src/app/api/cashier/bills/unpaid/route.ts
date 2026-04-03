import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface UnpaidBillRow extends RowDataPacket {
  Bill_ID:        string
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Amount:         number
  Due_Date:       string
  Payment_Status: string
  Billing_Month:  string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['cashier'])
    if (error) return error

    const search      = req.nextUrl.searchParams.get('search') || ''
    const searchParam = `%${search}%`

    const bills = await query<UnpaidBillRow>(
      `SELECT
        b.Bill_ID,
        b.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        b.Amount,
        b.Due_Date,
        b.Payment_Status,
        b.Billing_Month
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       JOIN User u ON u.User_ID = c.User_ID
       WHERE b.Payment_Status != 'Paid'
         AND (
           u.First_Name  LIKE ? OR
           u.Last_Name   LIKE ? OR
           b.Bill_ID     LIKE ?
         )
       ORDER BY b.Due_Date ASC`,
      [searchParam, searchParam, searchParam]
    )

    return ok(bills.map((b) => ({
      billId:        b.Bill_ID,
      consumerId:    b.Consumer_ID,
      consumerName:  `${b.First_Name} ${b.Last_Name}`,
      amount:        b.Amount,
      dueDate:       b.Due_Date,
      paymentStatus: b.Payment_Status,
      billingPeriod: b.Billing_Month,
    })))

  } catch (error) {
    console.error('Get unpaid bills error:', error)
    return err('Internal server error', 500)
  }
}