import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne, query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface BillingCycleRow extends RowDataPacket {
  Billing_Month: string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const meterReader = await queryOne<{ Assigned_Area_ID: string } & RowDataPacket>(
      `SELECT Assigned_Area_ID FROM MeterReader WHERE User_ID = ?`,
      [payload!.userId]
    )

    if (!meterReader) {
      return err('Meter reader profile not found', 404)
    }

    const rows = await query<BillingCycleRow>(
      `SELECT b.Billing_Month
       FROM Bill b
       JOIN Consumer c ON c.Consumer_ID = b.Consumer_ID
       WHERE c.Area_ID = ?
       GROUP BY b.Billing_Month
       ORDER BY MIN(b.Due_Date) DESC`,
      [meterReader.Assigned_Area_ID]
    )

    return ok({ cycles: rows.map(r => r.Billing_Month) })

  } catch (error) {
    logger.error('Meter Reader get SMS cycles error:', error)
    return handleApiError(error)
  }
}
