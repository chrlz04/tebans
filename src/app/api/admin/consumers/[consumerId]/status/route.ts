import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateAccountStatus } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { execute } from '@/lib/db-helpers'

// ── PATCH /api/admin/consumers/[consumerId]/status ────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ consumerId: string }> }
) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { consumerId } = await params
    const { status }     = await req.json()


    if (!validateAccountStatus(status)) {
      return err('Invalid status value', 400)
    }

    await execute(
      `UPDATE User u
       JOIN Consumer c ON c.User_ID = u.User_ID
       SET u.Account_Status = ?
       WHERE c.Consumer_ID = ?`,
      [status, consumerId]
    )

    return ok(null, `Consumer account ${status === 'Active' ? 'activated' : 'deactivated'} successfully`)

  } catch (error) {
    logger.error('Toggle consumer status error:', error)
    return handleApiError(error)
  }
}