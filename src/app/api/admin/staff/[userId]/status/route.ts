import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateAccountStatus } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { execute } from '@/lib/db-helpers'

// ── PATCH /api/admin/staff/[userId]/status ────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { userId } = await params
    const { status } = await req.json()


    if (!validateAccountStatus(status)) {
      return err('Invalid status value', 400)
    }

    await execute(
      'UPDATE User SET Account_Status = ? WHERE User_ID = ?',
      [status, userId]
    )

    return ok(null, `Account ${status === 'Active' ? 'activated' : 'deactivated'} successfully`)

  } catch (error) {
    logger.error('Toggle staff status error:', error)
    return handleApiError(error)
  }
}