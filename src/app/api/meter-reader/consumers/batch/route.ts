import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BatchConsumerRow extends RowDataPacket {
  Consumer_ID:     string
  First_Name:      string
  Last_Name:       string
  Meter_Serial_No: string
  Previous_Reading: number
  Latest_Billing_Month: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    // Get all active consumers ordered by ID
    // Join with MeterReading to get their latest reading details
    const consumers = await query<BatchConsumerRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Meter_Serial_No,
        (SELECT Current_Reading FROM MeterReading mr WHERE mr.Consumer_ID = c.Consumer_ID ORDER BY Date_Recorded DESC LIMIT 1) as Previous_Reading,
        (SELECT Billing_Month FROM MeterReading mr WHERE mr.Consumer_ID = c.Consumer_ID ORDER BY Date_Recorded DESC LIMIT 1) as Latest_Billing_Month
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       WHERE u.Account_Status = 'Active'
       ORDER BY LENGTH(c.Consumer_ID) ASC, c.Consumer_ID ASC`
    )

    return ok(consumers.map((c) => ({
      consumerId: c.Consumer_ID,
      firstName: c.First_Name,
      lastName: c.Last_Name,
      meterSerialNo: c.Meter_Serial_No,
      previousReading: Number(c.Previous_Reading || 0),
      latestBillingMonth: c.Latest_Billing_Month || null,
    })))

  } catch (error) {
    console.error('Get batch consumers error:', error)
    return err('Internal server error', 500)
  }
}
