import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ProfileRow extends RowDataPacket {
  User_ID:       string
  First_Name:    string
  Last_Name:     string
  Contact_No:    string
  Cashier_ID:    string
  Assigned_Area: string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['cashier'])
    if (error) return error

    const profile = await queryOne<ProfileRow>(
      `SELECT
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        c.Cashier_ID,
        c.Assigned_Area
       FROM User u
       JOIN Cashier c ON c.User_ID = u.User_ID
       WHERE u.User_ID = ?`,
      [payload!.userId]
    )

    if (!profile) {
      return err('Profile not found', 404)
    }

    return ok({
      userId:       profile.User_ID,
      firstName:    profile.First_Name,
      lastName:     profile.Last_Name,
      contactNo:    profile.Contact_No,
      cashierId:    profile.Cashier_ID,
      assignedArea: profile.Assigned_Area,
    })

  } catch (error) {
    console.error('Get cashier profile error:', error)
    return err('Internal server error', 500)
  }
}
