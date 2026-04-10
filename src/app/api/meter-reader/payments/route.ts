import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface PaymentRow extends RowDataPacket {
  Payment_ID:     string
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Billing_Month:  string
  Amount:         number
  Amount_Paid:    number
  Payment_Status: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const startDate = req.nextUrl.searchParams.get('startDate') || ''
    const endDate   = req.nextUrl.searchParams.get('endDate')   || ''

    let sql = `
      SELECT
        p.Payment_ID,
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        b.Billing_Month,
        b.Amount,
        p.Amount_Paid,
        b.Payment_Status
       FROM Payment p
       JOIN Bill b     ON b.Bill_ID      = p.Bill_ID
       JOIN Consumer c ON c.Consumer_ID  = p.Consumer_ID
       JOIN User u     ON u.User_ID      = c.User_ID
       WHERE 1=1`

    const queryParams: any[] = []

    if (startDate) {
      sql += ` AND DATE(p.Date_Paid) >= ?`
      queryParams.push(startDate)
    }

    if (endDate) {
      sql += ` AND DATE(p.Date_Paid) <= ?`
      queryParams.push(endDate)
    }

    sql += ` ORDER BY p.Date_Paid DESC`

    const payments = await query<PaymentRow>(sql, queryParams)

    return ok(payments.map((p) => ({
      paymentId:     p.Payment_ID,
      consumerId:    p.Consumer_ID,
      consumerName:  `${p.First_Name} ${p.Last_Name}`,
      billingMonth:  p.Billing_Month,
      amountDue:     p.Amount,
      amountPaid:    p.Amount_Paid,
      paymentStatus: p.Payment_Status,
    })))

  } catch (error) {
    console.error('Get payment collection error:', error)
    return err('Internal server error', 500)
  }
}