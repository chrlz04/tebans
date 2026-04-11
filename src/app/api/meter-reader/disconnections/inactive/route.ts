import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'

interface InactiveRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Contact_No:     string
  Address:        string
  Request_Status: string | null
  Scheduled_Date: string | null
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    // Determine previous calendar month
    const { year, month } = getManilaDateParts()
    let prevMonth = month - 1
    let prevYear = year
    if (prevMonth < 0) {
      prevMonth = 11
      prevYear--
    }

    // Format is "Month Year", e.g., "October 2023"
    const date = new Date(prevYear, prevMonth, 1)
    const prevMonthStr = date.toLocaleString('en-PH', { month: 'long', year: 'numeric' })

    const inactiveAccounts = await query<InactiveRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        c.Address,
        dr.Request_Status,
        dr.Scheduled_Date
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       LEFT JOIN DisconnectionRequest dr
         ON dr.Consumer_ID = c.Consumer_ID
         AND dr.Request_Status = 'Pending'
       WHERE
         u.User_Type = 'consumer'
         AND u.Account_Status = 'Active'
         AND NOT EXISTS (
           SELECT 1 FROM Bill b
           WHERE b.Consumer_ID = c.Consumer_ID
           AND b.Billing_Month = ?
         )
       GROUP BY
         c.Consumer_ID,
         u.First_Name,
         u.Last_Name,
         u.Contact_No,
         c.Address,
         dr.Request_Status,
         dr.Scheduled_Date
       ORDER BY u.Last_Name ASC`,
      [prevMonthStr]
    )

    return ok(inactiveAccounts.map((o) => ({
      consumerId:     o.Consumer_ID,
      firstName:      o.First_Name,
      lastName:       o.Last_Name,
      contactNo:      o.Contact_No,
      address:        o.Address,
      amountDue:      0,
      scheduledDate:  o.Scheduled_Date ?? new Date(
        new Date().setDate(new Date().getDate() + 7)
      ).toISOString().split('T')[0],
      requestStatus:  o.Request_Status ?? 'Pending',
      monthsOverdue:  1,
      isInactive:     true, // Flag to identify inactive vs overdue
    })))

  } catch (error) {
    console.error('Get inactive accounts error:', error)
    return err('Internal server error', 500)
  }
}
