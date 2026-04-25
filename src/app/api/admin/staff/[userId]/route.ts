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
    let { firstName, lastName, contactNo, userType, assignedAreaId } = await req.json()

    const capitalize = (s: string) => s ? s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : s;
    firstName = capitalize(firstName);
    lastName = capitalize(lastName);


    const reqError = validateRequired({ firstName, lastName, contactNo }, ['firstName', 'lastName', 'contactNo'])
    if (reqError) {
      return err(reqError, 400)
    }

    // Check one active meter reader / cashier per service area
    if (assignedAreaId) {
      const activeCount = await queryOne<{ count: number } & RowDataPacket>(
        `SELECT COUNT(*) as count FROM User u
         LEFT JOIN MeterReader mr ON mr.User_ID = u.User_ID
         LEFT JOIN Cashier c ON c.User_ID = u.User_ID
         WHERE u.User_Type = ?
           AND u.Account_Status = 'Active'
           AND u.User_ID != ?
           AND (mr.Assigned_Area_ID = ? OR c.Assigned_Area_ID = ?)`,
        [userType, userId, assignedAreaId, assignedAreaId]
      );
      if (activeCount && activeCount.count > 0) {
        return err(`This Service Area already has an active ${userType === 'meter_reader' ? 'Meter Reader' : 'Cashier'}.`, 409)
      }
    }

    await execute(
      `UPDATE User
       SET First_Name = ?, Last_Name = ?, Contact_No = ?, User_Type = ?
       WHERE User_ID = ?`,
      [firstName, lastName, contactNo, userType, userId]
    )

    if (userType === 'meter_reader' && assignedAreaId) {
      await execute(
        `UPDATE MeterReader SET Assigned_Area_ID = ? WHERE User_ID = ?`,
        [assignedAreaId, userId]
      )
    } else if (userType === 'cashier' && assignedAreaId) {
      await execute(
        `UPDATE Cashier SET Assigned_Area_ID = ? WHERE User_ID = ?`,
        [assignedAreaId, userId]
      )
    }

    return ok(null, 'Staff account updated successfully')

  } catch (error) {
    logger.error('Update staff error:', error)
    return handleApiError(error)
  }
}
