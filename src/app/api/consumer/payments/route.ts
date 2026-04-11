import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface PaymentRow extends RowDataPacket {
  Payment_ID:     string
  Bill_ID:        string
  Amount_Paid:    number
  Date_Paid:      string
  Payment_Method: string
  Receipt_Number: string
  Billing_Month:  string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['consumer'])
    if (error) return error

    const search = req.nextUrl.searchParams.get('search') || ''
    const year   = req.nextUrl.searchParams.get('year')   || ''

    let sql = `
      SELECT
        p.Payment_ID,
        p.Bill_ID,
        p.Amount_Paid,
        p.Date_Paid,
        p.Payment_Method,
        p.Receipt_Number,
        b.Billing_Month
       FROM Payment p
       JOIN Bill b ON b.Bill_ID = p.Bill_ID
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE c.User_ID = ?`

    const queryParams: any[] = [payload!.userId]

    if (search) {
      sql += ` AND p.Receipt_Number LIKE ?`
      queryParams.push(`%${search}%`)
    }

    if (year) {
      sql += ` AND YEAR(p.Date_Paid) = ?`
      queryParams.push(year)
    }

    sql += ` ORDER BY p.Date_Paid DESC`

    const payments = await query<PaymentRow>(sql, queryParams)

    return ok(payments.map((p) => ({
      paymentId:     p.Payment_ID,
      billId:        p.Bill_ID,
      amountPaid:    p.Amount_Paid,
      datePaid:      p.Date_Paid,
      paymentMethod: p.Payment_Method,
      receiptNumber: p.Receipt_Number,
      billingMonth:  p.Billing_Month,
    })))

  } catch (error) {
    logger.error('Get consumer payments error:', error)
    return handleApiError(error)
  }
}