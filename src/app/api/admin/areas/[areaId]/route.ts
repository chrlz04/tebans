import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

// ── PUT /api/admin/areas/[areaId] ─────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ areaId: string }> }
) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { areaId } = await params
    const { name } = await req.json()

    const reqError = validateRequired({ name }, ['name'])
    if (reqError) {
      return err(reqError, 400)
    }

    // Check if new name already exists
    const existing = await queryOne(
      'SELECT Area_ID FROM Area WHERE Name = ? AND Area_ID != ?',
      [name, areaId]
    )
    if (existing) {
      return err('Area name already exists', 409)
    }

    await execute(
      'UPDATE Area SET Name = ? WHERE Area_ID = ?',
      [name, areaId]
    )

    return ok(null, 'Area renamed successfully')

  } catch (errError) {
    logger.error('Rename area error:', errError)
    return handleApiError(errError)
  }
}

// ── DELETE /api/admin/areas/[areaId] ──────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ areaId: string }> }
) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { areaId } = await params

    await execute(
      'DELETE FROM Area WHERE Area_ID = ?',
      [areaId]
    )

    return ok(null, 'Area deleted successfully')

  } catch (errError) {
    logger.error('Delete area error:', errError)
    return handleApiError(errError)
  }
}
