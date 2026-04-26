import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface AdminDisconnectionRow extends RowDataPacket {
  DisconnectionRequest_ID:  string
  Consumer_ID:              string
  Consumer_First_Name:      string
  Consumer_Last_Name:       string
  Consumer_Address:         string
  Amount_Due:               number
  MeterReader_First_Name:   string
  MeterReader_Last_Name:    string
  Reason_for_Disconnection: string
  Scheduled_Date:           string
  Request_Status:           string
  Date_Requested:           string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    // Fetch all disconnection requests with consumer and meter reader details
    // We sum up unpaid bills for the consumer to get the Amount_Due
    const disconnections = await query<AdminDisconnectionRow>(
      `SELECT
        dr.DisconnectionRequest_ID,
        dr.Consumer_ID,
        cu.First_Name AS Consumer_First_Name,
        cu.Last_Name AS Consumer_Last_Name,
        c.Address AS Consumer_Address,
        (
          SELECT COALESCE(SUM(b.Amount), 0)
          FROM Bill b
          WHERE b.Consumer_ID = dr.Consumer_ID AND b.Payment_Status != 'Paid'
        ) AS Amount_Due,
        mu.First_Name AS MeterReader_First_Name,
        mu.Last_Name AS MeterReader_Last_Name,
        dr.Reason_for_Disconnection,
        dr.Scheduled_Date,
        dr.Request_Status,
        dr.Date_Requested
       FROM DisconnectionRequest dr
       LEFT JOIN Consumer c ON c.Consumer_ID = dr.Consumer_ID
       LEFT JOIN User cu ON cu.User_ID = c.User_ID
       LEFT JOIN MeterReader mr ON mr.MeterReader_ID = dr.MeterReader_ID
       LEFT JOIN User mu ON mu.User_ID = mr.User_ID
       ORDER BY dr.Date_Requested DESC`
    )

    return ok(disconnections.map((d) => ({
      disconnectionId:        d.DisconnectionRequest_ID,
      consumerId:             d.Consumer_ID,
      consumerFirstName:      d.Consumer_First_Name || 'Unknown',
      consumerLastName:       d.Consumer_Last_Name || 'Consumer',
      consumerAddress:        d.Consumer_Address || 'Unknown Address',
      amountDue:              d.Amount_Due || 0,
      meterReaderFirstName:   d.MeterReader_First_Name || 'Unknown',
      meterReaderLastName:    d.MeterReader_Last_Name || 'Meter Reader',
      reasonForDisconnection: d.Reason_for_Disconnection,
      scheduledDate:          d.Scheduled_Date,
      requestStatus:          d.Request_Status,
      dateRequested:          d.Date_Requested,
    })))

  } catch (errError) {
    console.error('Get admin disconnections error:', errError)
    return err('Internal server error', 500)
  }
}
