import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne, query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getManilaDateParts } from '@/lib/date-utils'
import type { MeterReaderBillingProgress, UnbilledConsumer } from '@/types'

interface SummaryRow extends RowDataPacket {
  total: number
  count: number
}

interface UnbilledConsumerRow extends RowDataPacket {
  Consumer_ID: string
  First_Name: string
  Last_Name: string
  Address: string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    // Fetch the meter reader's assigned area
    const meterReader = await queryOne<{ Assigned_Area: string } & RowDataPacket>(
      `SELECT Assigned_Area_ID FROM MeterReader WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader profile not found', 404)
    }

    const assignedAreaId = meterReader.Assigned_Area_ID

    // 1. Total consumers in assigned area
    const totalConsumersRow = await queryOne<SummaryRow>(
      `SELECT COUNT(c.Consumer_ID) AS count
       FROM Consumer c
       WHERE c.Area_ID = ?`,
      [assignedAreaId]
    )

    // 2. Payment collections in assigned area
    const paymentCollectionsRow = await queryOne<SummaryRow>(
      `SELECT COALESCE(SUM(p.Amount_Paid), 0) AS total
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE c.Area_ID = ?`,
      [assignedAreaId]
    )

    // 3. Billing Cycle Progress (Current Month)
    const { year, month } = getManilaDateParts()
    const currentMonthDate = new Date(year, month, 1)
    const currentMonthStr = currentMonthDate.toLocaleString('en-PH', { month: 'long', year: 'numeric' })

    const totalActiveConsumersRow = await queryOne<SummaryRow>(
      `SELECT COUNT(c.Consumer_ID) AS count
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_ID = ? AND u.Account_Status = 'Active'`,
      [assignedAreaId]
    )
    const totalActiveConsumers = totalActiveConsumersRow?.count ?? 0

    const billedConsumersRow = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT b.Consumer_ID) AS count
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_ID = ?
         AND u.Account_Status = 'Active'
         AND b.Billing_Month = ?`,
      [assignedAreaId, currentMonthStr]
    )
    const billedConsumers = billedConsumersRow?.count ?? 0
    const unbilledConsumers = Math.max(0, totalActiveConsumers - billedConsumers)
    const completionRate = totalActiveConsumers > 0 ? Math.round((billedConsumers / totalActiveConsumers) * 100) : 0

    const unbilledConsumersList = await query<UnbilledConsumerRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE c.Area_ID = ?
         AND u.Account_Status = 'Active'
         AND NOT EXISTS (
           SELECT 1 FROM Bill b
           WHERE b.Consumer_ID = c.Consumer_ID
           AND b.Billing_Month = ?
         )
       ORDER BY u.Last_Name ASC`,
      [assignedAreaId, currentMonthStr]
    )

    const billingProgress: MeterReaderBillingProgress = {
      totalConsumers: totalActiveConsumers,
      billedConsumers,
      unbilledConsumers,
      completionRate,
      unbilledList: unbilledConsumersList.map((row) => ({
        consumerId: row.Consumer_ID,
        firstName: row.First_Name,
        lastName: row.Last_Name,
        address: row.Address,
      })),
    }

    return ok({
      totalConsumers:     totalConsumersRow?.count ?? 0,
      paymentCollections: paymentCollectionsRow?.total ?? 0,
      billingProgress,
    })

  } catch (errError) {
    logger.error('Meter Reader dashboard error:', errError)
    return handleApiError(errError)
  }
}
