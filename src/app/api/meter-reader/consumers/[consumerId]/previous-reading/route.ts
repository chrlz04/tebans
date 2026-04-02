import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface LastReadingRow extends RowDataPacket {
  Current_Reading: number
}

// ── GET /api/meter-reader/consumers/[consumerId]/previous-reading ──────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ consumerId: string }> }
) {
  try {
    const { error } = requireRole(req, ['meter_reader'])
    if (error) return error

    // Await params per Next.js 15 route handler pattern
    const { consumerId } = await context.params

    const lastReading = await queryOne<LastReadingRow>(
      `SELECT Current_Reading
       FROM MeterReading
       WHERE Consumer_ID = ?
       ORDER BY Date_Recorded DESC, MeterReading_ID DESC
       LIMIT 1`,
      [consumerId]
    )

    const previousReading = lastReading?.Current_Reading ?? 0

    return ok({ previousReading }, 'Previous reading retrieved successfully')

  } catch (error) {
    console.error('Get previous reading error:', error)
    return err('Internal server error', 500)
  }
}
