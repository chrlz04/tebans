import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ areaId: string }> }
) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { areaId } = await params

    const consumerDepRow = await queryOne<{ count: number } & RowDataPacket>(
      `SELECT COUNT(*) AS count FROM Consumer WHERE Area_ID = ?`,
      [areaId]
    )

    const mrDepRow = await queryOne<{ count: number } & RowDataPacket>(
      `SELECT COUNT(*) AS count FROM MeterReader WHERE Assigned_Area_ID = ?`,
      [areaId]
    )

    const cashierDepRow = await queryOne<{ count: number } & RowDataPacket>(
      `SELECT COUNT(*) AS count FROM Cashier WHERE Assigned_Area_ID = ?`,
      [areaId]
    )

    const consumerCount = consumerDepRow?.count ?? 0
    const staffCount = (mrDepRow?.count ?? 0) + (cashierDepRow?.count ?? 0)

    return ok({ consumerCount, staffCount })

  } catch (errError) {
    logger.error('Get area dependencies error:', errError)
    return handleApiError(errError)
  }
}
