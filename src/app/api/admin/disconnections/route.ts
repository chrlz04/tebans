import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface AdminDisconnectionRow extends RowDataPacket {
  DisconnectionRequest_ID:  string
  Consumer_ID:              string
  Consumer_Name:            string
  Consumer_Address:         string
  Amount_Due:               number
  MeterReader_ID:           string | null
  MeterReader_Name:         string
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
          COALESCE(CONCAT(cu.First_Name, ' ', cu.Last_Name), 'Unknown Consumer') AS Consumer_Name,
          c.Address AS Consumer_Address,
          (
            SELECT COALESCE(SUM(b.Amount), 0)
            FROM Bill b
            WHERE b.Consumer_ID = c.Consumer_ID AND b.Payment_Status != 'Paid'
          ) AS Amount_Due,
          dr.MeterReader_ID,
          COALESCE(CONCAT(mu.First_Name, ' ', mu.Last_Name), 'Unknown Meter Reader') AS MeterReader_Name,
          dr.Reason_for_Disconnection,
          dr.Scheduled_Date,
          dr.Request_Status,
          dr.Date_Requested
      FROM DisconnectionRequest dr
      JOIN Consumer c          ON c.Consumer_ID       = dr.Consumer_ID
      JOIN \`User\` cu           ON cu.User_ID          = c.User_ID
      LEFT JOIN MeterReader mr ON mr.MeterReader_ID   = dr.MeterReader_ID
      LEFT JOIN \`User\` mu      ON mu.User_ID          = mr.User_ID
      ORDER BY dr.Date_Requested DESC;`
    )

    return ok(disconnections.map((d) => ({
      disconnectionId:        d.DisconnectionRequest_ID,
      consumerId:             d.Consumer_ID,
      consumerName:           d.Consumer_Name,
      consumerAddress:        d.Consumer_Address,
      amountDue:              d.Amount_Due,
      meterReaderName:        d.MeterReader_Name,
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
