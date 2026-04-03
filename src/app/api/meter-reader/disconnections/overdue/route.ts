import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface OverdueRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Contact_No:     string
  Amount:         number
  Due_Date:       string
  Request_Status: string | null
  Scheduled_Date: string | null
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    const today = new Date().toISOString().split('T')[0]

    const overdueAccounts = await query<OverdueRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        SUM(b.Amount) AS Amount,
        MIN(b.Due_Date) AS Due_Date,
        dr.Request_Status,
        dr.Scheduled_Date
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       JOIN Bill b ON b.Consumer_ID = c.Consumer_ID
       LEFT JOIN DisconnectionRequest dr
         ON dr.Consumer_ID = c.Consumer_ID
         AND dr.Request_Status = 'Pending'
       WHERE
         b.Payment_Status != 'Paid'
         AND b.Due_Date < ?
       GROUP BY
         c.Consumer_ID,
         u.First_Name,
         u.Last_Name,
         u.Contact_No,
         dr.Request_Status,
         dr.Scheduled_Date
       ORDER BY Due_Date ASC`,
      [today]
    )

    return ok(overdueAccounts.map((o) => ({
      consumerId:     o.Consumer_ID,
      firstName:      o.First_Name,
      lastName:       o.Last_Name,
      contactNo:      o.Contact_No,
      amountDue:      o.Amount,
      scheduledDate:  o.Scheduled_Date ?? new Date(
        new Date().setDate(new Date().getDate() + 7)
      ).toISOString().split('T')[0],
      requestStatus:  o.Request_Status ?? 'Pending',
      monthsOverdue:  Math.ceil(
        (new Date().getTime() - new Date(o.Due_Date).getTime())
        / (1000 * 60 * 60 * 24 * 30)
      ),
    })))

  } catch (error) {
    console.error('Get overdue accounts error:', error)
    return err('Internal server error', 500)
  }
}