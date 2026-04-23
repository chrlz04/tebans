import { NextRequest } from 'next/server'
import { requireRole, ok, err } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'
import { logger } from '@/lib/logger'
import { queryOne } from '@/lib/db-helpers'
import { RowDataPacket } from 'mysql2'

interface ConsumerProfileRow extends RowDataPacket {
  Consumer_ID:    string
  First_Name:     string
  Last_Name:      string
  Address:        string
  Province:       string
  Municipality:   string
  Barangay:       string
  Area_ID:        string
  Area_Name:      string
  Meter_Serial_No: string
  Contact_No:     string
  Account_Status: string
}

export async function GET(req: NextRequest) {
  try {
    const { error, payload } = requireRole(req, ['consumer'])
    if (error) return error

    // payload!.userId is now the User_ID for consumer, so we join using that.
    // However, maybe consumer endpoint expects Consumer_ID as the payload user ID?
    // In auth/login, we use `user.User_ID` which is the User's ID. Wait, let's look at what payload.userId contains.
    // In login route: account.User_ID. For consumers it used to be c.Consumer_ID AS User_ID.
    // But now we use `u.User_ID` directly. Let's make sure we query by User_ID.
    const profile = await queryOne<ConsumerProfileRow>(
      `SELECT
        c.Consumer_ID,
        u.First_Name,
        u.Last_Name,
        c.Address,
        c.Province,
        c.Municipality,
        c.Barangay,
        c.Area_ID,
        a.Name AS Area_Name,
        c.Meter_Serial_No,
        u.Contact_No,
        u.Account_Status
       FROM Consumer c
       JOIN User u ON u.User_ID = c.User_ID
       LEFT JOIN Area a ON a.Area_ID = c.Area_ID
       WHERE c.User_ID = ?`,
      [payload!.userId]
    )

    if (!profile) {
      return err('Consumer profile not found', 404)
    }

    return ok({
      consumerId:    profile.Consumer_ID,
      firstName:     profile.First_Name,
      lastName:      profile.Last_Name,
      address:       profile.Address,
      province:      profile.Province,
      municipality:  profile.Municipality,
      barangay:      profile.Barangay,
      areaId:        profile.Area_ID,
      areaName:      profile.Area_Name,
      meterSerialNo: profile.Meter_Serial_No,
      contactNo:     profile.Contact_No,
      accountStatus: profile.Account_Status,
    })

  } catch (error) {
    logger.error('Get consumer profile error:', error)
    return handleApiError(error)
  }
}