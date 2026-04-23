import { NextRequest } from 'next/server'
import { ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface AreaRow extends RowDataPacket {
  Area_ID: string
  Name: string
}

// ── GET /api/areas ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const areas = await query<AreaRow>('SELECT Area_ID, Name FROM Area ORDER BY Name ASC')

    return ok(areas.map((a) => ({
      areaId: a.Area_ID,
      name: a.Name,
    })))
  } catch (error) {
    logger.error('Get areas error:', error)
    return handleApiError(error)
  }
}
