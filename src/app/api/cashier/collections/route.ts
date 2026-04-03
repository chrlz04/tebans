import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface CollectionRow extends RowDataPacket {
  Payment_ID:     string
  First_Name:     string
  Last_Name:      string
  Amount_Paid:    number
  Date_Paid:      string
  Payment_Method: string
  Receipt_Number: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['cashier'])
    if (error) return error

    const startDate = req.nextUrl.searchParams.get('startDate') || ''
    const endDate   = req.nextUrl.searchParams.get('endDate')   || ''

    let sql = `
      SELECT
        p.Payment_ID,
        u.First_Name,
        u.Last_Name,
        p.Amount_Paid,
        p.Date_Paid,
        p.Payment_Method,
        p.Receipt_Number
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       JOIN User u ON u.User_ID = c.User_ID
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

    const collections = await query<CollectionRow>(sql, queryParams)

    return ok(collections.map((c) => ({
      paymentId:     c.Payment_ID,
      consumerName:  `${c.First_Name} ${c.Last_Name}`,
      amountPaid:    c.Amount_Paid,
      datePaid:      c.Date_Paid,
      paymentMethod: c.Payment_Method,
      receiptNumber: c.Receipt_Number,
    })))

  } catch (error) {
    console.error('Get collections error:', error)
    return err('Internal server error', 500)
  }
}