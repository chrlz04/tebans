import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne, query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { getBillingCycleSettings } from '@/lib/services/settings.service'
import { getManilaDateParts } from '@/lib/date-utils'

interface ConsumerSmsRow extends RowDataPacket {
  Consumer_ID: string
  Name: string
  Contact_No: string
  Amount: number
  Due_Date: string
  MeterReading_ID: string
  Previous_Reading: number
  Current_Reading: number
  Notification_ID: string | null
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    // Fetch the meter reader's assigned area
    const meterReader = await queryOne<{ Assigned_Area_ID: string } & RowDataPacket>(
      `SELECT Assigned_Area_ID FROM MeterReader WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader profile not found', 404)
    }

    const assignedAreaId = meterReader.Assigned_Area_ID

    // Determine the current billing cycle month string
    const { year, month } = getManilaDateParts()
    const currentMonthDate = new Date(year, month, 1)
    const currentMonthStr = currentMonthDate.toLocaleString('en-PH', { month: 'long', year: 'numeric' })

    const consumersResult = await query<ConsumerSmsRow>(
      `SELECT
        c.Consumer_ID,
        CONCAT(u.First_Name, ' ', u.Last_Name) AS Name,
        u.Contact_No,
        b.Amount,
        b.Due_Date,
        b.MeterReading_ID,
        mr.Previous_Reading,
        mr.Current_Reading,
        n.Notification_ID
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       JOIN User u ON u.User_ID = c.User_ID
       JOIN MeterReading mr ON mr.MeterReading_ID = b.MeterReading_ID
       LEFT JOIN Notification n ON n.MeterReading_ID = b.MeterReading_ID AND n.Alert_Type = 'Billing'
       WHERE c.Area_ID = ? AND b.Billing_Month = ? AND u.Account_Status = 'Active'
       ORDER BY u.First_Name ASC`,
      [assignedAreaId, currentMonthStr]
    )

    const consumers = consumersResult.map(row => ({
      consumerId: row.Consumer_ID,
      consumerName: row.Name,
      contactNo: row.Contact_No,
      amount: Number(row.Amount),
      dueDate: row.Due_Date,
      billingMonth: currentMonthStr,
      meterReadingId: row.MeterReading_ID,
      previousReading: Number(row.Previous_Reading),
      currentReading: Number(row.Current_Reading),
      smsStatus: row.Notification_ID ? 'Sent' : 'Unsent'
    }))

    return ok({
      billingMonth: currentMonthStr,
      consumers
    })

  } catch (errError) {
    logger.error('Meter Reader get SMS list error:', errError)
    return handleApiError(errError)
  }
}
