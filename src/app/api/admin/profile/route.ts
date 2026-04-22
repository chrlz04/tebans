import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ProfileRow extends RowDataPacket {
  User_ID:         string
  First_Name:      string
  Last_Name:       string
  Contact_No:      string
  Admin_ID:        string
  Clearance_Level: number
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['admin'])
    if (error) return error

    const profile = await queryOne<ProfileRow>(
      `SELECT
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        a.Admin_ID,
        a.Clearance_Level
       FROM User u
       JOIN Admin a ON a.User_ID = u.User_ID
       WHERE u.User_ID = ?`,
      [payload!.userId]
    )

    if (!profile) {
      return err('Profile not found', 404)
    }

    return ok({
      userId:         profile.User_ID,
      firstName:      profile.First_Name,
      lastName:       profile.Last_Name,
      contactNo:      profile.Contact_No,
      adminId:        profile.Admin_ID,
      clearanceLevel: profile.Clearance_Level,
    })

  } catch (error) {
    console.error('Get admin profile error:', error)
    return err('Internal server error', 500)
  }
}
