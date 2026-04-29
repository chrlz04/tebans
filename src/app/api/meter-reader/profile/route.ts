import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ProfileRow extends RowDataPacket {
  User_ID:          string
  First_Name:       string
  Last_Name:        string
  Contact_No:       string
  Assigned_Area_ID: string
  Assigned_Area:    string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['meter_reader'])
    if (error) return error

    const profile = await queryOne<ProfileRow>(
      `SELECT
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Contact_No,
        mr.Assigned_Area_ID,
        a.Name AS Assigned_Area
       FROM User u
       JOIN MeterReader mr ON mr.User_ID = u.User_ID
       LEFT JOIN Area a ON mr.Assigned_Area_ID = a.Area_ID
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
      assignedAreaId: profile.Assigned_Area_ID,
      assignedArea:   profile.Assigned_Area,
    })

  } catch (error) {
    console.error('Get meter reader profile error:', error)
    return err('Internal server error', 500)
  }
}