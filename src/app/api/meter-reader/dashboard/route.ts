import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'

interface SummaryRow extends RowDataPacket {
  total: number
  count: number
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    // Fetch the meter reader's assigned area
    const meterReader = await queryOne<{ Assigned_Area: string } & RowDataPacket>(
      `SELECT Assigned_Area FROM MeterReader WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader profile not found', 404)
    }

    const assignedArea = meterReader.Assigned_Area

    // 1. Total consumers in assigned area
    const totalConsumersRow = await queryOne<SummaryRow>(
      `SELECT COUNT(c.Consumer_ID) AS count
       FROM Consumer c
       WHERE c.Area_Name = ?`,
      [assignedArea]
    )

    // 2. Payment collections in assigned area
    const paymentCollectionsRow = await queryOne<SummaryRow>(
      `SELECT COALESCE(SUM(p.Amount_Paid), 0) AS total
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE c.Area_Name = ?`,
      [assignedArea]
    )

    // 3. Inactive/Overdue Accounts
    // Active consumers in assigned area with no bill in the previous month
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

    const inactiveAccountsRow = await queryOne<SummaryRow>(
      `SELECT COUNT(c.Consumer_ID) AS count
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_Name = ?
         AND u.User_Type = 'consumer'
         AND u.Account_Status = 'Active'
         AND NOT EXISTS (
           SELECT 1 FROM Bill b
           WHERE b.Consumer_ID = c.Consumer_ID
           AND b.Billing_Month = ?
         )`,
      [assignedArea, prevMonthStr]
    )

    return ok({
      totalConsumers:     totalConsumersRow?.count ?? 0,
      paymentCollections: paymentCollectionsRow?.total ?? 0,
      inactiveAccounts:   inactiveAccountsRow?.count ?? 0,
    })

  } catch (errError) {
    logger.error('Meter Reader dashboard error:', errError)
    return handleApiError(errError)
  }
}
