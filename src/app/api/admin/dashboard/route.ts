import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { queryOne, query } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface CountRow extends RowDataPacket {
  count: number
}

interface RecentUser extends RowDataPacket {
  User_ID:           string
  First_Name:        string
  Last_Name:         string
  User_Type:         string
  Account_Status:    string
  Registration_Date: string
}

export async function GET(req: NextRequest) {
  try {
    const { error } = requireRole(req, ['admin'])
    if (error) return error

    // Total active consumers
    const activeConsumers = await queryOne<CountRow>(
      `SELECT COUNT(*) as count
       FROM User
       WHERE User_Type = 'consumer' AND Account_Status = 'Active'`
    )

    // Pending disconnections
    const pendingDisconnections = await queryOne<CountRow>(
      `SELECT COUNT(*) as count
       FROM DisconnectionRequest
       WHERE Request_Status = 'Pending'`
    )

    // Recent registrations (last 10)
    const recentRegistrations = await query<RecentUser>(
      `SELECT
        User_ID,
        First_Name,
        Last_Name,
        User_Type,
        Account_Status,
        Registration_Date
       FROM User
       ORDER BY Registration_Date DESC
       LIMIT 10`
    )

    return ok({
      totalActiveConsumers:  activeConsumers?.count ?? 0,
      pendingDisconnections: pendingDisconnections?.count ?? 0,
      recentRegistrations:   recentRegistrations.map((u) => ({
        userId:           u.User_ID,
        firstName:        u.First_Name,
        lastName:         u.Last_Name,
        userType:         u.User_Type,
        accountStatus:    u.Account_Status,
        registrationDate: u.Registration_Date,
      })),
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return err('Internal server error', 500)
  }
}