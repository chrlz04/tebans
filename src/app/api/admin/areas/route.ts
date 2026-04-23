import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { query, execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface AreaRow extends RowDataPacket {
  Area_ID: string
  Name: string
}

// ── GET /api/admin/areas ──────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const areas = await query<AreaRow>('SELECT Area_ID, Name FROM Area ORDER BY Name ASC')

    return ok(areas.map((a) => ({
      areaId: a.Area_ID,
      name: a.Name,
    })))
  } catch (errError) {
    logger.error('Get areas error:', errError)
    return handleApiError(errError)
  }
}

// ── POST /api/admin/areas ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { name } = await req.json()

    const reqError = validateRequired({ name }, ['name'])
    if (reqError) {
      return err(reqError, 400)
    }

    // Check if name already exists
    const existing = await queryOne(
      'SELECT Area_ID FROM Area WHERE Name = ?',
      [name]
    )
    if (existing) {
      return err('Area name already exists', 409)
    }

    const highestArea = await queryOne<{ Area_ID: string } & RowDataPacket>(
      `SELECT Area_ID FROM Area WHERE Area_ID LIKE 'area-%' ORDER BY LENGTH(Area_ID) DESC, Area_ID DESC LIMIT 1`
    )

    let nextSeq = 1
    if (highestArea && highestArea.Area_ID) {
      const match = highestArea.Area_ID.match(/^area-(\d+)$/)
      if (match && match[1]) {
        nextSeq = parseInt(match[1], 10) + 1
      }
    }

    const areaId = `area-${nextSeq.toString().padStart(3, '0')}`

    await execute(
      'INSERT INTO Area (Area_ID, Name) VALUES (?, ?)',
      [areaId, name]
    )

    return ok({ areaId }, 'Area created successfully')

  } catch (errError) {
    logger.error('Create area error:', errError)
    return handleApiError(errError)
  }
}
