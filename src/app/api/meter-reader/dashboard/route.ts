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

interface OverdueRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Contact_No:     string
  Address:        string
  Amount:         number
  Due_Date:       string
  Request_Status: string | null
  Scheduled_Date: string | null
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

    // Calculate current billing cycle dates (28th of previous month to 27th of current month)
    const { year, month, day } = getManilaDateParts()
    const startDateObj = new Date(year, day > 27 ? month : month - 1, 28)
    const endDateObj = new Date(year, day > 27 ? month + 1 : month, 27)

    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-28`
    const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-27`

    // 1. Payment collections in assigned area for current billing cycle
    const paymentCollectionsRow = await queryOne<SummaryRow>(
      `SELECT COALESCE(SUM(p.Amount_Paid), 0) AS total
       FROM Payment p
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE c.Area_ID = ?
         AND DATE(p.Date_Paid) >= ?
         AND DATE(p.Date_Paid) <= ?`,
      [assignedAreaId, startDate, endDate]
    )

    // 2. Consumers Paid Percentage
    const currentMonthDate = new Date(year, month, 1)
    const currentMonthStr = currentMonthDate.toLocaleString('en-PH', { month: 'long', year: 'numeric' })

    const paidConsumersRow = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT p.Consumer_ID) AS count
       FROM Payment p
       JOIN Bill b ON b.Bill_ID = p.Bill_ID
       JOIN Consumer c ON c.Consumer_ID = p.Consumer_ID
       WHERE c.Area_ID = ?
         AND DATE(p.Date_Paid) >= ?
         AND DATE(p.Date_Paid) <= ?
         AND b.Billing_Month = ?`,
      [assignedAreaId, startDate, endDate, currentMonthStr]
    )
    const paidConsumersCount = paidConsumersRow?.count ?? 0

    const billedConsumersForCurrentMonthRow = await queryOne<SummaryRow>(
      `SELECT COUNT(DISTINCT b.Consumer_ID) AS count
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       WHERE c.Area_ID = ?
         AND b.Billing_Month = ?`,
      [assignedAreaId, currentMonthStr]
    )
    const billedConsumersForCurrentMonthCount = billedConsumersForCurrentMonthRow?.count ?? 0

    const consumersPaidPercentage = billedConsumersForCurrentMonthCount > 0
      ? Math.round((paidConsumersCount / billedConsumersForCurrentMonthCount) * 100)
      : 0

    // 3. Billing Cycle Progress (Current Month)
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

    // 4. Overdue Accounts in assigned area
    const today = new Date().toISOString().split('T')[0]

    const overdueAccountsResult = await query<OverdueRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        c.Address,
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
         c.Area_ID = ?
         AND b.Payment_Status != 'Paid'
         AND b.Due_Date < ?
       GROUP BY
         c.Consumer_ID,
         u.First_Name,
         u.Last_Name,
         u.Contact_No,
         c.Address,
         dr.Request_Status,
         dr.Scheduled_Date
       ORDER BY Due_Date ASC`,
      [assignedAreaId, today]
    )

    const overdueAccounts = overdueAccountsResult.map((o) => ({
      consumerId:     o.Consumer_ID,
      firstName:      o.First_Name,
      lastName:       o.Last_Name,
      contactNo:      o.Contact_No,
      address:        o.Address,
      amountDue:      o.Amount,
      scheduledDate:  o.Scheduled_Date ?? new Date(
        new Date().setDate(new Date().getDate() + 7)
      ).toISOString().split('T')[0],
      requestStatus:  o.Request_Status ?? 'Pending',
      monthsOverdue:  Math.ceil(
        (new Date().getTime() - new Date(o.Due_Date).getTime())
        / (1000 * 60 * 60 * 24 * 30)
      ),
    }))

    return ok({
      consumersPaidPercentage,
      paymentCollections: paymentCollectionsRow?.total ?? 0,
      billingProgress,
      overdueAccounts,
    })

  } catch (errError) {
    logger.error('Meter Reader dashboard error:', errError)
    return handleApiError(errError)
  }
}
