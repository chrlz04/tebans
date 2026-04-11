import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { validateRequired } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { execute, queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface UserRow extends RowDataPacket {
  User_ID:   string
  User_Type: string
}

// ── PUT /api/admin/staff/[userId] ─────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    const { userId }  = await params
    const { firstName, lastName, contactNo, userType, assignedArea } = await req.json()


    const reqError = validateRequired({ firstName, lastName, contactNo }, ['firstName', 'lastName', 'contactNo'])
    if (reqError) {
      return err(reqError, 400)
    }

    await execute(
      `UPDATE User
       SET First_Name = ?, Last_Name = ?, Contact_No = ?, User_Type = ?
       WHERE User_ID = ?`,
      [firstName, lastName, contactNo, userType, userId]
    )

    if (userType === 'meter_reader' && assignedArea) {
      await execute(
        `UPDATE MeterReader SET Assigned_Area = ? WHERE User_ID = ?`,
        [assignedArea, userId]
      )
    } else if (userType === 'cashier' && assignedArea) {
      await execute(
        `UPDATE Cashier SET Assigned_Area = ? WHERE User_ID = ?`,
        [assignedArea, userId]
      )
    }

    return ok(null, 'Staff account updated successfully')

  } catch (error) {
    logger.error('Update staff error:', error)
    return handleApiError(error)
  }
}
