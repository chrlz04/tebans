import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'
import { handleApiError } from '@/lib/error-handler'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { id } = await params

    if (!id) {
      return err('Disconnection Request ID is required', 400)
    }

    // Verify it exists and is Pending
    const record = await queryOne<{ Request_Status: string } & RowDataPacket>(
      'SELECT Request_Status FROM DisconnectionRequest WHERE DisconnectionRequest_ID = ?',
      [id]
    )

    if (!record) {
      return err('Disconnection request not found', 404)
    }

    if (record.Request_Status !== 'Pending') {
      return err(`Cannot execute a disconnection request that is already ${record.Request_Status}`, 400)
    }

    // Update status to Executed
    await execute(
      'UPDATE DisconnectionRequest SET Request_Status = ? WHERE DisconnectionRequest_ID = ?',
      ['Executed', id]
    )

    return ok({ success: true, message: 'Disconnection request marked as executed' })
  } catch (error) {
    console.error('Execute disconnection error:', error)
    return handleApiError(error)
  }
}
