import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
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
    const { firstName, lastName, contactNo, userType } = await req.json()

    if (!firstName || !lastName || !contactNo) {
      return err('All fields are required', 400)
    }

    await execute(
      `UPDATE User
       SET First_Name = ?, Last_Name = ?, Contact_No = ?, User_Type = ?
       WHERE User_ID = ?`,
      [firstName, lastName, contactNo, userType, userId]
    )

    return ok(null, 'Staff account updated successfully')

  } catch (error) {
    console.error('Update staff error:', error)
    return err('Internal server error', 500)
  }
}